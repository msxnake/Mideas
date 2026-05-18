/**
 * @fileoverview Game Flow Generator - GameFlow-Based Execution Engine
 * Generates complete GameFlow execution system based on node graph
 * 
 * Architecture: GameFlow is the SOLE orchestrator of game execution.
 * The ASM code follows the graph structure exclusively, starting from
 * the Start node and executing each connected node in sequence.
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { MSX1_PALETTE } from '../../../constants';
import type { ExecutionPlan } from '../types/executionTypes';
import { buildMSXDirectionalSpriteCatalog } from '../../../components/utils/spriteUtils';
import { buildResourceIdLabelFromAsmLabel } from '../utils/megaromResourceArtifacts';
import { generateComponentTriggerHelpers } from './componentsGenerator';

function hasFrameAudio(analysis: ProjectAnalysis): boolean {
  return ((analysis.tracks?.length || 0) > 0) || ((analysis.sounds?.length || 0) > 0);
}

function shouldTickAudioInGameFlow(analysis: ProjectAnalysis, executionPlan?: ExecutionPlan): boolean {
  if (!hasFrameAudio(analysis)) {
    return false;
  }
  return !executionPlan?.tasks.some((task) => task.responsibility === 'audio');
}

function buildGameFlowAudioTickAsm(analysis: ProjectAnalysis, executionPlan?: ExecutionPlan): string {
  if (!shouldTickAudioInGameFlow(analysis, executionPlan)) {
    return '';
  }
  return '    call task_audio_tick\n';
}

function shouldEmitComponentTriggerHelpersInGameFlow(_analysis: ProjectAnalysis, _romMode: string): boolean {
  // Trigger helpers are component-owned routines. Emitting them from GameFlow in
  // MegaROM creates duplicate labels in a far overlay, so component code can
  // resolve calls to an address that is only valid while that overlay is mapped.
  return false;
}

/**
 * Sanitize node ID for use in ASM labels
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function replaceAsmLabelRange(asm: string, startLabel: string, endLabel: string, replacement: string): string {
  const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = endLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedStart}:[\\s\\S]*?(?=^${escapedEnd}:)`, 'm');
  return asm.replace(pattern, replacement.trimEnd() + '\n\n');
}

function gameFlowHasControlTransferToLabel(asm: string, label: string): boolean {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b(?:call|jp|jr)\\s+${escapedLabel}\\b`, 'i').test(asm);
}

function stripUnusedGameFlowUtilityBlocks(asm: string): string {
  let optimizedAsm = asm;
  const utilityRanges = [
    ['init_psg_silence', 'clear_sprite_table'],
    ['clear_sprite_table', 'clear_vram_areas'],
    ['clear_vram_areas', 'reset_vdp_registers'],
    ['reset_vdp_registers', 'init_all_global_variables'],
  ] as const;

  utilityRanges.forEach(([startLabel, endLabel]) => {
    if (!gameFlowHasControlTransferToLabel(optimizedAsm, startLabel)) {
      optimizedAsm = replaceAsmLabelRange(optimizedAsm, startLabel, endLabel, '');
    }
  });

  return optimizedAsm;
}

/**
 * Normalize text for ASM string literals used in generated labels/data.
 */
function sanitizeAsmText(value: any): string {
  return String(value || '')
    .replace(/"/g, '')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Convert hex color to MSX color code (0-15).
 * Matches the mapping strategy used by menusGenerator.
 */
function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  const clean = String(hex || '').trim();
  if (!clean || clean.toLowerCase().startsWith('rgba(0,0,0,0')) return null;
  const normalized = clean.replace('#', '');
  if (normalized.length !== 6) return null;

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;

  return { r, g, b };
}

function hexToMSX1Index(hex: string, allowTransparent = true): number {
  const raw = String(hex || '').trim();
  if (!raw) return allowTransparent ? 0 : 1;
  if (raw.toLowerCase().startsWith('rgba(0,0,0,0')) return allowTransparent ? 0 : 1;

  const upper = raw.toUpperCase();
  const exact = MSX1_PALETTE.find((c) => c.hex.toUpperCase() === upper);
  if (exact) return exact.index;

  const rgb = hexToRGB(raw);
  if (!rgb) return allowTransparent ? 0 : 1;

  let bestIndex = allowTransparent ? 0 : 1;
  let bestDist = Infinity;
  for (const c of MSX1_PALETTE) {
    if (!allowTransparent && c.index === 0) continue;
    const cRgb = hexToRGB(c.hex);
    if (!cRgb) continue;
    const dist = (rgb.r - cRgb.r) ** 2 + (rgb.g - cRgb.g) ** 2 + (rgb.b - cRgb.b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = c.index;
    }
  }

  return bestIndex;
}

function hexToMSXColor(hex: string): number {
  const idx = hexToMSX1Index(hex, false);
  return idx === 0 ? 1 : idx;
}

/**
 * Find sprite asset index by id in analysis.sprites.
 */
function findSpriteAssetIndex(analysis: ProjectAnalysis, spriteAssetId: any): number {
  const id = String(spriteAssetId || '').trim();
  if (!id) return -1;
  const sprites = Array.isArray(analysis.sprites) ? analysis.sprites : [];
  return sprites.findIndex((s: any) => String(s?.id || '').trim() === id);
}

/**
 * Analyze drawable layer indexes in a sprite (used at least once).
 */
function analyzeDrawableLayerIndexes(sprite: any): number[] {
  const palette: string[] = sprite?.spritePalette || [];
  const bg: string | undefined = sprite?.backgroundColor;
  const frames = sprite?.frames || [];

  if (!palette.length || !frames.length) return [];
  const used: number[] = [];

  for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
    const layerColor = palette[layerIdx];
    if (!layerColor || layerColor === bg) continue;

    let hasPixels = false;
    for (const frame of frames) {
      if (!frame?.data) continue;
      for (let y = 0; y < (frame.data.length || 0) && !hasPixels; y++) {
        for (let x = 0; x < (frame.data[y]?.length || 0) && !hasPixels; x++) {
          if (frame.data[y][x] === layerColor) {
            hasPixels = true;
          }
        }
      }
      if (hasPixels) break;
    }

    if (hasPixels) {
      used.push(layerIdx);
    }
  }

  return used;
}

/**
 * Build submenu cursor layer config (source pattern offsets + colors).
 * Keeps only drawable colors and clamps to 4 hardware sprite layers.
 */
function getSpriteLayerConfigForSubmenuCursor(sprite: any): { layerOffsets: number[]; layerColors: number[] } {
  const palette: string[] = sprite?.spritePalette || [];
  const bg: string | undefined = sprite?.backgroundColor;
  const usedLayerIndexes = analyzeDrawableLayerIndexes(sprite);
  if (usedLayerIndexes.length === 0) {
    return { layerOffsets: [0], layerColors: [15] };
  }

  const selectedLayers = usedLayerIndexes.slice(0, 4);
  if (selectedLayers.length === 0) {
    return { layerOffsets: [0], layerColors: [15] };
  }

  const layerOffsets = selectedLayers.slice();
  const layerColors = selectedLayers.map((idx) => {
    const hex = palette[idx];
    if (!hex || (bg && hex === bg)) return 0;
    return hexToMSX1Index(hex, true);
  });

  return { layerOffsets, layerColors };
}

/**
 * Resolve submenu selector mode from JSON appearance.
 * Supports aliases for backward/forward compatibility.
 */
function getSubMenuSelectorMode(node: any): 'auto' | 'char' | 'sprite' {
  const raw =
    node?.appearance?.selectorType ??
    node?.appearance?.cursorType ??
    node?.appearance?.cursorMode ??
    node?.selectorType ??
    node?.cursorType ??
    node?.cursorMode;

  const mode = String(raw || '')
    .trim()
    .toLowerCase();

  if (mode === 'char' || mode === 'character' || mode === 'text' || mode === 'glyph') {
    return 'char';
  }
  if (mode === 'sprite' || mode === 'image') {
    return 'sprite';
  }
  return 'auto';
}

/**
 * Choose initial option index for SubMenu nodes.
 * Preview defaults to option 0 unless an explicit index exists.
 */
function getSubMenuInitialOptionIndex(node: any): number {
  const options = Array.isArray(node?.options) ? node.options : [];
  if (options.length === 0) return 0;

  const explicitRaw =
    node?.initialSelection ??
    node?.initialSelectedOption ??
    node?.appearance?.initialSelection ??
    0;
  const explicit = Number(explicitRaw);
  if (!Number.isFinite(explicit)) return 0;
  if (explicit < 0) return 0;
  if (explicit >= options.length) return 0;
  return Math.floor(explicit);
}

function getControlsKeyButton1Mode(node: any): 0 | 1 {
  return String(node?.keyboardButton1 || node?.button1Key || 'SPC').toUpperCase() === 'CTRL' ? 1 : 0;
}

function getControlsKeyButton2Mode(node: any): 0 | 1 {
  return String(node?.keyboardButton2 || node?.button2Key || 'N').toUpperCase() === 'CTRL' ? 1 : 0;
}

function getControlsActionButtonMode(value: any, fallback: 'button1' | 'button2'): 0 | 1 {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized === 'button2' || normalized === 'btn2' || normalized === 'b2' || normalized === '2' ? 1 : 0;
}

function getControlsActionLabel(value: any, fallback: string): string {
  const normalized = sanitizeAsmText(value || fallback).replace(/:/g, '').trim().toUpperCase();
  const label = normalized || fallback.toUpperCase();
  return `${label.slice(0, 10)}:`;
}

/**
 * Convert node type to constant name (e.g., "WorldLink" -> "NODE_TYPE_WORLD_LINK")
 */
function getNodeTypeConstant(nodeType: string): string {
  return `NODE_TYPE_${nodeType
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    }`;
}

/**
 * Get routine name for screen loading
 */
function getScreenLoadRoutineName(screen: { name?: string; id?: string }): string {
  const screenName = (screen.name || 'DEFAULT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
  return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
}

function getSpriteFrameLayerLabel(sprite: any, spriteIndex: number, frameIndex: number, layerIndex: number): string {
  const spriteName = sprite?.name || `sprite_${spriteIndex}`;
  const uniqueName = `${spriteName}_${spriteIndex}`;
  const safeSpriteName = uniqueName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  return `${safeSpriteName}_F${frameIndex}_LAYER${layerIndex}`;
}

function getLocalCodeBankExpr(label: string, useFarCall: boolean): string {
  // In MegaROM, GameFlow can be packed into an overlay bank; the physical bank
  // is only known later when unifiedGenerator places the module.
  return useFarCall ? '__MIDEAS_CURRENT_CODE_BANK__' : `((${label} - #4000) / #2000)`;
}

/**
 * Resolve a global variable reference used by GameFlow nodes.
 * Returns the matching variable definition or null when not found.
 */
function resolveGlobalVariable(variableName: any, analysis: ProjectAnalysis): any | null {
  const rawName = String(variableName || '').trim();
  if (!rawName) return null;

  const toDefaultAsmName = (name: string): string =>
    `global_var_${name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;

  const normalizedInput = rawName.toLowerCase();
  const expectedAsmName = toDefaultAsmName(rawName);
  const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];

  for (const v of globals) {
    const candidateName = String(v?.name || '').trim();
    const candidateAsmName = String(v?.asmName || '').trim();
    if (candidateName && candidateName.toLowerCase() === normalizedInput) {
      return v;
    }
    if (candidateAsmName && candidateAsmName.toLowerCase() === normalizedInput) {
      return v;
    }
    if (candidateName && toDefaultAsmName(candidateName) === expectedAsmName) {
      return v;
    }
  }

  return null;
}

/**
 * Resolve a global variable reference used by GameFlow nodes to a valid ASM symbol.
 * Returns null when the variable does not exist in analysis.globalVariables.
 */
function resolveGlobalVariableAsmName(variableName: any, analysis: ProjectAnalysis): string | null {
  const rawName = String(variableName || '').trim();
  if (!rawName) return null;

  const toDefaultAsmName = (name: string): string =>
    `global_var_${name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;
  const variable = resolveGlobalVariable(rawName, analysis);
  if (!variable) return null;

  const candidateName = String(variable?.name || '').trim();
  const candidateAsmName = String(variable?.asmName || '').trim();
  return candidateAsmName || toDefaultAsmName(candidateName || rawName);
}

function getIfThenElseOperatorId(operator: any): number {
  switch (String(operator || '==').trim()) {
    case '!=':
      return 1;
    case '>':
      return 2;
    case '<':
      return 3;
    case '>=':
      return 4;
    case '<=':
      return 5;
    case '==':
    default:
      return 0;
  }
}

function resolveIfThenElseCompareValue(variable: any, rawCompareValue: any): number {
  if (typeof rawCompareValue === 'boolean') {
    return rawCompareValue ? 1 : 0;
  }

  const parsedNumeric = Number(rawCompareValue);
  if (Number.isFinite(parsedNumeric)) {
    return Math.trunc(parsedNumeric);
  }

  const normalizedCompareValue = String(rawCompareValue ?? '').trim().toLowerCase();
  const values = Array.isArray(variable?.values) ? variable.values : [];
  const matchedValue = values.find((entry: any) => {
    const label = String(entry?.label ?? '').trim().toLowerCase();
    const value = String(entry?.value ?? '').trim().toLowerCase();
    return label === normalizedCompareValue || value === normalizedCompareValue;
  });

  if (matchedValue) {
    if (typeof matchedValue.value === 'boolean') {
      return matchedValue.value ? 1 : 0;
    }
    const parsedMatchedValue = Number(matchedValue.value);
    if (Number.isFinite(parsedMatchedValue)) {
      return Math.trunc(parsedMatchedValue);
    }
  }

  return 0;
}

/**
 * Get imported HUD frame draw routine name for a screen.
 * Returns null when screen has no imported HUD frame snapshot.
 */
function getImportedHudFrameDrawRoutineName(screen: { name?: string; id?: string; hudConfiguration?: any }): string | null {
  const importedCells = screen?.hudConfiguration?.importedFrame?.cells;
  if (!Array.isArray(importedCells) || importedCells.length === 0) {
    return null;
  }

  const hasUsableSnapshot = importedCells.some((cell: any) => {
    if (cell?.tileId) return true;
    const charCode = Number(cell?.charCode);
    return Number.isFinite(charCode) && charCode > 0;
  });
  if (!hasUsableSnapshot) {
    return null;
  }

  const screenName = (screen.name || 'DEFAULT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
  return `hud_imported_frame_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_draw`;
}

/**
 * Resolve runtime screen indexes where HUD must stay active.
 * In world-based projects, a HUD/imported frame bootstrapped on any node of a world
 * must keep refreshing on every node of that same world because screen transitions
 * preserve the non-active HUD area between rooms.
 * Without worlds, fallback to screen array index.
 */
function getHudRuntimeScreenIndexes(analysis: ProjectAnalysis): number[] {
  const screenMaps = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
  const hudCarrierScreenAssetIds = new Set<string>();
  screenMaps.forEach((screen: any) => {
    const hasHudElems = Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0;
    const hasImportedHudFrame = Array.isArray(screen?.hudConfiguration?.importedFrame?.cells)
      && screen.hudConfiguration.importedFrame.cells.length > 0
      && screen.hudConfiguration.importedFrame.cells.some((cell: any) => {
        if (cell?.tileId) return true;
        const charCode = Number(cell?.charCode);
        return Number.isFinite(charCode) && charCode > 0;
      });
    if (!screen?.id) {
      return;
    }
    if (hasHudElems || hasImportedHudFrame) {
      hudCarrierScreenAssetIds.add(String(screen.id));
    }
  });

  if (hudCarrierScreenAssetIds.size === 0) return [];

  const worldMaps = Array.isArray((analysis as any).worldmaps) ? (analysis as any).worldmaps : [];
  const runtimeIndexes = new Set<number>();

  if (worldMaps.length > 0) {
    worldMaps.forEach((world: any) => {
      const nodes = Array.isArray(world?.nodes) ? world.nodes : [];
      const worldHasHudCarrier = nodes.some((node: any) =>
        hudCarrierScreenAssetIds.has(String(node?.screenAssetId || ''))
      );
      if (!worldHasHudCarrier) {
        return;
      }
      nodes.forEach((node: any, idx: number) => {
        if (node?.screenAssetId) {
          runtimeIndexes.add(idx);
        }
      });
    });
  } else {
    screenMaps.forEach((screen: any, idx: number) => {
      if (screen?.id && hudCarrierScreenAssetIds.has(String(screen.id))) {
        runtimeIndexes.add(idx);
      }
    });
  }

  return Array.from(runtimeIndexes).sort((a, b) => a - b);
}

function projectHasBossRuntime(analysis: ProjectAnalysis): boolean {
  const hasBossAssets = (analysis.bosses?.length || 0) > 0;
  const hasBossInstances = (analysis.screenMaps || []).some((screen: any) =>
    Array.isArray(screen?.bossInstances) && screen.bossInstances.length > 0
  );
  return hasBossAssets || hasBossInstances;
}

/**
 * Emit conditional HUD rendering for current_screen_id.
 */
function generateConditionalRenderHudAsm(
  runtimeScreenIndexes: number[],
  labelBase: string,
  setDirtyBeforeRender = false
): string {
  if (runtimeScreenIndexes.length === 0) return '';

  let code = `    ld a, (current_screen_id)\n`;
  runtimeScreenIndexes.forEach((screenId) => {
    code += `    cp ${screenId}\n`;
    code += `    jp z, .${labelBase}_do\n`;
  });
  code += `    jp .${labelBase}_skip\n`;
  code += `.${labelBase}_do:\n`;
  if (setDirtyBeforeRender) {
    code += `    ld a, 1\n`;
    code += `    ld (hud_dirty_flag), a\n`;
  }
  code += `    call render_hud\n`;
  code += `.${labelBase}_skip:\n`;
  return code;
}

function buildPreservedFrameAudioTickAsm(frameAudioTickAsm: string): string {
  if (!frameAudioTickAsm.trim()) {
    return '';
  }
  return `    push bc
    push de
    push hl
${frameAudioTickAsm}    pop hl
    pop de
    pop bc
`;
}

/**
 * Emit PresentationScreen waits in GameFlow for MegaROM builds.
 *
 * The screen image itself can live in a far `screens_code` overlay, but waits
 * with HALT/input polling must run after the far-call trampoline has restored
 * the mapper window. Keeping the wait here avoids holding ASCII8 P2 on a
 * screen overlay while GameFlow expects resident/runtime code to remain stable.
 */
function buildGameFlowPresentationWaitAsm(analysis: ProjectAnalysis): string {
  const runtime = analysis.presentationScreen?.runtime;
  if (!runtime) {
    return '';
  }

  let code = '';
  const waitFrames = Math.max(0, Math.min(255, Math.floor(Number(runtime.waitForFrames) || 0)));
  if (waitFrames > 0) {
    code += `    ld b, ${waitFrames}
    call gameflow_presentation_wait_frames
`;
  }
  if (runtime.waitForKey) {
    code += `    call gameflow_presentation_wait_for_fire
`;
  }
  return code;
}

function generateGameFlowPresentationWaitHelpers(analysis: ProjectAnalysis, frameAudioTickAsm: string): string {
  const waitAsm = buildGameFlowPresentationWaitAsm(analysis);
  if (!waitAsm) {
    return '';
  }

  const audioTickAsm = buildPreservedFrameAudioTickAsm(frameAudioTickAsm);
  return `; ------------------------------------------------------------------
; PresentationScreen wait helpers for MegaROM GameFlow.
; These run after show_presentation_screen_image_far has restored mapper P2.
; ------------------------------------------------------------------
; gameflow_presentation_wait_frames
; Input:  B = frame count
; Output: none
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
; @mideas:block id=runtime.gameflow.presentation_wait_frames kind=routine owner=gameflow
gameflow_presentation_wait_frames:
    push bc
    ld a, b
    or a
    jr z, .gfpwf_done
.gfpwf_loop:
    ei
    halt
${audioTickAsm}    djnz .gfpwf_loop
.gfpwf_done:
    pop bc
    ret
; @mideas:endblock id=runtime.gameflow.presentation_wait_frames

; gameflow_presentation_wait_for_fire
; Wait for SPACE press and release using keyboard matrix row 8 bit 0.
; Output: none
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
gameflow_presentation_wait_for_fire:
.gfpwff_wait_press:
    ei
    halt
${audioTickAsm}    call gameflow_presentation_read_fire_direct
    or a
    jr z, .gfpwff_wait_press
.gfpwff_wait_release:
    ei
    halt
${audioTickAsm}    call gameflow_presentation_read_fire_direct
    or a
    jr nz, .gfpwff_wait_release
    ret

; gameflow_presentation_read_fire_direct
; Output: A = 1 when SPACE is pressed, A = 0 otherwise
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
gameflow_presentation_read_fire_direct:
    ; GameFlow confirm waits are not timing-critical. Use BIOS SNSMAT here
    ; so OpenMSX key injection and real keyboard scanning follow the same path.
    push bc
    push de
    push hl
    ld a, 8
    call SNSMAT
    pop hl
    pop de
    pop bc
    bit 0, a
    jr z, .gfprd_pressed
    xor a
    ret
.gfprd_pressed:
    ld a, 1
    ret

`;
}

/**
 * Generate complete GameFlow file (gameflow.asm)
 * 
 * This is the CORE of the new architecture. It generates:
 * 1. GameFlow execution engine (dispatcher)
 * 2. Node handlers for each node type
 * 3. Node data structures
 * 4. Connection tables
 * 
 * @param analysis - Project analysis with GameFlow data
 * @returns Complete ASM code for GameFlow execution
 */
export function generateGameFlowFile(
  analysis: ProjectAnalysis,
  executionPlan?: ExecutionPlan,
  romMode: string = 'simple32k'
): string {
  // If no GameFlow exists, generate a minimal default one
  if (!analysis.gameFlow) {
    return generateDefaultGameFlow(analysis, executionPlan, romMode);
  }

  const gameFlow = analysis.gameFlow;
  const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);
  const useFarCall = romMode === 'megarom';

  let code = `; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${gameFlow.name || 'Unnamed'}
; Total Nodes: ${gameFlow.nodes?.length || 0}
; Total Connections: ${gameFlow.connections?.length || 0}
; Start Node: ${gameFlow.startNodeId || 'NONE'}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;

  // ===================================================================
  // SECTION 1: GAMEFLOW INITIALIZATION AND ENTRY POINT
  // ===================================================================

  code += `; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    ; Initialize GameFlow system
    ; Reset state
    xor a
    ld (gameflow_exit_requested), a
    ld (current_flow_state), a
    ld (gameflow_deferred_game_init), a
    ld (gameflow_reveal_world_after_load), a
    ret

; Main entry point - called from init_rom
; This is where the game STARTS
gameflow_start:
    ; Load the Start node
${gameFlow.startNodeId ? `    ld hl, gameflow_node_${sanitizeId(gameFlow.startNodeId)}` : `    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`;

  // ===================================================================
  // SECTION 2: CORE EXECUTION ENGINE
  // ===================================================================

  code += `; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

; Execute a GameFlow node
; Input: HL = address of node structure
; 
; Node Structure:
;   +0: Node type (byte)
;   +1-2: Data pointer (word) - node-specific data
;   +3-4: Connection table pointer (word)
;
gameflow_execute_node:
    ; Read node type
    ld a, (hl)
    inc hl
    
    ; Save data pointer and connection table pointer for handlers
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = data pointer
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)      ; BC = connection table pointer
    
    ; DE = node data, BC = connection table
    ; Dispatch based on node type
`;

  // Generate dispatcher for all node types present in this GameFlow
  const nodeTypes = Array.from(new Set(gameFlow.nodes?.map((n: any) => n.type) || []));

  nodeTypes.forEach((nodeType: any) => {
    const handlerLabel = `gameflow_handle_${nodeType.toLowerCase()}`;
    code += `    cp ${getNodeTypeConstant(nodeType)}
    jp z, ${handlerLabel}
`;
  });

  code += `    
    ; Unknown node type - error
    ret

`;

  // ===================================================================
  // SECTION 3: NODE TYPE HANDLERS
  // ===================================================================

  code += `; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`;

  code += generateNodeHandlers(nodeTypes, analysis, executionPlan, romMode);

  // ===================================================================
  // SECTION 4: CONNECTION UTILITIES
  // ===================================================================

  code += `; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

; Get next node from connection table (for simple single-connection nodes)
; Input: BC = connection table pointer
; Output: HL = next node address (or 0 if none)
gameflow_get_default_connection:
    ; Connection table format:
    ;   db CONNECTION_TYPE
    ;   dw NODE_ADDRESS
    ;   db CONNECTION_END
    
    ld h, b
    ld l, c
    ld a, (hl)
    cp CONNECTION_END
    jr z, .no_connection
    
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = next node address
    ret

.no_connection:
    ld hl, 0
    ret

; Get connection by type
; Input: BC = connection table pointer, A = connection type to find
; Output: HL = next node address (or 0 if not found)
; Preserves: BC, DE
; Clobbers: AF, HL
; @mideas:block id=runtime.gameflow.connection_by_type kind=routine owner=gameflow
gameflow_get_connection_by_type:
    push bc
    push de
    ld d, a         ; Save connection type
    ld h, b
    ld l, c

.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found

    cp d
    jr z, .found

    ; OPTIMIZED: Skip this entry using ADD (11 cycles vs 3× INC = 18 cycles)
    ld bc, 3        ; Entry size: 1 byte type + 2 bytes address
    add hl, bc
    jr .search_loop

.found:
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    pop de
    pop bc
    ret

.not_found:
    ld hl, 0
    pop de
    pop bc
    ret
; @mideas:endblock id=runtime.gameflow.connection_by_type

; Connection type constants
CONNECTION_DEFAULT      EQU 0
CONNECTION_THEN         EQU 1
CONNECTION_ELSE         EQU 2
CONNECTION_OPTION_0     EQU 10
CONNECTION_OPTION_1     EQU 11
CONNECTION_OPTION_2     EQU 12
CONNECTION_OPTION_3     EQU 13
CONNECTION_OPTION_4     EQU 14
CONNECTION_OPTION_5     EQU 15
CONNECTION_END          EQU 255

; Shared data pointer for nodes without data
gameflow_no_data:
    db #C9                        ; RET instruction - returns immediately

; ------------------------------------------------------------------
; gameflow_read_confirm_direct
; Read submenu/text confirm input directly from keyboard matrix.
; Output: A = 1 when SPACE is pressed, A = 0 otherwise
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
; ------------------------------------------------------------------
; @mideas:block id=runtime.gameflow.confirm_input_direct kind=routine owner=gameflow
gameflow_read_confirm_direct:
    ; Keep menu/text confirmation on BIOS SNSMAT; this runs outside the
    ; gameplay hot path and avoids direct PPI keyboard edge cases.
    push bc
    push de
    push hl
    ld a, 8
    call SNSMAT
    pop hl
    pop de
    pop bc
    bit 0, a
    jr z, .grcd_pressed
    xor a
    ret
.grcd_pressed:
    ld a, 1
    ret
; @mideas:endblock id=runtime.gameflow.confirm_input_direct

`;

  // ===================================================================
  // SECTION 5: GAME LOOP (for WorldLink nodes)
  // ===================================================================

  // HUD is rendered only on runtime screens that actually contain HUD elements.
  const hudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
  const hasHud = hudRuntimeScreenIndexes.length > 0;
  const timeRemainingAsmName = resolveGlobalVariableAsmName('TimeRemaining', analysis);
  const hasScreenTimer = !!timeRemainingAsmName;
  const hasSfxAssets = (analysis.sounds?.length || 0) > 0;
  const bossUpdateAsm = projectHasBossRuntime(analysis)
    ? `    call update_boss_system

`
    : '';
  const worldLoopHudRenderAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldloop_hud');
  const worldLinkHudBootstrapAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldlink_hud', true);

  code += `; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
; @mideas:block id=runtime.gameflow.world_loop kind=routine owner=gameflow roots=gameflow_world_game_loop
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Frame sync first: start each tick exactly on V-Blank edge
    halt
${frameAudioTickAsm}    ; Poll input immediately after V-Blank edge so the hero uses
    ; the freshest input state in the same visible frame.
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_pre_update
    call task_update_input
    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_pre_update
    call update_player_fastpath
.skip_player_fastpath_pre_update:

${hasScreenTimer ? `    ; Update per-screen countdown timer (60 seconds per stage)
    call update_world_screen_timer
` : ``}

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_before_sm
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_before_sm

    ; Refresh player deadly-tile state before state machines consume it.
    call refresh_player_deadly_fastpath

    ; Refresh player tile interactions without running bonus respawns twice.
    call refresh_player_tile_interaction_fastpath

    ; Run the player state machine before the generic SM sweep.
    call refresh_player_state_machine_fastpath
.skip_player_fastpath_before_sm:

    ; Execute all state machines
    call execute_all_state_machines

    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_post_update
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_post_update

    ; WallGrab owns the visible sprite while the grab button is held.
    ; Re-apply it after StateMachine actions so idle/jump/walk sprites
    ; cannot win the frame immediately before animation/sprite refresh.
    call refresh_player_wallgrab_fastpath
    call update_wallgrab_component

${hasSfxAssets ? `    ; Update timed PSG sound effects
    call sfx_update

` : ``}    ; Refresh player animation with the final state of this frame.
    call refresh_player_animation_fastpath

    ; Refresh player sprite once with the final state of this frame.
    call refresh_player_sprite_fastpath
.skip_player_fastpath_post_update:

${bossUpdateAsm}
    ; Upload sprites after gameplay so the hero position computed this frame
    ; is what gets shown on screen, instead of the previous frame's SAT.
    call update_sprites_to_vram

    ; Animated transform tiles do VRAM read-modify-write, so defer them until
    ; after hero/entity work to keep player response prioritized.
    call update_animated_tiles

    ; Sprite SAT upload runs once per frame, outside ISR.
${hasHud ? `
    ; Render HUD only on screens that define HUD elements
${worldLoopHudRenderAsm}` : ``}
    ; Loop
    jp gameflow_world_game_loop
; @mideas:endblock id=runtime.gameflow.world_loop

`;

  if (hasScreenTimer && timeRemainingAsmName) {
    code += `; ==================================================================
; SCREEN TIMER SUPPORT
; Resets TimeRemaining to 60 on every screen load/transition and
; decrements it once per real second using interrupt_counter deltas.
; ==================================================================
; @mideas:block id=runtime.gameflow.screen_timer kind=routine owner=gameflow roots=get_world_screen_timer_frames_per_second,reload_world_screen_timer_frames,snapshot_world_screen_timer_interrupt_counter,reset_world_screen_timer,update_world_screen_timer

get_world_screen_timer_frames_per_second:
    ld a, (isComputer50HzOr60Hz)
    or a
    ld a, 50
    ret z
    ld a, 60
    ret

reload_world_screen_timer_frames:
    call get_world_screen_timer_frames_per_second
    ld (time_second_frame_counter), a
    ret

snapshot_world_screen_timer_interrupt_counter:
    ld a, (interrupt_counter)
    ld (time_last_interrupt_counter), a
    ld a, (interrupt_counter+1)
    ld (time_last_interrupt_counter+1), a
    ret

reset_world_screen_timer:
    push af
    ld a, (current_screen_engine)
    or a
    jr nz, .world_timer_reset_done
    ld a, 60
    ld (${timeRemainingAsmName}), a
    xor a
    ld (${timeRemainingAsmName}+1), a
    call reload_world_screen_timer_frames
    call snapshot_world_screen_timer_interrupt_counter
${hasHud ? `    ld a, 1
    ld (hud_dirty_flag), a
` : ``}.world_timer_reset_done:
    pop af
    ret

update_world_screen_timer:
    push af
    push bc
    push de
    push hl

    ld a, (current_screen_engine)
    or a
    jp nz, .world_timer_done

    ld a, (${timeRemainingAsmName})
    ld b, a
    ld a, (${timeRemainingAsmName}+1)
    or b
    jp z, .world_timer_done

    ld hl, (interrupt_counter)
    ld de, (time_last_interrupt_counter)
    or a
    sbc hl, de
    jp z, .world_timer_done

    call snapshot_world_screen_timer_interrupt_counter

    ld a, (time_second_frame_counter)
    or a
    jr nz, .world_timer_countdown_loaded
    call reload_world_screen_timer_frames
    ld a, (time_second_frame_counter)

.world_timer_countdown_loaded:
    ld e, a
    call get_world_screen_timer_frames_per_second
    ld c, a

.world_timer_consume_elapsed_frames:
    ld a, h
    or l
    jr z, .world_timer_store_countdown

    ld a, h
    or a
    jr nz, .world_timer_hit_second_boundary
    ld a, l
    cp e
    jr c, .world_timer_partial_consume

.world_timer_hit_second_boundary:
    ld a, l
    sub e
    ld l, a
    jr nc, .world_timer_no_borrow
    dec h
.world_timer_no_borrow:
    ld a, (${timeRemainingAsmName})
    or a
    jr nz, .world_timer_dec_low
    ld a, (${timeRemainingAsmName}+1)
    or a
    jr z, .world_timer_reached_zero
    dec a
    ld (${timeRemainingAsmName}+1), a
    ld a, 255
    ld (${timeRemainingAsmName}), a
    jr .world_timer_after_decrement

.world_timer_dec_low:
    dec a
    ld (${timeRemainingAsmName}), a

.world_timer_after_decrement:
${hasHud ? `    ld a, 1
    ld (hud_dirty_flag), a
` : ``}
    ld a, (${timeRemainingAsmName})
    ld b, a
    ld a, (${timeRemainingAsmName}+1)
    or b
    jr z, .world_timer_reached_zero
    ld e, c
    jr .world_timer_consume_elapsed_frames

.world_timer_partial_consume:
    ld a, e
    sub l
    ld e, a
    xor a
    ld h, a
    ld l, a
    jr .world_timer_store_countdown

.world_timer_reached_zero:
    ld e, c

.world_timer_store_countdown:
    ld a, e
    ld (time_second_frame_counter), a

.world_timer_done:
    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.gameflow.screen_timer

`;
  }

  // ===================================================================
  // SECTION 6: NODE DATA STRUCTURES
  // ===================================================================

  code += `; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`;

  // Generate node structures and connection tables
  if (gameFlow.nodes && gameFlow.nodes.length > 0) {
    gameFlow.nodes.forEach((node: any) => {
      code += generateNodeStructure(node, gameFlow, analysis, romMode);
    });
  }

  // ===================================================================
  // SECTION 6.5: INITIALIZATION UTILITIES
  // ===================================================================

  code += `
; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; init_psg_silence
; Silence all PSG channels
; ------------------------------------------------------------------
init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08    ; Volume register channel A
    out (#A0), a
    ld a, 0      ; Volume = 0
    out (#A1), a

    ; Silence channel B
    ld a, #09    ; Volume register channel B
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A    ; Volume register channel C
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_sprite_table
; Clear sprite attribute table in VRAM
; ------------------------------------------------------------------
clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ; Clear sprite attribute table (#1B00-#1B7F, 128 bytes)
    ld hl, #1B00         ; Sprite attribute table base
    ld bc, 128           ; 128 bytes (32 sprites × 4 bytes)
    ld a, #D1            ; Y=209 (off-screen)
.cst_loop:
    push af
    push bc
    push hl
    call WRTVRM          ; Write to VRAM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .cst_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_vram_areas
; Clear VRAM pattern and color tables
; ------------------------------------------------------------------
clear_vram_areas:
    push af
    push bc
    push de
    push hl

    ; Clear pattern table (#0000-#17FF, 6144 bytes)
    ld hl, #0000
    ld bc, 6144
    ld a, 0
.clear_patterns:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_patterns

    ; Clear color table (#2000-#37FF, 6144 bytes)
    ld hl, #2000
    ld bc, 6144
    ld a, #F0            ; White on black
.clear_colors:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_colors

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; reset_vdp_registers
; Reset VDP registers to Screen 2 defaults
; ------------------------------------------------------------------
reset_vdp_registers:
    push af
    push bc

    ; Already configured in init_rom, this is a no-op for now
    ; Could be extended to reset specific registers if needed

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_all_global_variables
; Initialize all global variables to their default values
; ------------------------------------------------------------------
init_all_global_variables:
`;

  // Generate initialization for all global variables in the project
  if (analysis.globalVariables && analysis.globalVariables.length > 0) {
    code += `    ; Initialize global variables\n`;
    analysis.globalVariables.forEach((v: any) => {
      const varName = v.name;
      const asmVarName = v.asmName || `global_var_${varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
      const type = String(v.type || '').toLowerCase();

      // Use first value from values array as initial value (or 0 if no values).
      // Built-in variables may use placeholder strings like "number"; those are not valid ASM immediates,
      // so any non-numeric placeholder falls back to 0 for ROM initialization.
      const rawInitialValue = v.values && v.values.length > 0 ? v.values[0].value : 0;
      let numericValue = 0;

      if (typeof rawInitialValue === 'boolean') {
        numericValue = rawInitialValue ? 1 : 0;
      } else {
        const parsedValue = Number(rawInitialValue);
        numericValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;
      }

      if (type === 'word' || type === '16bit') {
        const wordValue = Math.max(0, Math.min(65535, numericValue));
        code += `    ld a, ${wordValue & 0xFF}\n`;
        code += `    ld (${asmVarName}), a    ; ${varName} low byte = ${wordValue}\n`;
        code += `    ld a, ${(wordValue >> 8) & 0xFF}\n`;
        code += `    ld (${asmVarName}+1), a    ; ${varName} high byte = ${wordValue}\n`;
      } else {
        const byteValue = Math.max(0, Math.min(255, numericValue));
        code += `    ld a, ${byteValue}\n`;
        code += `    ld (${asmVarName}), a    ; ${varName} = ${byteValue}\n`;
      }
    });
  }

  code += `    ret

`;

  // ===================================================================
  // SECTION 7: VARIABLES
  // ===================================================================

  code += `; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

; Runtime GameFlow variables are allocated in variables.asm (RAM EQUs):
; gameflow_exit_requested, gameflow_menu_selection,
; gameflow_submenu_data_ptr, gameflow_submenu_option_count,
; gameflow_submenu_cursor_enabled, gameflow_submenu_cursor_layer_count,
; gameflow_condition_result

; ==================================================================
; COMMON GAMEFLOW UTILITIES
; ==================================================================

; ------------------------------------------------------------------
; Helper: Clear screen area for menus/end screens
; ------------------------------------------------------------------
; @mideas:block id=runtime.gameflow.clear_screen_area_helpers kind=routine owner=gameflow
clear_screen_area:
    ; Clear center area of screen
    ld b, 8                       ; 8 rows
    ld c, 8                       ; Start at row 8

.csa_loop:
    push bc
    ld a, c
    call clear_screen_row
    pop bc
    inc c
    djnz .csa_loop
    ret

; ------------------------------------------------------------------
; Helper: Clear a screen row (fill with empty tile)
; Input: A = Row number (0-23)
; ------------------------------------------------------------------
clear_screen_row:
    push af
    push bc
    push de
    push hl

    ; Calculate row start in name table
    ; Row address = #1800 + (row * 32)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32

    ; Add base address (name table)
    ld de, #1800                  ; Name table base (Screen 2)
    add hl, de                    ; HL = VRAM address

    ; Clear 32 tiles (one row)
    ex de, hl                     ; DE = VRAM destination
    ld hl, empty_row_data         ; HL = source (32 zeros)
    ld bc, 32                     ; Copy 32 bytes
    call LDIRVM

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Data: Empty row (32 zero bytes)
; ------------------------------------------------------------------
empty_row_data:
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
; @mideas:endblock id=runtime.gameflow.clear_screen_area_helpers

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`;

  if (shouldEmitComponentTriggerHelpersInGameFlow(analysis, romMode)) {
    code += generateComponentTriggerHelpers();
  }

  return stripUnusedGameFlowUtilityBlocks(code);
}

/**
 * Generate handlers for all node types
 */
function generateNodeHandlers(
  nodeTypes: string[],
  analysis: ProjectAnalysis,
  executionPlan?: ExecutionPlan,
  romMode: string = 'simple32k'
): string {
  const useFarCall = romMode === 'megarom';
  let code = '';
  const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);

  const hudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
  const hasHud = hudRuntimeScreenIndexes.length > 0;
  const visualNodeTypes = new Set(['WorldLink', 'SubMenu', 'Controls', 'Text', 'TextScroll', 'TextScrollColor', 'End', 'Restart', 'PresentationScreen']);
  const hasTextScrollNode = nodeTypes.includes('TextScroll');
  const hasTextScrollColorNode = nodeTypes.includes('TextScrollColor');
  const needsTransitionRuntime = nodeTypes.includes('Transition') || nodeTypes.some((nodeType) => visualNodeTypes.has(nodeType));
  const baseHandlerNodeTypes = needsTransitionRuntime && !nodeTypes.includes('Transition')
    ? [...nodeTypes, 'Transition']
    : nodeTypes;
  const handlerNodeTypesBase = baseHandlerNodeTypes.filter((nodeType) => nodeType !== 'TextScrollColor');
  const handlerNodeTypes = hasTextScrollColorNode && !handlerNodeTypesBase.includes('TextScroll')
    ? [...handlerNodeTypesBase, 'TextScroll']
    : handlerNodeTypesBase;
  const worldLinkHudBootstrapAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldlink_hud', true);

  handlerNodeTypes.forEach((nodeType: string) => {
    switch (nodeType) {
      case 'Start':
        code += `gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer:
    ;   [init_routine_ptr DW][init_routine_bank DB]
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address
    inc hl
    ld b, (hl)      ; B = initialization routine bank
    ld h, d
    ld l, e         ; HL = initialization routine address

    ; Call initialization routine (if not null)
    ld a, h
    or l
    jr z, .skip_init

    ; Mapper-safe far call (auto window from HL address)
    ld a, b
    call mapper_call_hl_auto

.skip_init:
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

`;
        break;

      case 'WorldLink':
        code += `; @mideas:block id=runtime.gameflow.worldlink kind=routine owner=gameflow roots=gameflow_handle_worldlink
gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer:
    ;   [load_world_ptr DW][load_world_bank DB][init_ptr DW][init_bank DB]
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X, db load_world_bank, dw init_routine, db init_bank
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = load_world_X bank
    inc hl
    push hl         ; Save pointer to optional WorldLink init routine
    ld h, d
    ld l, e         ; HL = load_world_X address

    ; Mapper-safe far call to world load routine
    ld a, h
    or l
    jr z, .after_load
    ld a, b
    call mapper_call_hl_auto

.after_load:
    ; Optional per-world globals initialization
    pop hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = init routine bank
    ld h, d
    ld l, e         ; HL = init routine address
    ld a, h
    or l
    jr z, .after_init
    ld a, b
    call mapper_call_hl_auto

.after_init:
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr z, .after_target_reveal
    xor a
    ld (gameflow_reveal_world_after_load), a
    call ENASCR
    call execute_transition_reveal_target
.after_target_reveal:
    ; Set game state
    xor a
    ld (gameflow_exit_requested), a
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Sync SAT patterns using the slot table just filled by load_world.
    ; force_update_entity_sprite (called during init_entities) ran before
    ; load_sprite_patterns, so sprite_asset_base_pattern_slot_runtime was
    ; all zeros then.  Calling update_sprite_component here recomputes the
    ; correct slot->pattern mapping for all entities in the render list
    ; so the very first update_sprites_to_vram below writes the right data.
    call update_sprite_component

    ; Update sprites
    call update_sprites_to_vram
${hasHud ? `
    ; Bootstrap HUD only on screens that actually use HUD
${worldLinkHudBootstrapAsm}` : ``}
    ; Enter game loop
    call gameflow_world_game_loop

    ; Exited loop - continue to next node
    pop bc          ; Restore connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
; @mideas:endblock id=runtime.gameflow.worldlink

`;
        break;

      case 'End':
        code += `; @mideas:block id=runtime.gameflow.end_screen kind=routine owner=gameflow roots=gameflow_handle_end,display_end_screen,print_string_vram
gameflow_handle_end:
    ; End node - stop execution and show end screen
    ; DE = end screen data pointer (screen type, message pointer)
    ; BC = connection table (unused, end stops execution)

    push de

    ; Get end screen type from data
    ld a, (de)                    ; A = screen type (0=victory, 1=defeat, 2=credits, etc.)
    push af                       ; Save screen type
    inc de
    ld a, (de)                    ; Get low byte of message pointer
    ld l, a
    inc de
    ld a, (de)                    ; Get high byte of message pointer
    ld h, a                       ; HL = message pointer (if any)
    pop af                        ; Restore screen type

    ; Display end screen based on type
    call gameflow_begin_transition_target_render
    call display_end_screen
    call gameflow_finish_transition_target_render

    pop de

    ; End screen loop - wait for input or timeout
.end_screen_loop:
    halt                          ; Wait V-blank
${frameAudioTickAsm}

    ; Avoid BIOS joystick helpers here because they touch the PSG while
    ; VBlank music is writing it. Use keyboard matrix reads only.
    ld a, 8                       ; SPACE row
    call FAST_SNSMAT
    bit 0, a                      ; SPACE
    jr z, .end_screen_exit

    ; Check for ESC key to exit
    ld a, 7                       ; ESC key row
    call FAST_SNSMAT
    bit 2, a                      ; ESC key
    jr z, .end_screen_exit

    jr .end_screen_loop

.end_screen_exit:
    ret

; ------------------------------------------------------------------
; display_end_screen
; Display end screen based on type
; Input:  A = screen type (0=victory, 1=defeat, 2=credits, 3=custom)
;         HL = message pointer (for custom messages)
; ------------------------------------------------------------------
display_end_screen:
    push af
    push hl

    ; Clear screen first
    call clear_screen_area

    pop hl
    pop af

    ; Dispatch based on screen type
    or a
    jr z, .show_victory           ; 0 = Victory
    dec a
    jr z, .show_defeat            ; 1 = Defeat
    dec a
    jr z, .show_credits           ; 2 = Credits
    jr .show_custom               ; 3+ = Custom message

.show_victory:
    ; Display "VICTORY!" message
    ld hl, str_victory
    ld de, #1800 + (10 * 32) + 12 ; Row 10, col 12
    call print_string_vram
    ret

.show_defeat:
    ; Display "GAME OVER" message
    ld hl, str_game_over
    ld de, #1800 + (10 * 32) + 11 ; Row 10, col 11
    call print_string_vram
    ret

.show_credits:
    ; Display "CREDITS" message
    ld hl, str_credits
    ld de, #1800 + (8 * 32) + 13  ; Row 8, col 13
    call print_string_vram
    ; Add more credits lines here if needed
    ret

.show_custom:
    ; Display custom message from HL
    ld de, #1800 + (10 * 32) + 8  ; Row 10, col 8
    call print_string_vram
    ret

; ------------------------------------------------------------------
; Helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; End screen message strings
; ------------------------------------------------------------------
str_victory:
    db "VICTORY!", 0

str_game_over:
    db "GAME OVER", 0

str_credits:
    db "CREDITS", 0
; @mideas:endblock id=runtime.gameflow.end_screen

`;
        break;

      case 'Restart':
        code += `gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;
        break;

      case 'SubMenu':
        {
          // Use the expanded directional sprite catalog so label names match spritesGenerator.
          const spriteCatalog = buildMSXDirectionalSpriteCatalog(analysis.sprites || []);
          const sprites = spriteCatalog.sprites;
          const submenuCursorPatternCount = Math.max(sprites.length, 1);
          let submenuCursorPatternTable = '';
          let submenuCursorLayerPtrTable = '';
          let submenuCursorLayerBankTable = '';
          let submenuCursorLayerResourceTable = '';
          for (let i = 0; i < submenuCursorPatternCount; i++) {
            const sprite = sprites[i];
            submenuCursorPatternTable += useFarCall ? `    dw 0\n` : `    dw SPRITE_${i}_PATTERN\n`;

            const selectedLayers = sprite
              ? analyzeDrawableLayerIndexes(sprite).slice(0, 4)
              : [];

            for (let layerSlot = 0; layerSlot < 4; layerSlot++) {
              const sourceLayerIndex = selectedLayers[layerSlot];
              if (sourceLayerIndex === undefined) {
                submenuCursorLayerPtrTable += `    dw 0\n`;
                submenuCursorLayerBankTable += `    db 0\n`;
                submenuCursorLayerResourceTable += `    db #FF\n`;
                continue;
              }

              const layerLabel = getSpriteFrameLayerLabel(sprite, i, 0, sourceLayerIndex);
              submenuCursorLayerPtrTable += useFarCall ? `    dw 0\n` : `    dw ${layerLabel}\n`;
              submenuCursorLayerBankTable += useFarCall ? `    db 0\n` : `    db ((${layerLabel} - #4000) / #2000)\n`;
              submenuCursorLayerResourceTable += useFarCall
                ? `    db ${buildResourceIdLabelFromAsmLabel(layerLabel)}\n`
                : `    db #FF\n`;
            }
          }

          const submenuPrepareCursorSpriteAsm = useFarCall ? `; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; MegaROM path resolves sprite layer resources by id.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jp z, .sps_done               ; no sprite cursor configured
    ld b, a                       ; B = sprite asset index

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 2
    add hl, de
    ld a, (hl)
    or a
    jp z, .sps_done
    cp 5
    jp c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ld c, 0                       ; C = compact layer slot
.sps_load_loop:
    ld a, (gameflow_submenu_cursor_layer_count)
    cp c
    jp z, .sps_enable_cursor

    ld a, b                       ; A = sprite asset index
    call submenu_get_cursor_layer_resource_id
    jp c, .sps_done

    push bc
    push af                       ; save resource id
    ld a, c
    add a, SUBMENU_CURSOR_BASE_SPRITE
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = sprite slot * 32
    ld de, SPRPAT
    add hl, de
    push hl
    pop de                        ; DE = destination in VRAM
    pop af                        ; A = resource id
    call resource_load_to_vram_by_id
    pop bc

    inc c
    jp .sps_load_loop

.sps_enable_cursor:
    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a

.sps_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

` : `; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_done               ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_done               ; invalid index -> fallback to char marker
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_restore_no_cursor
    cp 5
    jr c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Upload all layers as one contiguous block.
    ; SPRITE_X_PATTERN points to layer0 data; layers are stored sequentially
    ; in ROM so layer_count * 32 bytes covers all of them.
    ; SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32) is an assembly-time constant
    ; (no 8-bit runtime overflow).
    pop hl                        ; HL = source pattern base (SPRITE_X_PATTERN)
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32  (layer_count <= 4, max 128 - fits in A)
    ld c, a
    ld b, 0                       ; BC = layer_count * 32
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call FAST_LDIRVM

.sps_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_done

.sps_restore_no_cursor:
    pop hl

.sps_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

`;

          const submenuCursorResourceHelperAsm = useFarCall ? `; ------------------------------------------------------------------
; submenu_get_cursor_layer_resource_id
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: A = resource id, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_resource_id:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jp nc, .sgcr_invalid
    ld b, a
    ld a, c
    cp 4
    jp nc, .sgcr_invalid

    ; Resource table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_resource_table
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .sgcr_invalid
    or a                          ; clear carry
    ret

.sgcr_invalid:
    scf
    ret

` : '';

        code += `gameflow_handle_submenu:
    ; SubMenu node - interactive navigation
    ; DE points to SubMenu data:
    ;   [bg_color][cursor_sprite_idx][cursor_layer_count]
    ;   [cursor_layer_offsets x4][cursor_colors x4]
    ;   [bg_screen_fn DW][bg_screen_bank DB]
    ;   [option_count][initial_selection][title_ptr][option_ptr_0]...
    push bc
    call show_menu_placeholder
    ld a, (gameflow_menu_selection)
    cp 6
    jr c, .submenu_idx_ok
    ld a, 5                       ; Max supported connection option
.submenu_idx_ok:
    add a, CONNECTION_OPTION_0
    pop bc
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_menu_placeholder
; Runtime GameFlow submenu renderer + input
; Input:  DE = menu data pointer
;   Format: DB bg_color, DB cursor_sprite_idx, DB cursor_layer_count,
;           DB cursor_src_off0..cursor_src_off3,
;           DB cursor_color0..cursor_color3,
;           DW bg_screen_fn, DB bg_screen_bank,
;           DB option_count, DB initial_selection,
;           DW title_ptr, DW option_ptr[n]
; Output: gameflow_menu_selection = selected index (0..5)
; ------------------------------------------------------------------
; @mideas:block id=runtime.gameflow.submenu kind=routine owner=gameflow roots=show_menu_placeholder,render_submenu_screen,submenu_update_cursor_sprite,submenu_hide_cursor_sprite,submenu_get_cursor_pattern_ptr,submenu_get_cursor_layer_source
show_menu_placeholder:
    push bc
    push de
    push hl

    ; Cache menu data pointer
    ld h, d
    ld l, e
    ld (gameflow_submenu_data_ptr), hl

    ; Cache option count (clamped to supported range)
    ; option_count is at offset +14 (+11-12 = bg_screen_fn DW, +13 = bg_screen_bank)
    ld bc, 14
    add hl, bc
    ld a, (hl)
    cp 6
    jr c, .smp_count_ok
    ld a, 6
.smp_count_ok:
    ld (gameflow_submenu_option_count), a

    ; Initialize selected option
    or a
    jr nz, .smp_has_options
    xor a
    ld (gameflow_menu_selection), a
    call gameflow_begin_transition_target_render
    call submenu_prepare_cursor_sprite
    call render_submenu_screen
    call gameflow_finish_transition_target_render
    jp .smp_exit

.smp_has_options:
    ld b, a
    inc hl
    ld a, (hl)                    ; initial_selection
    cp b
    jr c, .smp_sel_ok
    xor a
.smp_sel_ok:
    ld (gameflow_menu_selection), a

    call gameflow_begin_transition_target_render
    call submenu_prepare_cursor_sprite
    call render_submenu_screen
    call gameflow_finish_transition_target_render

.smp_loop:
    halt
${frameAudioTickAsm}
    ; Defensive refresh: some projects keep background/runtime VRAM writers
    ; active while the submenu is idle, which can trample ASCII font chars.
    ; Re-apply the font after each VBlank before polling menu input.
    call init_font_system
    ld a, 0
    call GTSTCK
    cp 1                          ; Up
    jr nz, .smp_check_down

    ld a, (gameflow_menu_selection)
    or a
    jr z, .smp_wait_neutral
    dec a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_down:
    cp 5                          ; Down
    jr nz, .smp_check_fire

    ld a, (gameflow_submenu_option_count)
    dec a                         ; max index
    ld b, a
    ld a, (gameflow_menu_selection)
    cp b
    jr nc, .smp_wait_neutral
    inc a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_fire:
    call gameflow_read_confirm_direct
    or a
    jr z, .smp_loop

.smp_wait_fire_release:
    halt
${frameAudioTickAsm}
    call init_font_system
    call gameflow_read_confirm_direct
    or a
    jr nz, .smp_wait_fire_release
    jp .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
${frameAudioTickAsm}
    call init_font_system
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
    ; Ensure no gameplay/menu sprite remains resident after leaving submenu.
    call clear_all_sprites
    call update_sprites_to_vram
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; render_submenu_screen
; Draw title, options, and selection marker ('>').
; Uses cached pointer/count variables set by show_menu_placeholder.
; ------------------------------------------------------------------
render_submenu_screen:
    push bc
    push de
    push hl

    ; Apply submenu background/border colors from node config.
    ld hl, (gameflow_submenu_data_ptr)
    ld a, (hl)                    ; bg_color
    ld b, a                       ; border = bg
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Load background screen (if configured) or clear solid background.
    ; bg_screen_fn DW is at +11, bg_screen_bank is +13, option_count is +14.
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11
    add hl, bc
    ld e, (hl)                    ; E = bg_screen_fn low
    inc hl
    ld d, (hl)                    ; D = bg_screen_fn high
    inc hl
    ld a, (hl)                    ; A = bg_screen_bank
    ld c, a
    ex de, hl                     ; HL = bg_screen_fn (0 if none)
    ld d, c                       ; D = bg_screen_bank
    ld a, h
    or l
    jr z, .rss_clear_screen       ; no bg screen -> solid clear

    ; Mapper-safe call to background screen loader.
    ld a, d
    call mapper_call_hl_auto
    jr .rss_read_count

.rss_clear_screen:
    ; Clear full visible screen (24 rows) with tile 0 (solid background).
    ld a, 0
    ld b, 24
.rss_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .rss_clear_loop

.rss_read_count:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before printing title/options in submenu.
    call reload_font_system

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 14                     ; offset to option_count (+11-12 fn, +13 bank)
    add hl, bc
    ld a, (hl)                    ; option_count
    cp 6
    jr c, .rss_count_ok
    ld a, 6
.rss_count_ok:
    ld b, a
    or a
    jp z, .rss_done

    inc hl                        ; skip option_count
    inc hl                        ; skip initial_selection

    ; Print title at row 5, horizontally centered (match PC preview Y=40)
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = title pointer
    inc hl                        ; HL = first option pointer
    push hl
    ex de, hl                     ; HL = title string
    call submenu_compute_center_col
    ld c, a                       ; C = centered col
    ld a, 5                       ; A = row 5 (5*8=40px)
    call submenu_calc_vram_addr   ; DE = VRAM addr
    call print_string_vram
    pop hl

    ; Print options from row 10, spaced 2 rows apart (match PC preview Y=80+idx*12)
    ld c, 0
.rss_option_loop:
    ld a, c
    cp b
    jp nc, .rss_done

    ; Read option string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    push hl                        ; Save option pointer cursor
    push de                        ; Save option string pointer
    push bc                        ; Save option_count/index
    ex de, hl                      ; HL = option string

    ; Marker at (centered text col - 2)
    ld a, (gameflow_menu_selection)
    cp c
    ld a, ' '
    jr nz, .rss_marker_ready
    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr nz, .rss_marker_ready      ; sprite cursor active -> keep blank marker
    ld a, '>'
.rss_marker_ready:
    push af
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    sub 2
    jr nc, .rss_marker_col_ok
    xor a
.rss_marker_col_ok:
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    pop af
    ex de, hl
    call WRTVRM

    pop bc                        ; Restore option_count/index
    pop hl                        ; HL = option string pointer

    ; Option text at centered column
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    call print_string_vram

    pop hl                        ; Restore option pointer cursor
    inc c
    jr .rss_option_loop

.rss_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_calc_vram_addr
; Convert row/col to name table VRAM address.
; Input:  A = row (0-23), C = col (0-31)
; Output: DE = VRAM address (#1800 + row*32 + col)
; ------------------------------------------------------------------
submenu_calc_vram_addr:
    push hl
    push bc

    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld b, 0
    add hl, bc                    ; +col
    ld bc, #1800
    add hl, bc                    ; +name table base
    ex de, hl

    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_string_length
; Input: HL = null-terminated string
; Output: A = length in characters (0..255)
; Preserves: HL
; ------------------------------------------------------------------
submenu_string_length:
    push hl
    push bc
    ld c, 0                       ; C = length counter
.ssl_loop:
    ld a, (hl)
    or a                          ; test char for null terminator
    jr z, .ssl_done
    inc c
    inc hl
    jr .ssl_loop
.ssl_done:
    ld a, c                       ; A = string length
    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_compute_center_col
; Input: HL = null-terminated string
; Output: A = centered start column (0..31)
; Preserves: HL
; ------------------------------------------------------------------
submenu_compute_center_col:
    push bc
    call submenu_string_length
    cp 32
    jr c, .scc_len_ok
    xor a
    jr .scc_done
.scc_len_ok:
    ld b, a
    ld a, 32
    sub b
    srl a
.scc_done:
    pop bc
    ret

${submenuPrepareCursorSpriteAsm}
; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite_legacy:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_legacy_done        ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_legacy_done        ; invalid index -> fallback to char marker
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_legacy_restore_no_cursor
    cp 5
    jr c, .sps_legacy_layer_ok
    ld a, 4
.sps_legacy_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Upload all layers as one contiguous block.
    ; SPRITE_X_PATTERN points to layer0 data; layers are stored sequentially
    ; in ROM so layer_count * 32 bytes covers all of them.
    ; SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32) is an assembly-time constant
    ; (no 8-bit runtime overflow).
    pop hl                        ; HL = source pattern base (SPRITE_X_PATTERN)
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32  (layer_count <= 4, max 128 — fits in A)
    ld c, a
    ld b, 0                       ; BC = layer_count * 32
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call FAST_LDIRVM

.sps_legacy_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_legacy_done

.sps_legacy_restore_no_cursor:
    pop hl

.sps_legacy_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_update_cursor_sprite
; Draw or hide submenu cursor sprite according to current selection.
; ------------------------------------------------------------------
submenu_update_cursor_sprite:
    push bc
    push de
    push hl

    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jp z, .sus_hide

    ; Compute cursor Y from selected option row (row = 10 + selection*2)
    ; Y = (10 + selection*2) * 8 - 4 to match PC preview placement.
    ld a, (gameflow_menu_selection)
    add a, a                      ; selection * 2
    add a, 10                     ; + 10 (start row)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 4
    jr nc, .sus_y_ok
    xor a
.sus_y_ok:
    ld c, a                       ; C = Y (pixels)

    ; Resolve selected option pointer and centered text start column.
    ; Header layout (bg_screen_fn DW at +11-12, bg_screen_bank at +13):
    ; +18 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 18
    add hl, de
    ld a, (gameflow_menu_selection)
    add a, a                      ; *2 (DW stride)
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl                     ; HL = selected option string
    call submenu_compute_center_col

    ; X = (start_col * 8) - 16 (sprite width)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 16
    jr nc, .sus_x_ok
    xor a
.sus_x_ok:
    ld b, a                       ; B = X (pixels)

    ; HL -> first cursor color byte (+7)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 7
    add hl, de

    ld a, (gameflow_submenu_cursor_layer_count)
    or a
    jp z, .sus_hide

    ld d, SUBMENU_CURSOR_BASE_SPRITE
.sus_draw_loop:
    push af                       ; [1] save remaining layer count
    ld e, (hl)                    ; E = color for this layer
    push hl                       ; [2] save color pointer
    push de                       ; [3] save D=sprite index, E=color
    ld a, d                       ; A = sprite index (for show_sprite param)
    push af                       ; [4] save A=sprite index
    add a, a
    add a, a
    ld d, a                       ; D = pattern = sprite_index * 4
    pop af                        ; [4] restore A=sprite index
    call show_sprite              ; A=index, B=X, C=Y, D=pattern, E=color
    pop de                        ; [3] restore D=sprite index (E=old color, ignore)
    inc d                         ; next sprite slot
    pop hl                        ; [2] restore color pointer
    inc hl                        ; advance to next layer color
    pop af                        ; [1] restore remaining layer count
    dec a
    jr nz, .sus_draw_loop

    ; Hide unused reserved cursor sprite slots
    ld a, (gameflow_submenu_cursor_layer_count)
    ld e, a
    ld a, SUBMENU_CURSOR_MAX_LAYERS
    sub e
    ld b, a                       ; B = remaining to hide
    ld a, SUBMENU_CURSOR_BASE_SPRITE
    add a, e
    ld d, a                       ; D = first unused sprite slot
    jr .sus_hide_remaining_check

.sus_hide_remaining:
    ld a, d
    call hide_sprite
    inc d
    djnz .sus_hide_remaining

.sus_hide_remaining_check:
    ld a, b
    or a
    jr nz, .sus_hide_remaining
    jr .sus_flush

.sus_hide:
    call submenu_hide_cursor_sprite
    jr .sus_done

.sus_flush:
    call update_sprites_to_vram

.sus_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_hide_cursor_sprite
; Hide reserved cursor sprite slots.
; ------------------------------------------------------------------
submenu_hide_cursor_sprite:
    push bc
    push de

    ld d, SUBMENU_CURSOR_BASE_SPRITE
    ld b, SUBMENU_CURSOR_MAX_LAYERS
.shc_loop:
    ld a, d
    call hide_sprite
    inc d
    djnz .shc_loop
    call update_sprites_to_vram

    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_pattern_ptr
; Input: A = sprite asset index
; Output: HL = SPRITE_<index>_PATTERN, CF=1 on invalid index
; ------------------------------------------------------------------
submenu_get_cursor_pattern_ptr:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcpp_invalid
    ld l, a
    ld h, 0
    add hl, hl
    ld de, submenu_cursor_sprite_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    or a                          ; clear carry
    ret
.sgcpp_invalid:
    scf
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_layer_source
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: HL = source label, A = source bank, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_source:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcls_invalid
    ld b, a
    ld a, c
    cp 4
    jr nc, .sgcls_invalid

    ; Pattern pointer table offset = sprite_index * 8 + layer_slot * 2
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    ld a, c
    add a, a                      ; layer_slot * 2
    ld e, a
    ld d, 0
    add hl, de
    ld de, submenu_cursor_sprite_layer_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr z, .sgcls_invalid
    ex de, hl

    ; Bank table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_bank_table
    add hl, de
    ld a, (hl)
    or a                          ; clear carry
    ret

.sgcls_invalid:
    scf
    ret

${submenuCursorResourceHelperAsm}
SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU ${submenuCursorPatternCount}

submenu_cursor_sprite_pattern_table:
${submenuCursorPatternTable}

submenu_cursor_sprite_layer_pattern_table:
${submenuCursorLayerPtrTable}

submenu_cursor_sprite_layer_bank_table:
${submenuCursorLayerBankTable}

submenu_cursor_sprite_layer_resource_table:
${submenuCursorLayerResourceTable}

; @mideas:endblock id=runtime.gameflow.submenu
`;
        break;
        }

      case 'Controls':
        code += `gameflow_handle_controls:
    ; Controls node - configure keyboard bindings and logical action mapping
    ; DE = controls data pointer:
    ;   [key_button1][key_button2][jump_button][action_button]
    ;   [title_ptr DW][primary_label_ptr DW][secondary_label_ptr DW]
    ; BC = connection table
    push bc
    call show_controls_menu
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_controls_menu
; Runtime controls menu. Defaults are applied before the menu opens,
; so projects can use this node as a fixed preset or let the player edit.
; ------------------------------------------------------------------
show_controls_menu:
    push bc
    push de
    push hl

    ld h, d
    ld l, e
    ld (gameflow_submenu_data_ptr), hl

    ld a, (hl)
    ld (input_key_button1_mode), a
    inc hl
    ld a, (hl)
    ld (input_key_button2_mode), a
    inc hl
    ld a, (hl)
    ld (control_jump_button), a
    inc hl
    ld a, (hl)
    ld (control_action_button), a

    xor a
    ld (gameflow_menu_selection), a
    call gameflow_begin_transition_target_render
    call render_controls_screen
    call gameflow_finish_transition_target_render

.gfc_loop:
    halt
${frameAudioTickAsm}    call init_font_system
    ld a, 0
    call GTSTCK
    cp STICK_UP
    jp z, .gfc_up
    cp STICK_DOWN
    jp z, .gfc_down
    cp STICK_LEFT
    jp z, .gfc_toggle
    cp STICK_RIGHT
    jp z, .gfc_toggle

    call gameflow_read_confirm_direct
    or a
    jp z, .gfc_loop
    ld a, (gameflow_menu_selection)
    cp 4
    jp z, .gfc_wait_confirm_release_exit
    call controls_toggle_selected
    call render_controls_screen
    jp .gfc_wait_confirm_release

.gfc_up:
    ld a, (gameflow_menu_selection)
    or a
    jp z, .gfc_wait_neutral
    dec a
    ld (gameflow_menu_selection), a
    call render_controls_screen
    jp .gfc_wait_neutral

.gfc_down:
    ld a, (gameflow_menu_selection)
    cp 4
    jp nc, .gfc_wait_neutral
    inc a
    ld (gameflow_menu_selection), a
    call render_controls_screen
    jp .gfc_wait_neutral

.gfc_toggle:
    call controls_toggle_selected
    call render_controls_screen
    jp .gfc_wait_neutral

.gfc_wait_confirm_release:
    halt
${frameAudioTickAsm}    call init_font_system
    call gameflow_read_confirm_direct
    or a
    jp nz, .gfc_wait_confirm_release
    jp .gfc_loop

.gfc_wait_confirm_release_exit:
    halt
${frameAudioTickAsm}    call init_font_system
    call gameflow_read_confirm_direct
    or a
    jp nz, .gfc_wait_confirm_release_exit
    jp .gfc_exit

.gfc_wait_neutral:
.gfc_wait_neutral_loop:
    halt
${frameAudioTickAsm}    call init_font_system
    ld a, 0
    call GTSTCK
    or a
    jp nz, .gfc_wait_neutral_loop
    jp .gfc_loop

.gfc_exit:
    pop hl
    pop de
    pop bc
    ret

controls_toggle_selected:
    ld a, (gameflow_menu_selection)
    cp 0
    jp z, .ct_key1
    cp 1
    jp z, .ct_key2
    cp 2
    jp z, .ct_jump
    cp 3
    jp z, .ct_action
    ret
.ct_key1:
    ld a, (input_key_button1_mode)
    xor 1
    ld (input_key_button1_mode), a
    ret
.ct_key2:
    ld a, (input_key_button2_mode)
    xor 1
    ld (input_key_button2_mode), a
    ret
.ct_jump:
    ld a, (control_jump_button)
    xor 1
    ld (control_jump_button), a
    ret
.ct_action:
    ld a, (control_action_button)
    xor 1
    ld (control_action_button), a
    ret

render_controls_screen:
    push bc
    push de
    push hl
    xor a
    call init_char0_color
    ld a, 0
    ld b, 24
.rc_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .rc_clear_loop

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 4
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ld de, #18CA
    call print_string_vram

    ld hl, str_controls_btn1
    ld de, #1905
    call print_string_vram
    ld a, (input_key_button1_mode)
    or a
    ld hl, str_controls_spc
    jp z, .rc_btn1_value_ready
    ld hl, str_controls_ctrl
.rc_btn1_value_ready:
    ld de, #1911
    call print_string_vram

    ld hl, str_controls_btn2
    ld de, #1925
    call print_string_vram
    ld a, (input_key_button2_mode)
    or a
    ld hl, str_controls_n
    jp z, .rc_btn2_value_ready
    ld hl, str_controls_ctrl
.rc_btn2_value_ready:
    ld de, #1931
    call print_string_vram

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 6
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ld de, #1945
    call print_string_vram
    ld a, (control_jump_button)
    or a
    ld hl, str_controls_b1
    jp z, .rc_jump_value_ready
    ld hl, str_controls_b2
.rc_jump_value_ready:
    ld de, #1955
    call print_string_vram

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 8
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ld de, #1965
    call print_string_vram
    ld a, (control_action_button)
    or a
    ld hl, str_controls_b1
    jp z, .rc_action_value_ready
    ld hl, str_controls_b2
.rc_action_value_ready:
    ld de, #1975
    call print_string_vram

    ld hl, str_controls_done
    ld de, #19C5
    call print_string_vram

    call render_controls_markers
    pop hl
    pop de
    pop bc
    ret

render_controls_markers:
    ld a, (gameflow_menu_selection)
    ld b, a
    ld de, #1903
    ld a, b
    cp 0
    call controls_print_marker_a
    ld de, #1923
    ld a, b
    cp 1
    call controls_print_marker_a
    ld de, #1943
    ld a, b
    cp 2
    call controls_print_marker_a
    ld de, #1963
    ld a, b
    cp 3
    call controls_print_marker_a
    ld de, #19C3
    ld a, b
    cp 4
    call controls_print_marker_a
    ret

controls_print_marker_a:
    push af
    ld hl, str_controls_blank
    jp nz, .cpma_print
    ld hl, str_controls_marker
.cpma_print:
    call print_string_vram
    pop af
    ret

str_controls_marker:
    db ">", 0
str_controls_blank:
    db " ", 0
str_controls_btn1:
    db "B1 KEY:", 0
str_controls_btn2:
    db "B2 KEY:", 0
str_controls_done:
    db "DONE", 0
str_controls_spc:
    db "SPC ", 0
str_controls_ctrl:
    db "CTRL", 0
str_controls_n:
    db "N   ", 0
str_controls_b1:
    db "B1", 0
str_controls_b2:
    db "B2", 0

`;
        break;

      case 'Text':
        code += `gameflow_handle_text:
    ; Text node - show text screen and wait for fire
    ; DE = text data pointer (pre-computed lines table)
    ; BC = connection table

    push bc

    ; Show text screen (full screen with title, message, prompt)
    call show_text_screen

    ; Wait for fire button
    call wait_for_fire

    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_text_screen
; Display full text screen with optional background screen asset
; Input: DE = text data pointer
;   Format: DB bgColor, DW screen_load_ptr (0=none), DB screen_load_bank, DB numLines
;           Per line: DB row, DB col, DW string_ptr
; If screen_load_ptr != 0: calls that function to load background screen
; (the load_screen function sets VDP colors and name table from screen asset)
; If screen_load_ptr == 0: sets bgColor, clears screen, renders text on solid bg
; ------------------------------------------------------------------
; @mideas:block id=runtime.gameflow.text_screen kind=routine owner=gameflow roots=show_text_screen,wait_for_fire
show_text_screen:
    push bc
    push de
    push hl

    ex de, hl                     ; HL = data pointer

    ; Read bgColor, screen load function pointer, and screen load bank
    ld a, (hl)                    ; A = bgColor
    inc hl
    ld c, (hl)                    ; C = screen_load_ptr low
    inc hl
    ld b, (hl)                    ; B = screen_load_ptr high
    inc hl                        ; BC = load function ptr (0 = no bg screen)
    ld e, (hl)                    ; E = screen_load_bank
    inc hl

    push hl                       ; (1) Save pointer to numLines
    push af                       ; (2) Save bgColor
    push bc                       ; (3) Save function pointer
    push de                       ; (4) Save bank byte (E)

    ; Disable screen before any VRAM write
    call DISSCR

    ; Check if we have a background screen to load
    pop de                        ; (4) Restore bank byte (E)
    pop bc                        ; (3) Restore function pointer
    ld a, b
    or c
    jr z, .sts_no_bg_screen

    ; Has background screen: mapper-safe call to load_screen_X
    ; (load_screen sets VDP colors + writes name table)
    ld h, b
    ld l, c                       ; HL = function address
    ld a, e                       ; A = screen_load_bank
    call mapper_call_hl_auto
    pop af                        ; (2) Discard saved bgColor (screen set its own colors)
    jp .sts_render

.sts_no_bg_screen:
    ; No background screen: set solid color and clear
    pop af                        ; (2) Restore bgColor
    ld b, a                       ; B = border color (same as bg)
    push af
    call set_screen_colors
    pop af
    call init_char0_color

    ; Clear entire screen (24 rows)
    ld a, 0
    ld b, 24
.sts_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .sts_clear_loop

.sts_render:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before rendering text lines.
    call reload_font_system

    ; Now render each text line
    pop hl                        ; (1) HL = pointer to numLines
    ld a, (hl)                    ; A = numLines
    inc hl                        ; HL = first line entry
    or a
    jp z, .sts_enable             ; No lines? just enable screen

    ld b, a                       ; B = line counter

.sts_line_loop:
    push bc

    ; Read row
    ld a, (hl)                    ; A = row
    inc hl
    ; Read col
    ld c, (hl)                    ; C = col
    inc hl
    ; Read string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = string pointer
    inc hl

    push hl                       ; Save data pointer

    ; Calculate VRAM address: #1800 + row*32 + col
    push de                       ; Save string pointer
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32
    ld e, c
    ld d, 0
    add hl, de                    ; + col
    ld de, #1800
    add hl, de                    ; + name table base
    ex de, hl                     ; DE = VRAM address
    pop hl                        ; HL = string pointer

    call print_string_vram

    pop hl                        ; Restore data pointer
    pop bc
    djnz .sts_line_loop

.sts_enable:
    call gameflow_finish_transition_target_render

    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; wait_for_fire
; Wait for confirm key press and release outside gameplay loops
; ------------------------------------------------------------------
wait_for_fire:
    push bc

    ; Wait for fire button press
.wait_press:
    ei
    halt
${frameAudioTickAsm}
    call gameflow_read_confirm_direct
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    ei
    halt
${frameAudioTickAsm}
    call gameflow_read_confirm_direct
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    ei
    halt
    push bc
${frameAudioTickAsm}    pop bc
    djnz .delay_loop

    pop bc
    ret

; @mideas:endblock id=runtime.gameflow.text_screen
`;
        break;

      case 'TextScroll':
        code += `gameflow_handle_textscroll:
    ; Galious-style pixel text scroll.
    ; DE = text scroll data pointer
    ; BC = connection table
    push bc
    call show_textscroll_screen
    pop bc

    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

${hasTextScrollColorNode ? `gameflow_handle_textscrollcolor:
    ; Colored Galious-style pixel text scroll.
    ; DE = text scroll color data pointer
    ; BC = connection table
    push bc
    call show_textscroll_color_screen
    pop bc

    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

` : ''}TEXTSCROLL_FONT_FIRST EQU 32
TEXTSCROLL_FONT_COUNT EQU 64
TEXTSCROLL_FONT_BYTES EQU #0200
TEXTSCROLL_CHUNK_GLYPHS EQU 32
TEXTSCROLL_CHUNK_BYTES EQU #0200
TEXTSCROLL_FONT_SRC EQU page0_transfer_buffer
TEXTSCROLL_FRAME_BUF EQU page0_transfer_buffer + TEXTSCROLL_FONT_BYTES

; ------------------------------------------------------------------
; show_textscroll_screen
; Data format:
;   db background_color
;   db stripe_color
;   db speed_frames_per_pixel
;   db line_count
;   repeated line_count times: db centered_col, dw string_ptr
; ------------------------------------------------------------------
show_textscroll_screen:
    ex de, hl
    xor a
    ld (gameflow_textscroll_skip_enabled), a
    ld (gameflow_textscroll_skip_armed), a
    ld a, #0F
    ld (gameflow_textscroll_text_color), a
    jr textscroll_read_common_data

; ------------------------------------------------------------------
; show_textscroll_color_screen
; Data format:
;   db background_color
;   db stripe_color
;   db text_color
;   db speed_frames_per_pixel
;   db line_count
;   repeated line_count times: db centered_col, dw string_ptr
; ------------------------------------------------------------------
show_textscroll_color_screen:
    ex de, hl
    xor a
    ld (gameflow_textscroll_skip_armed), a
    ld a, 1
    ld (gameflow_textscroll_skip_enabled), a
    call textscroll_read_bg_stripe
    ld a, (hl)
    and #0F
    ld (gameflow_textscroll_text_color), a
    inc hl
    jr textscroll_read_speed_count

textscroll_read_common_data:
    call textscroll_read_bg_stripe

textscroll_read_speed_count:
    ld a, (hl)
    or a
    jr nz, .ts2_speed_ok
    inc a
.ts2_speed_ok:
    ld (gameflow_textscroll_speed), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_line_count), a
    inc hl
    ld (gameflow_textscroll_line_table_ptr), hl

    call DISSCR
    ld a, (gameflow_textscroll_bg_color)
    and #0F
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR
    ld a, (gameflow_textscroll_bg_color)
${useFarCall ? `    call call_init_char0_color_resident` : `    call init_char0_color`}
${useFarCall ? `    call call_reload_font_system_resident` : `    call reload_font_system`}
    call textscroll_capture_font_patterns
    call textscroll_prepare_pattern_masks
    call textscroll_clear_name_table

    xor a
    ld (gameflow_textscroll_step), a
    ld (gameflow_textscroll_fine), a
    ld (gameflow_textscroll_tile_base), a
    call textscroll_render_name_frame
    call textscroll_update_pattern_frame
    call ENASCR
.scroll_loop:
    ld a, (gameflow_textscroll_line_count)
    add a, a
    add a, 25
    ld b, a
    ld a, (gameflow_textscroll_step)
    cp b
    jr nc, .scroll_done

.fine_wait:
    call textscroll_poll_skip
    or a
    jr nz, .scroll_done
    call textscroll_wait_speed
    or a
    jr nz, .scroll_done
    ld hl, gameflow_textscroll_fine
    inc (hl)
    ld a, (hl)
    cp 8
    jr c, .fine_loop

    ld hl, gameflow_textscroll_step
    inc (hl)
    ld a, (gameflow_textscroll_tile_base)
    xor 128
    ld (gameflow_textscroll_tile_base), a
    xor a
    ld (gameflow_textscroll_fine), a
    call textscroll_update_pattern_frame
    call textscroll_render_name_frame
    jr .scroll_loop

.fine_loop:
    call textscroll_update_pattern_frame
    jr .fine_wait

.scroll_done:
${useFarCall ? `    call call_reload_font_system_resident` : `    call reload_font_system`}
    ret

textscroll_read_bg_stripe:
    ld a, (hl)
    ld (gameflow_textscroll_bg_color), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_stripe_color), a
    inc hl
    ret

; ------------------------------------------------------------------
; Capture current font glyphs 32..95 from the first pattern bank.
; DI/EI protects the VDP address latch while the interrupt task manager is
; active, otherwise the mask may be built from corrupted scanlines.
; ------------------------------------------------------------------
textscroll_capture_font_patterns:
    di
    ; FAST_RDVRM returns the byte after the programmed address on this path,
    ; so start one byte earlier to capture exact glyph rows.
    ld hl, CHRTBL2 + (TEXTSCROLL_FONT_FIRST * 8) - 1
    ld de, TEXTSCROLL_FONT_SRC
    ld bc, TEXTSCROLL_FONT_BYTES
.capture_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .capture_loop
    ei
    ret

textscroll_prepare_pattern_masks:
    ld a, (gameflow_textscroll_text_color)
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld b, a
    ld a, (gameflow_textscroll_stripe_color)
    and #0F
    or b
    ld hl, CLRTBL2
    ld bc, #1800
    call FAST_FILLVRM
    xor a
    ld hl, CHRTBL2
    ld bc, #1800
    jp FAST_FILLVRM

textscroll_clear_name_table:
    xor a
    ld hl, NAMETBL
    ld bc, #0300
    jp FAST_FILLVRM

; Output: A = 1 when TextScrollColor should leave the node, A = 0 otherwise.
; Preserves BC, DE and HL so callers can poll inside scroll timing safely.
textscroll_poll_skip:
    ld a, (gameflow_textscroll_skip_enabled)
    or a
    ret z
    push bc
    push de
    push hl
    call gameflow_read_confirm_direct
    or a
    jr nz, .skip_input_down
    xor a
    call FAST_GTTRIG
    or a
    jr nz, .skip_input_down
    ld a, 1
    ld (gameflow_textscroll_skip_armed), a
    jr .skip_not_pressed
.skip_input_down:
    ld a, (gameflow_textscroll_skip_armed)
    or a
    jr z, .skip_not_pressed
    pop hl
    pop de
    pop bc
    ld a, 1
    ret
.skip_not_pressed:
    pop hl
    pop de
    pop bc
    xor a
    ret

; ------------------------------------------------------------------
; Galious-style text scroll.
; The name table moves only on 8-pixel row steps. Fine pixel motion is
; done by rebuilding a compact pair-tile font and copying it to the
; three SCREEN 2 pattern banks.
; ------------------------------------------------------------------
textscroll_render_name_frame:
    call textscroll_clear_name_table
    xor a
    ld (gameflow_textscroll_base_line), a
.line_loop:
    ld a, (gameflow_textscroll_base_line)
    ld hl, gameflow_textscroll_line_count
    cp (hl)
    ret nc

    ld c, a
    ld a, 24
    add a, c
    add a, c
    ld hl, gameflow_textscroll_step
    sub (hl)
    ld (gameflow_textscroll_row), a

    bit 7, a
    jr nz, .next_line
    cp 24
    jr nc, .try_upper
    ld a, 1
    ld (gameflow_textscroll_scan), a
    call textscroll_print_current_line_row

.try_upper:
    ld a, (gameflow_textscroll_row)
    dec a
    ld (gameflow_textscroll_row), a
    bit 7, a
    jr nz, .next_line
    cp 24
    jr nc, .next_line
    xor a
    ld (gameflow_textscroll_scan), a
    call textscroll_print_current_line_row

.next_line:
    ld hl, gameflow_textscroll_base_line
    inc (hl)
    jr .line_loop

; Input: A = line index.
textscroll_load_line_entry:
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, de
    ld de, (gameflow_textscroll_line_table_ptr)
    add hl, de
    ld a, (hl)
    ld (gameflow_textscroll_line_col), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (gameflow_textscroll_line_ptr), de
    ret

textscroll_print_current_line_row:
    ld a, (gameflow_textscroll_base_line)
    call textscroll_load_line_entry
    ld a, (gameflow_textscroll_row)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (gameflow_textscroll_line_col)
    ld e, a
    ld d, 0
    add hl, de
    ld de, NAMETBL
    add hl, de
    ld de, (gameflow_textscroll_line_ptr)
.char_loop:
    ld a, (de)
    or a
    ret z
    push de
    call textscroll_encode_tile_for_part
    call FAST_WRTVRM
    pop de
    inc de
    inc hl
    jr .char_loop

; Input: A = character code, gameflow_textscroll_scan = tile part 0/1.
; Output: A = pair-tile code. Unsupported characters become blank.
textscroll_encode_tile_for_part:
    cp TEXTSCROLL_FONT_FIRST
    jr c, .blank
    cp TEXTSCROLL_FONT_FIRST + TEXTSCROLL_FONT_COUNT
    jr nc, .blank
    sub TEXTSCROLL_FONT_FIRST
    add a, a
    ld b, a
    ld a, (gameflow_textscroll_tile_base)
    add a, b
    ld b, a
    ld a, (gameflow_textscroll_scan)
    or b
    ret
.blank:
    ld a, (gameflow_textscroll_tile_base)
    ret

textscroll_update_pattern_frame:
    xor a
    ld (gameflow_textscroll_col), a
    call textscroll_build_pattern_chunk
    call textscroll_copy_pattern_chunk_all_banks
    ld a, TEXTSCROLL_CHUNK_GLYPHS
    ld (gameflow_textscroll_col), a
    call textscroll_build_pattern_chunk
    jp textscroll_copy_pattern_chunk_all_banks

textscroll_build_pattern_chunk:
    xor a
    ld (gameflow_textscroll_row), a
.glyph_loop:
    ld a, (gameflow_textscroll_row)
    cp TEXTSCROLL_CHUNK_GLYPHS
    ret nc

    ld b, a
    ld a, (gameflow_textscroll_col)
    add a, b
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, TEXTSCROLL_FONT_SRC
    add hl, de
    ld (gameflow_textscroll_line_ptr), hl

    ld a, (gameflow_textscroll_row)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, TEXTSCROLL_FRAME_BUF
    add hl, de

    xor a
    ld (gameflow_textscroll_scan), a
.upper_scan_loop:
    ld a, (gameflow_textscroll_fine)
    or a
    jr z, .upper_blank
    ld b, a
    ld a, (gameflow_textscroll_scan)
    add a, b
    cp 8
    jr c, .upper_blank
    sub 8
    push hl
    call textscroll_get_current_font_row
    pop hl
    jr .store_upper
.upper_blank:
    xor a
.store_upper:
    ld (hl), a
    inc hl
    ld a, (gameflow_textscroll_scan)
    inc a
    ld (gameflow_textscroll_scan), a
    cp 8
    jr c, .upper_scan_loop

    xor a
    ld (gameflow_textscroll_scan), a
.lower_scan_loop:
    ld a, (gameflow_textscroll_fine)
    ld b, a
    ld a, (gameflow_textscroll_scan)
    add a, b
    cp 8
    jr nc, .lower_blank
    push hl
    call textscroll_get_current_font_row
    pop hl
    jr .store_lower
.lower_blank:
    xor a
.store_lower:
    ld (hl), a
    inc hl
    ld a, (gameflow_textscroll_scan)
    inc a
    ld (gameflow_textscroll_scan), a
    cp 8
    jr c, .lower_scan_loop

    ld hl, gameflow_textscroll_row
    inc (hl)
    jr .glyph_loop

; Input: A = source font scanline 0..7.
; Output: A = captured font byte. Clobbers DE/HL.
textscroll_get_current_font_row:
    ld e, a
    ld d, 0
    ld hl, (gameflow_textscroll_line_ptr)
    add hl, de
    ld a, (hl)
    ret

textscroll_copy_pattern_chunk_all_banks:
    ld a, (gameflow_textscroll_tile_base)
    or a
    jr z, .base_zero
    ld de, CHRTBL2 + #0400
    jr .have_base
.base_zero:
    ld de, CHRTBL2
.have_base:
    ld a, (gameflow_textscroll_col)
    or a
    jr z, .copy_chunk
    ld hl, #0200
    add hl, de
    ex de, hl
.copy_chunk:
    ld hl, TEXTSCROLL_FRAME_BUF
    ld bc, TEXTSCROLL_CHUNK_BYTES
    call FAST_LDIRVM
    ld hl, #0800
    add hl, de
    ex de, hl
    ld hl, TEXTSCROLL_FRAME_BUF
    ld bc, TEXTSCROLL_CHUNK_BYTES
    call FAST_LDIRVM
    ld hl, #0800
    add hl, de
    ex de, hl
    ld hl, TEXTSCROLL_FRAME_BUF
    ld bc, TEXTSCROLL_CHUNK_BYTES
    jp FAST_LDIRVM

textscroll_wait_speed:
    ld a, (gameflow_textscroll_speed)
    or a
    jr z, .wait_done
    ld b, a
.wait_loop:
    halt
    push bc
${frameAudioTickAsm}    pop bc
    push bc
    call textscroll_poll_skip
    pop bc
    or a
    jr nz, .wait_skip
    djnz .wait_loop
    xor a
    ret
.wait_done:
    xor a
    ret
.wait_skip:
    ld a, 1
    ret

`;
        break;

      case 'TextScroll2':
        code += `gameflow_handle_textscroll2:
    ; SCREEN 2 pattern-table pixel text scroll.
    ; DE = text scroll data pointer
    ; BC = connection table
    push bc
    call show_textscroll2_screen
    pop bc

    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

TEXTSCROLL2_FONT_FIRST EQU 32
TEXTSCROLL2_FONT_COUNT EQU 64
TEXTSCROLL2_FONT_BYTES EQU #0200
TEXTSCROLL2_FONT_SRC EQU page0_transfer_buffer
TEXTSCROLL2_PATTERN_BYTES EQU #1800

; ------------------------------------------------------------------
; show_textscroll2_screen
; Data format:
;   db background_color
;   db stripe_color
;   db speed_frames_per_pixel
;   db line_count
;   dw fixed_32_byte_text_lines
; Text lines are exactly 32 bytes each and end with a line whose first
; byte is #FF. This follows the classic pattern-table scroll model, but
; uses Mideas SCREEN 2 VRAM constants instead of reserving a 6144-byte
; RAM mirror.
; ------------------------------------------------------------------
show_textscroll2_screen:
    ex de, hl
    ld a, (hl)
    ld (gameflow_textscroll2_bg_color), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll2_stripe_color), a
    inc hl
    ld a, (hl)
    or a
    jr nz, .speed_ok
    inc a
.speed_ok:
    ld (gameflow_textscroll2_speed), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll2_line_count), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (gameflow_textscroll2_text_ptr), de

    ld a, (gameflow_textscroll2_line_count)
    add a, 24
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld (gameflow_textscroll2_steps_left), hl

    call DISSCR
    ld a, (gameflow_textscroll2_bg_color)
    and #0F
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR
    call reload_font_system
    call textscroll2_capture_font_patterns
    call textscroll2_init_name_table
    call textscroll2_init_color_table
    call textscroll2_clear_pattern_table
    xor a
    ld (gameflow_textscroll2_text_pix), a
    call ENASCR

.ts2_scroll_loop:
    ld hl, (gameflow_textscroll2_steps_left)
    ld a, h
    or l
    jr z, .ts2_scroll_done
    call textscroll2_shift_vram_up1
    call textscroll2_wait_speed
    ld hl, (gameflow_textscroll2_steps_left)
    dec hl
    ld (gameflow_textscroll2_steps_left), hl
    jr .ts2_scroll_loop

.ts2_scroll_done:
    call reload_font_system
    ret

textscroll2_capture_font_patterns:
    di
    ; FAST_RDVRM returns the byte after the programmed address on this path,
    ; so start one byte earlier to capture exact glyph rows.
    ld hl, CHRTBL2 + (TEXTSCROLL2_FONT_FIRST * 8) - 1
    ld de, TEXTSCROLL2_FONT_SRC
    ld bc, TEXTSCROLL2_FONT_BYTES
.ts2_capture_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .ts2_capture_loop
    ei
    ret

textscroll2_init_name_table:
    ld hl, NAMETBL
    ld d, 3
.ts2_bank_loop:
    xor a
    ld b, 0
.ts2_byte_loop:
    call FAST_WRTVRM
    inc hl
    inc a
    djnz .ts2_byte_loop
    dec d
    jr nz, .ts2_bank_loop
    ret

textscroll2_init_color_table:
    ld a, (gameflow_textscroll2_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2
    ld bc, TEXTSCROLL2_PATTERN_BYTES
    jp FAST_FILLVRM

textscroll2_clear_pattern_table:
    xor a
    ld hl, CHRTBL2
    ld bc, TEXTSCROLL2_PATTERN_BYTES
    jp FAST_FILLVRM

textscroll2_shift_vram_up1:
    di
    ld hl, CHRTBL2
    ld c, 23
.ts2_row_loop:
    ld b, 32
.ts2_col_loop:
    push bc
    call textscroll2_shift_tile_take_below
    pop bc
    djnz .ts2_col_loop
    dec c
    jr nz, .ts2_row_loop

    ld de, (gameflow_textscroll2_text_ptr)
    ld b, 32
.ts2_last_col_loop:
    push bc
    push de
    call textscroll2_shift_tile_up7
    pop de
    ld a, (de)
    inc de
    push de
    call textscroll2_get_font_byte
    call FAST_WRTVRM
    inc hl
    pop de
    pop bc
    djnz .ts2_last_col_loop

    ei
    jp textscroll2_advance_text_scanline

textscroll2_shift_tile_take_below:
    push hl
    call textscroll2_shift_tile_up7
    push hl
    pop de
    pop hl
    inc h
    call FAST_RDVRM
    ex de, hl
    call FAST_WRTVRM
    inc hl
    ret

textscroll2_shift_tile_up7:
    ld b, 7
.ts2_shift_loop:
    push bc
    push hl
    inc hl
    call FAST_RDVRM
    pop hl
    call FAST_WRTVRM
    inc hl
    pop bc
    djnz .ts2_shift_loop
    ret

; IN: A = ASCII char. OUT: A = font scanline. Preserves HL.
textscroll2_get_font_byte:
    push hl
    cp TEXTSCROLL2_FONT_FIRST
    jr nc, .ts2_min_ok
    ld a, TEXTSCROLL2_FONT_FIRST
.ts2_min_ok:
    cp TEXTSCROLL2_FONT_FIRST + TEXTSCROLL2_FONT_COUNT
    jr c, .ts2_range_ok
    ld a, TEXTSCROLL2_FONT_FIRST
.ts2_range_ok:
    sub TEXTSCROLL2_FONT_FIRST
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (gameflow_textscroll2_text_pix)
    add a, l
    ld l, a
    jr nc, .ts2_no_carry
    inc h
.ts2_no_carry:
    ld de, TEXTSCROLL2_FONT_SRC
    add hl, de
    ld a, (hl)
    pop hl
    ret

textscroll2_advance_text_scanline:
    ld a, (gameflow_textscroll2_text_pix)
    inc a
    cp 8
    jr nz, .ts2_store_pix
    xor a
    ld hl, (gameflow_textscroll2_text_ptr)
    ld de, 32
    add hl, de
    ld e, a
    ld a, (hl)
    cp #FF
    jr nz, .ts2_set_ptr
    ld hl, textscroll2_blank_line
.ts2_set_ptr:
    ld (gameflow_textscroll2_text_ptr), hl
    ld a, e
.ts2_store_pix:
    ld (gameflow_textscroll2_text_pix), a
    ret

textscroll2_blank_line:
    db "                                "
    db #FF

textscroll2_wait_speed:
    ld a, (gameflow_textscroll2_speed)
    or a
    ret z
    ld b, a
.ts2_wait_loop:
    halt
    push bc
${frameAudioTickAsm}    pop bc
    djnz .ts2_wait_loop
    ret

`;
        break;

      case 'IfThenElse':
        code += `; @mideas:block id=runtime.gameflow.if_then_else kind=routine owner=gameflow roots=gameflow_handle_ifthenelse
gameflow_handle_ifthenelse:
    ; IfThenElse node - conditional branching
    ; DE = condition data pointer
    ;      dw variable address
    ;      db compare value low
    ;      db compare value high
    ;      db operator
    ;      db variable size (0=byte, 1=word)
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Read condition data
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = variable address
    inc hl
    ld c, (hl)      ; C = compare value low byte
    inc hl
    ld b, (hl)      ; B = compare value high byte
    inc hl
    ld a, (hl)      ; A = operator
    push af
    inc hl
    ld a, (hl)      ; A = variable size (0=byte, 1=word)
    push af
    
    ; Load variable value
    ex de, hl
    pop af
    ld e, (hl)      ; E = current value low byte
    or a
    jr z, .byte_value_loaded
    inc hl
    ld d, (hl)      ; D = current value high byte
    jr .value_loaded

.byte_value_loaded:
    ld d, 0

.value_loaded:
    pop af

    ; Compare DE (current value) against BC (compare value), unsigned.
    cp 0
    jr z, .compare_equals
    cp 1
    jr z, .compare_not_equals
    cp 2
    jr z, .compare_greater_than
    cp 3
    jr z, .compare_less_than
    cp 4
    jr z, .compare_greater_or_equal
    cp 5
    jr z, .compare_less_or_equal
    jr .else_branch

.compare_equals:
    ld a, d
    cp b
    jr nz, .else_branch
    ld a, e
    cp c
    jr z, .then_branch
    jr .else_branch

.compare_not_equals:
    ld a, d
    cp b
    jr nz, .then_branch
    ld a, e
    cp c
    jr nz, .then_branch
    jr .else_branch

.compare_greater_than:
    ld a, d
    cp b
    jr c, .else_branch
    jr nz, .then_branch
    ld a, e
    cp c
    jr z, .else_branch
    jr nc, .then_branch
    jr .else_branch

.compare_less_than:
    ld a, d
    cp b
    jr c, .then_branch
    jr nz, .else_branch
    ld a, e
    cp c
    jr c, .then_branch
    jr .else_branch

.compare_greater_or_equal:
    ld a, d
    cp b
    jr c, .else_branch
    jr nz, .then_branch
    ld a, e
    cp c
    jr c, .else_branch
    jr .then_branch

.compare_less_or_equal:
    ld a, d
    cp b
    jr c, .then_branch
    jr nz, .else_branch
    ld a, e
    cp c
    jr c, .then_branch
    jr z, .then_branch
    jr .else_branch
    
.else_branch:
    pop bc
    ld a, CONNECTION_ELSE
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
    
.then_branch:
    pop bc
    ld a, CONNECTION_THEN
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
; @mideas:endblock id=runtime.gameflow.if_then_else

`;
        break;

      case 'Globals':
        code += `gameflow_handle_globals:
    ; Globals node - set global variables
    ; DE = globals data pointer (list of variable assignments)
    ; BC = connection table
    
    push bc
    
    ; Execute global variable assignments
    ; Data format: count, [var_addr, value]*count
    ex de, hl
    ld b, (hl)      ; B = count
    inc hl
    
.assign_loop:
    ld a, b
    or a
    jr z, .gfg_done

    ; Read var address
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    
    ; Read value
    ld a, (hl)
    inc hl
    
    ; Assign
    ex de, hl
    ld (hl), a
    ex de, hl
    
    djnz .assign_loop

.gfg_done:
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
        break;

      case 'Waypoint':
        code += `gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
        break;

      case 'Transition':
        const transitionGameplayCacheInvalidateAsm = useFarCall
          ? `    call resource_invalidate_gameplay_vram_cache`
          : `    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a`;
        code += `gameflow_handle_transition:
    ; Transition node - visual screen wipe/fade effect
    ; DE = transition data pointer (db effect_id, frames_per_step, fill_char)
    ; BC = connection table
    push bc
    ; Presentation/background screens can overwrite all SCREEN 2 chars.
    ; Reinstall reserved char #FE immediately before the transition wipe.
    ld a, 1
    call init_char0_color
    push de                       ; Keep transition data while resolving the next node
    call gameflow_get_default_connection
    pop de
    ld a, h
    or l
    jr z, .gft_no_connection
    push hl                       ; Preserve next node while transition clobbers HL
    call execute_transition_effect
    pop hl
    pop bc                        ; Drop saved connection table after transition clobbers BC
    ld a, (hl)                    ; Next node type
    cp NODE_TYPE_TRANSITION
    jp z, gameflow_execute_node   ; Chain transitions without an intermediate VRAM restore/clear
    call gameflow_mark_transition_target_if_visual
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr z, .gft_next_not_worldlink
    call DISSCR                   ; Cover raster is complete; hide VRAM reloads before the reveal raster.
    jr .gft_next_not_worldlink
.gft_no_connection:
    call execute_transition_effect
    pop bc                        ; Drop saved connection table after transition clobbers BC
    ret
.gft_next_not_worldlink:
    push hl                       ; Preserve next node while restoring VRAM
    ld a, (gameflow_deferred_game_init)
    or a
    jr z, .gft_restore_shared_vram
    xor a
    ld (gameflow_deferred_game_init), a
    call init_game_systems
    jr .gft_restore_done
.gft_restore_shared_vram:
    ; Restore VRAM after transition:
    ; 1. Invalidate all shared gameplay/font VRAM caches. A transition may
    ;    follow presentation/dialog screens that used different CHRTBL/CLRTBL
    ;    contents, so the next WorldLink must reload its tilebank patterns.
${transitionGameplayCacheInvalidateAsm}
    ; 2. Tile colors (chars 128+) - may belong to the previous screen.
    call load_colors_to_vram
    ; 3. Font patterns + colors (chars 0-127) - may belong to the previous screen.
    ;    init_font_system reloads both pattern bytes and color attributes for all
    ;    font characters.  If no font is used in the project this is a no-op (ret).
    call init_font_system
.gft_restore_done:
    pop hl                        ; Restore next node
    jp gameflow_execute_node

; Mark visual targets that can render while the transition cover is visible
; and then reveal their completed Name Table with the same raster.
; Input: HL = target node pointer
; Preserves: BC, DE, HL
; Destroys: AF
gameflow_mark_transition_target_if_visual:
    ld a, (hl)
    cp NODE_TYPE_WORLD_LINK
    jr z, .gmt_mark
    cp NODE_TYPE_SUBMENU
    jr z, .gmt_mark
    cp NODE_TYPE_CONTROLS
    jr z, .gmt_mark
    cp NODE_TYPE_TEXT
    jr z, .gmt_mark
    cp NODE_TYPE_PRESENTATION_SCREEN
    jr z, .gmt_mark
    cp NODE_TYPE_END
    jr z, .gmt_mark
    ret
.gmt_mark:
    ld a, 1
    ld (gameflow_reveal_world_after_load), a
    ret

; If a Transition selected a reveal target, hide the active display before
; that target starts writing patterns/colors/name table.
; Preserves: BC, DE, HL
; Destroys: AF
gameflow_begin_transition_target_render:
    ld a, (gameflow_reveal_world_after_load)
    or a
    ret z
    call DISSCR
    ret

; Finish a non-WorldLink visual target render during transition reveal mode:
; copy the rendered Name Table to runtime_screen_layout, put the cover char
; back on screen instantly, enable display, then reveal with the stored raster.
; Destroys: AF, BC, DE, HL
gameflow_finish_transition_target_render:
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr nz, .gfttr_reveal
    call ENASCR
    ret
.gfttr_reveal:
    call DISSCR
    call gameflow_capture_nametable_to_runtime_screen_layout
    ld hl, #1800
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ld a, (transition_fill_char)
    call trans_fast_filvrm
    call ENASCR
    xor a
    ld (gameflow_reveal_world_after_load), a
    call execute_transition_reveal_target
    ret

; Capture the visible SCREEN 2 Name Table into runtime_screen_layout.
; Destroys: AF, BC, DE, HL
gameflow_capture_nametable_to_runtime_screen_layout:
    ld hl, #1800
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    di
.gcnt_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .gcnt_loop
    ei
    ret

; ==================================================================
; execute_transition_effect
; Execute visual screen transition by clearing the Name Table
; in different patterns. Name-table wipe effects write the node-selected
; transition_fill_char: #FE outline square or #FF SPC blank.
; Target is Name Table (#1800-#1AFF, 768 bytes = 32x24 tiles).
;
; Input:  DE = Transition data pointer
;         (DE) = effect id: 0=cls, 1=dissolve_pixels, 2=dissolve_chars,
;                           3=vertical_lines, 4=horizontal_lines,
;                           5=spiral, 6=fill_white_squares,
;                           7=diagonal_clear, 8=diagonal_inverse,
;                           9=checkerboard, 10=doors, 11=center_curtain,
;                           12=venetian_blinds, 13=radial_wipe,
;                           14=block4_shuffle, 15=zoom_box
;         (DE+1) = frames per step
;         (DE+2) = fill char (#FE box or #FF SPC)
; Destroys: AF, BC, DE, HL
; ==================================================================
; ------------------------------------------------------------------
; load_transition_effect_config
; Reads Transition node data without executing a wipe.
; Input:  DE = Transition data pointer
; Output: A = effect id
; Destroys: AF, DE
; ------------------------------------------------------------------
load_transition_effect_config:
    ld a, (de)                    ; A = effect id (0-15)
    ld (transition_effect_id), a
    inc de
    push af                       ; Save effect id
    ld a, (de)                    ; A = frames per step (from node data)
    inc de
    ld (transition_delay_var), a  ; Store for trans_wait_frames
    ld a, (de)                    ; A = fill char (#FE box or #FF SPC)
    cp #FF
    jr z, .ete_store_fill_char
    ld a, #FE                     ; Default/guard: transition box char
.ete_store_fill_char:
    ld (transition_fill_char), a
    pop af                        ; Restore effect id
    ret

execute_transition_effect:
    call load_transition_effect_config
    or a
    jp z, .trans_cls
    dec a
    jp z, .trans_dissolve_pixels
    dec a
    jp z, .trans_dissolve_chars
    dec a
    jp z, .trans_vertical_lines
    dec a
    jp z, .trans_horizontal_lines
    dec a
    jp z, .trans_spiral
    dec a
    jp z, .trans_fill_white_squares
    dec a
    jp z, .trans_diagonal_clear
    dec a
    jp z, .trans_diagonal_inverse
    dec a
    jp z, .trans_checkerboard
    dec a
    jp z, .trans_doors
    dec a
    jp z, .trans_center_curtain
    dec a
    jp z, .trans_venetian_blinds
    dec a
    jp z, .trans_radial_wipe
    dec a
    jp z, .trans_block4_shuffle
    dec a
    jp z, .trans_zoom_box
    ret                           ; Unknown id - do nothing

; ------------------------------------------------------------------
; EFFECT 0: CLS - Instant clear + hold black for configured duration
; ------------------------------------------------------------------
.trans_cls:
    ld hl, #1800
    ld bc, 768
    ld a, (transition_fill_char)
    call trans_fast_filvrm
    call trans_wait_frames        ; Hold black screen for configured time
    ret

; ------------------------------------------------------------------
; EFFECT 1: DISSOLVE_PIXELS - Column-interleaved dissolve (8 passes)
; Each pass clears cols D, D+8, D+16, D+24 with 1 HALT delay
; ------------------------------------------------------------------
.trans_dissolve_pixels:
    ld d, 0                       ; D = pass counter (0-7)
.tdp_loop:
    ld a, d
    call trans_clear_column       ; col D
    ld a, d
    add a, 8
    call trans_clear_column       ; col D+8
    ld a, d
    add a, 16
    call trans_clear_column       ; col D+16
    ld a, d
    add a, 24
    call trans_clear_column       ; col D+24
    call trans_wait_frames        ; timed delay between passes
    inc d
    ld a, d
    cp 8
    jr c, .tdp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 2: DISSOLVE_CHARS - Name-table row interleaved dissolve (8 passes)
; Pass D clears tile rows D, D+8, D+16. Only the Name Table is touched.
; ------------------------------------------------------------------
.trans_dissolve_chars:
    ld d, 0                       ; D = pass counter (0-7)
.tdc_loop:
    ld a, d
    call trans_clear_row_direct    ; row D
    ld a, d
    add a, 8
    call trans_clear_row_direct    ; row D+8
    ld a, d
    add a, 16
    call trans_clear_row_direct    ; row D+16
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .tdc_loop
    ret

; ------------------------------------------------------------------
; EFFECT 3: VERTICAL_LINES - Left-to-right column wipe (2 cols/frame)
; ------------------------------------------------------------------
.trans_vertical_lines:
    ld c, 0                       ; C = current column
.tvl_loop:
    ld a, c
    call trans_clear_column       ; clear col C
    inc c
    ld a, c
    call trans_clear_column       ; clear col C+1
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tvl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 4: HORIZONTAL_LINES - Top-to-bottom Name Table raster
; ------------------------------------------------------------------
.trans_horizontal_lines:
    ld c, 0                       ; C = tile row (0-23)
.thl_loop:
    ld a, c
    call trans_clear_row_direct    ; clear one 32-char row in the Name Table
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .thl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 5: SPIRAL - Name-table rectangular rings from outside to inside.
; Clears only 8x8 character cells in the Name Table.
; ------------------------------------------------------------------
.trans_spiral:
    ld b, 0                       ; B = ring index (0..11)
.tsp_loop:
    ; Clear top and bottom row segments for this ring.
    ld a, b
    add a, a
    ld e, a                       ; E = ring * 2
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b                       ; A = top row
    call trans_clear_row_range
    ld a, 23
    sub b                         ; A = bottom row
    call trans_clear_row_range

    ; Clear left and right column segments between those two rows.
    ld a, b
    add a, a
    ld d, a
    ld a, 22
    sub d                         ; A = side segment height
    jr z, .tsp_after_sides
    ld d, a                       ; D = row count
    ld a, b
    inc a
    ld c, a                       ; C = start row
    ld a, b                       ; A = left column
    call trans_clear_column_range
    ld a, 31
    sub b                         ; A = right column
    call trans_clear_column_range
.tsp_after_sides:
    call trans_wait_frames
    inc b
    ld a, b
    cp 12
    jr c, .tsp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 6: FILL_WHITE_SQUARES - 4-column stripe wipe (8 cols/frame)
; ------------------------------------------------------------------
.trans_fill_white_squares:
    ld c, 0                       ; C = current column (step 8)
.tws_loop:
    ld a, c
    call trans_clear_column
    ld a, c
    inc a
    call trans_clear_column
    ld a, c
    add a, 2
    call trans_clear_column
    ld a, c
    add a, 3
    call trans_clear_column
    ld a, c
    add a, 4
    call trans_clear_column
    ld a, c
    add a, 5
    call trans_clear_column
    ld a, c
    add a, 6
    call trans_clear_column
    ld a, c
    add a, 7
    call trans_clear_column
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tws_loop
    ret

; ------------------------------------------------------------------
; EFFECT 7: DIAGONAL_CLEAR - Name-table raster wipe.
; Writes char #FE in diagonal order: (0,0), (1,0)/(0,1), ...
; The update routine clears one name-table char and returns Carry set
; when the full 32x24 table is complete. The effect runs several
; updates per frame so the configured duration remains practical.
; ------------------------------------------------------------------
.trans_diagonal_clear:
    call trans_diag_clear_init
.tdiag_frame_loop:
    ld b, 16                      ; one visible batch per frame
.tdiag_batch_loop:
    push bc
    call trans_diag_clear_update
    pop bc
    jr c, .tdiag_done
    djnz .tdiag_batch_loop
    call trans_wait_frames
    jr .tdiag_frame_loop
.tdiag_done:
    ret

; ------------------------------------------------------------------
; EFFECT 8: DIAGONAL_INVERSE - Name-table raster wipe, opposite slope.
; Writes transition_fill_char in diagonal order: (31,0), (30,0)/(31,1), ...
; ------------------------------------------------------------------
.trans_diagonal_inverse:
    call trans_diag_inverse_init
.tdiagi_frame_loop:
    ld b, 16                      ; one visible batch per frame
.tdiagi_batch_loop:
    push bc
    call trans_diag_inverse_clear_update
    pop bc
    jr c, .tdiagi_done
    djnz .tdiagi_batch_loop
    call trans_wait_frames
    jr .tdiagi_frame_loop
.tdiagi_done:
    ret

; ------------------------------------------------------------------
; EFFECT 9: CHECKERBOARD - Two-pass 32x24 Name Table damero wipe.
; ------------------------------------------------------------------
.trans_checkerboard:
    xor a
    call trans_clear_checkerboard_pass
    call trans_wait_frames
    ld a, 1
    call trans_clear_checkerboard_pass
    call trans_wait_frames
    ret

; ------------------------------------------------------------------
; EFFECT 10: DOORS - Side panels close towards the center.
; ------------------------------------------------------------------
.trans_doors:
    ld c, 0
.tdoor_loop:
    ld a, c
    call trans_clear_column       ; left panel column
    ld a, 31
    sub c
    call trans_clear_column       ; right panel column
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .tdoor_loop
    ret

; ------------------------------------------------------------------
; EFFECT 11: CENTER_CURTAIN - Columns close from center to edges.
; ------------------------------------------------------------------
.trans_center_curtain:
    ld c, 0
.tccurt_loop:
    ld a, 15
    sub c
    call trans_clear_column       ; center-left outward
    ld a, 16
    add a, c
    call trans_clear_column       ; center-right outward
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .tccurt_loop
    ret

; ------------------------------------------------------------------
; EFFECT 12: VENETIAN_BLINDS - Alternating even/odd tile rows.
; ------------------------------------------------------------------
.trans_venetian_blinds:
    ld c, 0
.tvb_even_loop:
    ld a, c
    call trans_clear_row_direct
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .tvb_even_loop
    call trans_wait_frames
    ld c, 1
.tvb_odd_loop:
    ld a, c
    call trans_clear_row_direct
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .tvb_odd_loop
    call trans_wait_frames
    ret

; ------------------------------------------------------------------
; EFFECT 13: RADIAL_WIPE - Approximate circular wipe from outside in.
; ------------------------------------------------------------------
.trans_radial_wipe:
    ld d, 26                      ; max Manhattan distance from center 2x2
.trw_loop:
    ld a, d
    call trans_clear_manhattan_pass
    call trans_wait_frames
    ld a, d
    or a
    jr z, .trw_done
    dec d
    jr .trw_loop
.trw_done:
    ret

; ------------------------------------------------------------------
; EFFECT 14: BLOCK4_SHUFFLE - Fixed pseudo-random 4x3 block wipe.
; ------------------------------------------------------------------
.trans_block4_shuffle:
    ld c, 0
.tb4_loop:
    ld a, c
    call trans_clear_block4_order
    call trans_wait_frames
    inc c
    ld a, c
    cp 64
    jr c, .tb4_loop
    ret

; ------------------------------------------------------------------
; EFFECT 15: ZOOM_BOX - 2-cell rectangular bands from outside to inside.
; ------------------------------------------------------------------
.trans_zoom_box:
    ld c, 0
.tzb_loop:
    ld a, c
    call trans_clear_zoom_band
    call trans_wait_frames
    ld a, c
    add a, 2
    ld c, a
    cp 12
    jr c, .tzb_loop
    ret

; ==================================================================
; execute_transition_reveal_target
; Reveal the freshly prepared target screen from runtime_screen_layout.
; WorldLink fills runtime_screen_layout directly while skipping the final
; Name Table copy; other visual nodes render hidden, then capture their
; completed Name Table into runtime_screen_layout before this reveal.
;
; Input:  runtime_screen_layout = destination 32x24 Name Table data
;         transition_effect_id / transition_delay_var from prior Transition
; Destroys: AF, BC, DE, HL
; ==================================================================
execute_transition_reveal_target:
    ld a, (transition_effect_id)
    or a
    jp z, .trt_full
    dec a
    jp z, .trt_dissolve_columns
    dec a
    jp z, .trt_dissolve_chars
    dec a
    jp z, .trt_vertical_lines
    dec a
    jp z, .trt_horizontal_lines
    dec a
    jp z, .trt_spiral
    dec a
    jp z, .trt_stripe_columns
    dec a
    jp z, .trt_diagonal
    dec a
    jp z, .trt_diagonal_inverse
    dec a
    jp z, .trt_checkerboard
    dec a
    jp z, .trt_doors
    dec a
    jp z, .trt_center_curtain
    dec a
    jp z, .trt_venetian_blinds
    dec a
    jp z, .trt_radial_wipe
    dec a
    jp z, .trt_block4_shuffle
    dec a
    jp z, .trt_zoom_box
    jp .trt_full

.trt_full:
    ld hl, runtime_screen_layout
    ld de, #1800
    ld bc, 768
    call FAST_LDIRVM
    call trans_wait_frames
    ret

.trt_dissolve_columns:
    ld d, 0
.trtc_loop:
    ld a, d
    call trans_reveal_column
    ld a, d
    add a, 8
    call trans_reveal_column
    ld a, d
    add a, 16
    call trans_reveal_column
    ld a, d
    add a, 24
    call trans_reveal_column
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .trtc_loop
    ret

.trt_dissolve_chars:
    ld d, 0
.trtch_loop:
    ld a, d
    call trans_reveal_row_direct
    ld a, d
    add a, 8
    call trans_reveal_row_direct
    ld a, d
    add a, 16
    call trans_reveal_row_direct
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .trtch_loop
    ret

.trt_vertical_lines:
    ld c, 0
.trtv_loop:
    ld a, c
    call trans_reveal_column
    inc c
    ld a, c
    call trans_reveal_column
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .trtv_loop
    ret

.trt_horizontal_lines:
    ld c, 0
.trth_loop:
    ld a, c
    call trans_reveal_row_direct
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .trth_loop
    ret

.trt_stripe_columns:
    ld c, 0
.trts_loop:
    ld a, c
    call trans_reveal_column
    ld a, c
    inc a
    call trans_reveal_column
    ld a, c
    add a, 2
    call trans_reveal_column
    ld a, c
    add a, 3
    call trans_reveal_column
    ld a, c
    add a, 4
    call trans_reveal_column
    ld a, c
    add a, 5
    call trans_reveal_column
    ld a, c
    add a, 6
    call trans_reveal_column
    ld a, c
    add a, 7
    call trans_reveal_column
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .trts_loop
    ret

.trt_spiral:
    ld b, 0
.trtsp_loop:
    ld a, b
    add a, a
    ld e, a
    ld a, 32
    sub e
    ld e, a
    ld d, b
    ld a, b
    call trans_reveal_row_range
    ld a, 23
    sub b
    call trans_reveal_row_range

    ld a, b
    add a, a
    ld d, a
    ld a, 22
    sub d
    jr z, .trtsp_after_sides
    ld d, a
    ld a, b
    inc a
    ld c, a
    ld a, b
    call trans_reveal_column_range
    ld a, 31
    sub b
    call trans_reveal_column_range
.trtsp_after_sides:
    call trans_wait_frames
    inc b
    ld a, b
    cp 12
    jr c, .trtsp_loop
    ret

.trt_diagonal:
    call trans_diag_clear_init
.trtd_frame_loop:
    ld b, 16
.trtd_batch_loop:
    push bc
    call trans_diag_reveal_update
    pop bc
    jr c, .trtd_done
    djnz .trtd_batch_loop
    call trans_wait_frames
    jr .trtd_frame_loop
.trtd_done:
    ret

.trt_diagonal_inverse:
    call trans_diag_inverse_init
.trtdi_frame_loop:
    ld b, 16
.trtdi_batch_loop:
    push bc
    call trans_diag_inverse_reveal_update
    pop bc
    jr c, .trtdi_done
    djnz .trtdi_batch_loop
    call trans_wait_frames
    jr .trtdi_frame_loop
.trtdi_done:
    ret

.trt_checkerboard:
    xor a
    call trans_reveal_checkerboard_pass
    call trans_wait_frames
    ld a, 1
    call trans_reveal_checkerboard_pass
    call trans_wait_frames
    ret

.trt_doors:
    ld c, 0
.trtdoor_loop:
    ld a, c
    call trans_reveal_column      ; left panel column
    ld a, 31
    sub c
    call trans_reveal_column      ; right panel column
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .trtdoor_loop
    ret

.trt_center_curtain:
    ld c, 0
.trtcurt_loop:
    ld a, 15
    sub c
    call trans_reveal_column      ; center-left outward
    ld a, 16
    add a, c
    call trans_reveal_column      ; center-right outward
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .trtcurt_loop
    ret

.trt_venetian_blinds:
    ld c, 0
.trtvb_even_loop:
    ld a, c
    call trans_reveal_row_direct
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .trtvb_even_loop
    call trans_wait_frames
    ld c, 1
.trtvb_odd_loop:
    ld a, c
    call trans_reveal_row_direct
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .trtvb_odd_loop
    call trans_wait_frames
    ret

.trt_radial_wipe:
    ld d, 26
.trtrw_loop:
    ld a, d
    call trans_reveal_manhattan_pass
    call trans_wait_frames
    ld a, d
    or a
    jr z, .trtrw_done
    dec d
    jr .trtrw_loop
.trtrw_done:
    ret

.trt_block4_shuffle:
    ld c, 0
.trtb4_loop:
    ld a, c
    call trans_reveal_block4_order
    call trans_wait_frames
    inc c
    ld a, c
    cp 64
    jr c, .trtb4_loop
    ret

.trt_zoom_box:
    ld c, 0
.trtzb_loop:
    ld a, c
    call trans_reveal_zoom_band
    call trans_wait_frames
    ld a, c
    add a, 2
    ld c, a
    cp 12
    jr c, .trtzb_loop
    ret

; ------------------------------------------------------------------
; trans_diag_clear_init
; Initializes the diagonal clear runtime state in RAM.
; Output: Carry clear.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_init:
    xor a
    ld (transition_diag_done), a
    ld (transition_diag_index), a
    call trans_diag_clear_setup_diagonal
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_init
; Initializes inverse diagonal clear/reveal runtime state in RAM.
; Output: Carry clear.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_init:
    xor a
    ld (transition_diag_done), a
    ld (transition_diag_index), a
    call trans_diag_inverse_setup_diagonal
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_clear_update
; Clears one char in the name table.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdcu_do_one
    scf
    ret

.tdcu_do_one:
    ld hl, (transition_diag_addr)
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte

    ld de, 31                     ; next char in diagonal: +32 row, -1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdcu_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdcu_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdcu_new_diagonal:
    call trans_diag_clear_setup_diagonal

.tdcu_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_reveal_update
; Reveals one char from runtime_screen_layout in the diagonal order.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_reveal_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdru_do_one
    scf
    ret

.tdru_do_one:
    ld hl, (transition_diag_addr)
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    call trans_diag_vdp_write_byte

    ld de, 31                     ; next char in diagonal: +32 row, -1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdru_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdru_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdru_new_diagonal:
    call trans_diag_clear_setup_diagonal

.tdru_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_clear_update
; Clears one char in the name table using opposite-slope diagonals.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_clear_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdicu_do_one
    scf
    ret

.tdicu_do_one:
    ld hl, (transition_diag_addr)
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte

    ld de, 33                     ; next char: +32 row, +1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdicu_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdicu_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdicu_new_diagonal:
    call trans_diag_inverse_setup_diagonal

.tdicu_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_reveal_update
; Reveals one char from runtime_screen_layout using opposite-slope diagonals.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_reveal_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdiru_do_one
    scf
    ret

.tdiru_do_one:
    ld hl, (transition_diag_addr)
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    call trans_diag_vdp_write_byte

    ld de, 33                     ; next char: +32 row, +1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdiru_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdiru_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdiru_new_diagonal:
    call trans_diag_inverse_setup_diagonal

.tdiru_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_clear_setup_diagonal
; Calculates the starting VRAM address and length for diagonal d.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_setup_diagonal:
    ld a, (transition_diag_index)
    cp 32
    jr nc, .tdcs_32_plus

.tdcs_0_31:
    ld e, a
    ld d, 0
    ld hl, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, (transition_diag_index)
    cp 24
    jr c, .tdcs_len_d_plus_1
    ld a, 24
    jr .tdcs_store_len

.tdcs_len_d_plus_1:
    inc a
    jr .tdcs_store_len

.tdcs_32_plus:
    sub 31
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = (d - 31) * 32
    ld de, #181F                  ; NAME_TABLE + 31
    add hl, de
    ld (transition_diag_addr), hl

    ld a, 55
    ld hl, transition_diag_index
    sub (hl)

.tdcs_store_len:
    ld (transition_diag_len), a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_setup_diagonal
; Calculates the starting VRAM address and length for inverse diagonal d.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_setup_diagonal:
    ld a, (transition_diag_index)
    cp 32
    jr nc, .tdis_32_plus

.tdis_0_31:
    ld e, a
    ld a, 31
    sub e                         ; A = 31 - d
    ld e, a
    ld d, 0
    ld hl, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, (transition_diag_index)
    cp 24
    jr c, .tdis_len_d_plus_1
    ld a, 24
    jr .tdis_store_len

.tdis_len_d_plus_1:
    inc a
    jr .tdis_store_len

.tdis_32_plus:
    sub 31
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = (d - 31) * 32
    ld de, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, 55
    ld hl, transition_diag_index
    sub (hl)

.tdis_store_len:
    ld (transition_diag_len), a
    ret

; ------------------------------------------------------------------
; trans_diag_vdp_write_byte
; Input: HL = VRAM address, A = byte.
; Destroys: AF. Preserves BC, DE, HL.
; ------------------------------------------------------------------
trans_diag_vdp_write_byte:
    push af
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    pop af
    out (#98), a
    ei
    ret

; ------------------------------------------------------------------
; trans_clear_checkerboard_pass
; Input: A = parity pass (0 or 1). Clears cells where (row + col) & 1 == A.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_checkerboard_pass:
    ld e, a                       ; E = target parity
    ld hl, #1800
    ld b, 0                       ; B = row
.tcbp_row:
    ld c, 0                       ; C = col
.tcbp_col:
    ld a, b
    add a, c
    and 1
    cp e
    jr nz, .tcbp_skip
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte
.tcbp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .tcbp_col
    inc b
    ld a, b
    cp 24
    jr c, .tcbp_row
    ret

; ------------------------------------------------------------------
; trans_reveal_checkerboard_pass
; Input: A = parity pass (0 or 1). Reveals cells where (row + col) & 1 == A.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_checkerboard_pass:
    ld e, a                       ; E = target parity
    ld hl, #1800
    ld b, 0                       ; B = row
.trbp_row:
    ld c, 0                       ; C = col
.trbp_col:
    ld a, b
    add a, c
    and 1
    cp e
    jr nz, .trbp_skip
    push de                       ; Preserve parity while deriving source byte.
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    call trans_diag_vdp_write_byte
.trbp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .trbp_col
    inc b
    ld a, b
    cp 24
    jr c, .trbp_row
    ret

; ------------------------------------------------------------------
; trans_clear_manhattan_pass
; Input: A = distance from center 2x2. Clears matching Name Table cells.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_manhattan_pass:
    ld d, a                       ; D = target distance
    ld hl, #1800
    ld b, 0                       ; B = row
.tcmp_row:
    ld c, 0                       ; C = col
.tcmp_col:
    ld a, c
    cp 16
    jr nc, .tcmp_x_right
    ld a, 15
    sub c
    jr .tcmp_x_done
.tcmp_x_right:
    ld a, c
    sub 16
.tcmp_x_done:
    ld e, a                       ; E = x distance from center 2x2
    ld a, b
    cp 12
    jr nc, .tcmp_y_bottom
    ld a, 11
    sub b
    jr .tcmp_y_done
.tcmp_y_bottom:
    ld a, b
    sub 12
.tcmp_y_done:
    add a, e                      ; A = Manhattan distance
    cp d
    jr nz, .tcmp_skip
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte
.tcmp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .tcmp_col
    inc b
    ld a, b
    cp 24
    jr c, .tcmp_row
    ret

; ------------------------------------------------------------------
; trans_reveal_manhattan_pass
; Input: A = distance from center 2x2. Reveals matching Name Table cells.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_manhattan_pass:
    ld d, a                       ; D = target distance
    ld hl, #1800
    ld b, 0                       ; B = row
.trmp_row:
    ld c, 0                       ; C = col
.trmp_col:
    ld a, c
    cp 16
    jr nc, .trmp_x_right
    ld a, 15
    sub c
    jr .trmp_x_done
.trmp_x_right:
    ld a, c
    sub 16
.trmp_x_done:
    ld e, a                       ; E = x distance from center 2x2
    ld a, b
    cp 12
    jr nc, .trmp_y_bottom
    ld a, 11
    sub b
    jr .trmp_y_done
.trmp_y_bottom:
    ld a, b
    sub 12
.trmp_y_done:
    add a, e                      ; A = Manhattan distance
    cp d
    jr nz, .trmp_skip
    push de
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    call trans_diag_vdp_write_byte
.trmp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .trmp_col
    inc b
    ld a, b
    cp 24
    jr c, .trmp_row
    ret

; ------------------------------------------------------------------
; trans_clear_block4_order
; Input: A = step index (0..63). Clears one 4-column x 3-row block.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_block4_order:
    ld e, a
    ld d, 0
    ld hl, trans_block4_order
    add hl, de
    ld a, (hl)                    ; A = block id (row*8 + col)
    ld c, a                       ; C = block id
    and 7
    add a, a
    add a, a
    ld d, a                       ; D = start column (block col * 4)
    ld a, c
    srl a
    srl a
    srl a                         ; A = block row
    ld e, a
    add a, a
    add a, e                      ; A = start row (block row * 3)
    ld c, a                       ; C = current row
    ld b, 3
.tcb4_row:
    ld a, c
    ld e, 4
    call trans_clear_row_range
    inc c
    djnz .tcb4_row
    ret

; ------------------------------------------------------------------
; trans_reveal_block4_order
; Input: A = step index (0..63). Reveals one 4-column x 3-row block.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_block4_order:
    ld e, a
    ld d, 0
    ld hl, trans_block4_order
    add hl, de
    ld a, (hl)                    ; A = block id (row*8 + col)
    ld c, a                       ; C = block id
    and 7
    add a, a
    add a, a
    ld d, a                       ; D = start column (block col * 4)
    ld a, c
    srl a
    srl a
    srl a                         ; A = block row
    ld e, a
    add a, a
    add a, e                      ; A = start row (block row * 3)
    ld c, a                       ; C = current row
    ld b, 3
.trb4_row:
    ld a, c
    ld e, 4
    call trans_reveal_row_range
    inc c
    djnz .trb4_row
    ret

trans_block4_order:
    db 0, 37, 10, 47, 20, 57, 30, 3
    db 40, 13, 50, 23, 60, 33, 6, 43
    db 16, 53, 26, 63, 36, 9, 46, 19
    db 56, 29, 2, 39, 12, 49, 22, 59
    db 32, 5, 42, 15, 52, 25, 62, 35
    db 8, 45, 18, 55, 28, 1, 38, 11
    db 48, 21, 58, 31, 4, 41, 14, 51
    db 24, 61, 34, 7, 44, 17, 54, 27

; ------------------------------------------------------------------
; trans_clear_zoom_band
; Input: A = ring start (0,2,4,6,8,10). Clears a 2-cell-thick band.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_zoom_band:
    ld b, a                       ; B = ring
    ld a, b
    add a, a
    ld e, a
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b
    call trans_clear_row_range
    ld a, b
    inc a
    call trans_clear_row_range
    ld a, 23
    sub b
    call trans_clear_row_range
    ld a, 22
    sub b
    call trans_clear_row_range

    ld a, b
    add a, a
    ld e, a
    ld a, 20
    sub e                         ; A = side segment height
    jr z, .tczb_done
    ld d, a                       ; D = row count
    ld a, b
    add a, 2
    ld c, a                       ; C = start row
    ld a, b
    call trans_clear_column_range
    ld a, b
    inc a
    call trans_clear_column_range
    ld a, 30
    sub b
    call trans_clear_column_range
    ld a, 31
    sub b
    call trans_clear_column_range
.tczb_done:
    ret

; ------------------------------------------------------------------
; trans_reveal_zoom_band
; Input: A = ring start (0,2,4,6,8,10). Reveals a 2-cell-thick band.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_zoom_band:
    ld b, a                       ; B = ring
    ld a, b
    add a, a
    ld e, a
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b
    call trans_reveal_row_range
    ld a, b
    inc a
    call trans_reveal_row_range
    ld a, 23
    sub b
    call trans_reveal_row_range
    ld a, 22
    sub b
    call trans_reveal_row_range

    ld a, b
    add a, a
    ld e, a
    ld a, 20
    sub e                         ; A = side segment height
    jr z, .trzb_done
    ld d, a                       ; D = row count
    ld a, b
    add a, 2
    ld c, a                       ; C = start row
    ld a, b
    call trans_reveal_column_range
    ld a, b
    inc a
    call trans_reveal_column_range
    ld a, 30
    sub b
    call trans_reveal_column_range
    ld a, 31
    sub b
    call trans_reveal_column_range
.trzb_done:
    ret

; ==================================================================
; trans_wait_frames
; Wait N V-blank frames where N = transition_delay_var
; Provides timed delay between animation steps
; Preserves: BC, DE, HL
; ==================================================================
trans_wait_frames:
    push bc
    ld a, (transition_delay_var)
    or a
    jr z, .twf_done               ; 0 = no wait (safety)
    ld b, a
.twf_loop:
    halt                          ; Wait for V-blank (~20ms at 50Hz)
    push bc
${frameAudioTickAsm}    pop bc
    djnz .twf_loop
.twf_done:
    pop bc
    ret

; ==================================================================
; trans_clear_column
; Write transition_fill_char to all 24 rows of a single column in the Name Table
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_column:
    push bc
    push de
    push hl
    ld l, a
    ld h, #18                     ; HL = #1800 + column (row 0)
    ld b, 24                      ; 24 rows
    di                            ; Protect VDP address setup from ISR corruption
.tcc_row:
    ld a, l
    out (#99), a                  ; VRAM address low byte
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld a, (transition_fill_char)
    out (#98), a                  ; Write transition fill char
    ld a, l                       ; HL += 32 (advance to next row)
    add a, 32
    ld l, a
    jr nc, .tcc_no_carry
    inc h
.tcc_no_carry:
    djnz .tcc_row
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_column_range
; Clears part of a Name Table column.
; Input:  A = column (0-31), C = start row (0-23), D = row count
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_column_range:
    push bc
    push de
    push hl
    ld b, d
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = start row * 32
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de                    ; HL = NAME_TABLE + row*32 + col
.tccr_loop:
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (transition_fill_char)
    out (#98), a
    ei
    ld a, l
    add a, 32
    ld l, a
    jr nc, .tccr_no_carry
    inc h
.tccr_no_carry:
    djnz .tccr_loop
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_column
; Copy one column from runtime_screen_layout to the Name Table.
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_column:
    push bc
    push de
    push hl
    ld c, a
    ld e, a
    ld d, 0
    ld hl, runtime_screen_layout
    add hl, de                    ; HL = source row 0 + column
    ld e, c
    ld d, #18                     ; DE = #1800 + column
    ld b, 24
    di
.trc_row:
    ld a, e
    out (#99), a
    ld a, d
    or #40
    out (#99), a
    ld a, (hl)
    out (#98), a
    push de
    ld de, 32
    add hl, de
    pop de
    ld a, e
    add a, 32
    ld e, a
    jr nc, .trc_no_carry
    inc d
.trc_no_carry:
    djnz .trc_row
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_column_range
; Copies part of a column from runtime_screen_layout to the Name Table.
; Input:  A = column (0-31), C = start row (0-23), D = row count
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_column_range:
    push bc
    push de
    push hl
    ld b, d
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = start row * 32
    ld e, a
    ld d, 0
    add hl, de
    push hl                       ; save row+col offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source cell
    pop hl
    push de
    ld de, #1800
    add hl, de                    ; HL = destination cell
    pop de
    di
.trcr_loop:
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (de)
    out (#98), a
    ld a, e
    add a, 32
    ld e, a
    jr nc, .trcr_src_no_carry
    inc d
.trcr_src_no_carry:
    ld a, l
    add a, 32
    ld l, a
    jr nc, .trcr_dst_no_carry
    inc h
.trcr_dst_no_carry:
    djnz .trcr_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_direct
; Write transition_fill_char to all 32 columns of a single Name Table row.
; Input:  A = row (0-23)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_row_direct:
    push bc
    push de
    push hl
    ; HL = #1800 + row * 32
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld de, #1800
    add hl, de                    ; HL = name table row start
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld b, 32
    ld a, (transition_fill_char)
.tcrd_loop:
    out (#98), a
    djnz .tcrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_range
; Clears part of a Name Table row.
; Input:  A = row (0-23), D = start column (0-31), E = char count
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_row_range:
    push bc
    push de
    push hl
    ld b, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = row * 32
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de                    ; HL = NAME_TABLE + row*32 + start col
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (transition_fill_char)
.tcrr_loop:
    out (#98), a
    djnz .tcrr_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_row_direct
; Copy one row from runtime_screen_layout to the Name Table.
; Input:  A = row (0-23)
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_row_direct:
    push bc
    push de
    push hl
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    push hl                       ; save row offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source row
    pop hl                        ; HL = row offset
    ld bc, #1800
    add hl, bc                    ; HL = name table row start
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ex de, hl                     ; HL = source row
    ld b, 32
.trrd_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .trrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_row_range
; Copies part of a row from runtime_screen_layout to the Name Table.
; Input:  A = row (0-23), D = start column (0-31), E = char count
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_row_range:
    push bc
    push de
    push hl
    ld b, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = row * 32
    ld e, d
    ld d, 0
    add hl, de
    push hl                       ; save row+col offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source range
    pop hl
    push de
    ld de, #1800
    add hl, de                    ; HL = destination range
    pop de
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ex de, hl                     ; HL = source range
.trrr_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .trrr_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_fast_filvrm
; Fill VRAM with a constant byte using direct port access
; Input:  HL = VRAM destination address
;         BC = byte count
;         A  = fill value
; Destroys: A, BC, E
; ==================================================================
trans_fast_filvrm:
    ld e, a                       ; Save fill byte
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
.tff_loop:
    ld a, e
    out (#98), a                  ; Write byte to VRAM
    dec bc
    ld a, b
    or c
    jr nz, .tff_loop
    ei
    ret

`;
        break;

      case 'Group':
        code += `gameflow_handle_group:
    ; Group node - nested GameFlow execution
    ; DE = group data pointer (nested GameFlow entry point)
    ; BC = connection table

    push bc                       ; Save parent connection table

    ; Get nested GameFlow entry point
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = nested GameFlow entry node pointer

    ; Save current GameFlow state (stack-based)
    ; In a full implementation, we'd push current node pointer
    ; For now, we'll just execute the nested flow

    ; Execute nested GameFlow
    ex de, hl                     ; HL = nested entry node
    push hl
    call gameflow_execute_node    ; Execute nested flow
    pop hl

    ; Nested flow complete, return to parent
    pop bc                        ; Restore parent connection table

    ; Follow default connection to continue parent flow
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
        break;

      case 'Music':
        const musicExecuteCommandCall = useFarCall ? 'call_music_execute_command_resident' : 'music_execute_command';
        code += `gameflow_handle_music:
    ; Music node - play/stop music
    ; DE = music data (command, track index, loop flag)
    ; BC = connection table

    push bc
    call ${musicExecuteCommandCall}
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
`;
        break;

      case 'PresentationScreen':
        {
          const megaRomPresentationWaitAsm = useFarCall ? buildGameFlowPresentationWaitAsm(analysis) : '';
          const megaRomPresentationWaitHelpers = useFarCall
            ? generateGameFlowPresentationWaitHelpers(analysis, frameAudioTickAsm)
            : '';
        code += `gameflow_handle_presentationscreen:
    ; PresentationScreen node - show full-screen presentation image
    ; DE = presentation data pointer:
    ;   [defer_init_until_transition DB]
    ; BC = connection table
    ld a, (de)
    ld (gameflow_deferred_game_init), a
    push bc
    call gameflow_begin_transition_target_render
${useFarCall ? `    call show_presentation_screen_image_far
    call gameflow_finish_transition_target_render
${megaRomPresentationWaitAsm}` : `    call show_presentation_screen`}
${useFarCall ? `` : `    call gameflow_finish_transition_target_render`}
    ; show_presentation_screen overwrites ALL of CHRTBL2 (chars 0-255 x 3 banks).
    ; Game tile patterns live at char 128+ and are now corrupted.
    ; If the next node is a Transition, keep the presentation in VRAM so
    ; the transition wipes that image first. Otherwise reload gameplay now.
    ld a, (gameflow_deferred_game_init)
    or a
    jr nz, .gps_skip_init_game_systems
    call init_game_systems
.gps_skip_init_game_systems:
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

${megaRomPresentationWaitHelpers}
`;
        }
        break;

      default:
        code += `gameflow_handle_${nodeType.toLowerCase()}:
    ; ${nodeType} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
        break;
    }
  });

  const needsPrintStringVram = nodeTypes.includes('Text') || nodeTypes.includes('TextScroll') || nodeTypes.includes('TextScrollColor') || nodeTypes.includes('SubMenu') || nodeTypes.includes('Controls');
  const hasEndNode = nodeTypes.includes('End');
  if (needsPrintStringVram && !hasEndNode) {
    code += `; ------------------------------------------------------------------
; Shared helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

`;
  }

  const hasScreenColorRuntime = Array.isArray((analysis as any).screenMaps) && (analysis as any).screenMaps.length > 0;
  const needsScreenColorRuntime = handlerNodeTypes.some((nodeType) =>
    ['SubMenu', 'Controls', 'Text', 'TextScroll', 'TextScrollColor', 'Transition', 'End', 'Restart', 'PresentationScreen'].includes(nodeType)
  );
  if (!hasScreenColorRuntime && needsScreenColorRuntime) {
    code += `; ------------------------------------------------------------------
; Fallback screen color helpers for GameFlow-only projects.
; Full projects get these from screens.asm; this keeps standalone visual
; GameFlow nodes linkable when no screenmap asset exists.
; ------------------------------------------------------------------
set_screen_colors:
    push af
    push bc
    and #0F
    ld (BAKCLR), a
    ld a, b
    and #0F
    ld (BDRCLR), a
    call CHGCLR
    pop bc
    pop af
    ret

init_char0_color:
    ret

`;
  }

  return code;
}

/**
 * Generate node structure and connection table for a specific node
 */
function generateNodeStructure(
  node: any,
  gameFlow: any,
  analysis: ProjectAnalysis,
  romMode: string = 'simple32k'
): string {
  const useFarCall = romMode === 'megarom';
  const nodeLabel = `gameflow_node_${sanitizeId(node.id)}`;
  const connLabel = `${nodeLabel}_conn`;

  // Check if node has data
  const hasData = ['Start', 'WorldLink', 'SubMenu', 'Controls', 'Text', 'TextScroll', 'TextScrollColor', 'TextScroll2', 'IfThenElse', 'Globals', 'Transition', 'Music', 'PresentationScreen'].includes(node.type) ||
                  (node.type === 'Globals' && node.variables && node.variables.length > 0);

  const dataLabel = hasData ? `${nodeLabel}_data` : 'gameflow_no_data';

  let code = `; Node: ${node.type} - "${node.title || node.name || node.id}"
${nodeLabel}:
    db ${getNodeTypeConstant(node.type)}
    dw ${dataLabel}
    dw ${connLabel}

`;

  // Generate node-specific data only if needed
  if (hasData) {
    code += `${nodeLabel}_data:
`;

    switch (node.type) {
      case 'Start':
        // Generate Start node initialization data
        code += `    dw ${nodeLabel}_init    ; Initialization routine address\n`;
        code += `    db ${getLocalCodeBankExpr(`${nodeLabel}_init`, useFarCall)}    ; Initialization routine bank\n`;

        // Generate initialization routine after the data structure
        // This will be appended after the switch
        break;

      case 'WorldLink':
        const worldAssetId = node.worldAssetId || 'default';
        const worldLoadLabel = useFarCall
          ? `load_world_${sanitizeId(worldAssetId)}_far`
          : `load_world_${sanitizeId(worldAssetId)}`;
        code += `    dw ${worldLoadLabel}\n`;
        code += `    db ((${worldLoadLabel} - #4000) / #2000)\n`;
        code += `    dw ${nodeLabel}_init\n`;
        code += `    db ${getLocalCodeBankExpr(`${nodeLabel}_init`, useFarCall)}\n`;
        break;

      case 'SubMenu':
        {
          const nodeId = sanitizeId(node.id);
          const options = (Array.isArray(node.options) ? node.options : []).slice(0, 6);
          const optionCount = options.length;
          const fallbackRaw = getSubMenuInitialOptionIndex(node);
          const fallbackIndex = optionCount > 0 ? Math.min(fallbackRaw, optionCount - 1) : 0;
          const titleText = sanitizeAsmText(node.title || node.name || 'MENU').toUpperCase();
          const submenuBgHex = node?.appearance?.colors?.background || '#000000';
          const submenuBgColor = hexToMSXColor(submenuBgHex);
          const selectorMode = getSubMenuSelectorMode(node);
          const cursorSpriteAssetId = node?.appearance?.cursorSpriteAssetId;
          const cursorSpriteIndexRaw = findSpriteAssetIndex(analysis, cursorSpriteAssetId);
          const cursorSprite = cursorSpriteIndexRaw >= 0 ? analysis.sprites?.[cursorSpriteIndexRaw] : null;
          const useSpriteCursor =
            selectorMode === 'char'
              ? false
              : selectorMode === 'sprite'
                ? cursorSpriteIndexRaw >= 0
                : cursorSpriteIndexRaw >= 0;
          const cursorSpriteIndex = useSpriteCursor ? cursorSpriteIndexRaw : 0xFF;
          const layerConfig = useSpriteCursor && cursorSprite
            ? getSpriteLayerConfigForSubmenuCursor(cursorSprite)
            : { layerOffsets: [] as number[], layerColors: [] as number[] };
          const cursorLayerOffsets = layerConfig.layerOffsets.slice(0, 4);
          const cursorLayerColors = layerConfig.layerColors.slice(0, 4);
          const cursorLayerCount = Math.min(cursorLayerColors.length, 4);
          while (cursorLayerOffsets.length < 4) {
            cursorLayerOffsets.push(0);
          }
          while (cursorLayerColors.length < 4) {
            cursorLayerColors.push(0);
          }

          // Resolve background screen load function pointer (0 = none)
          const submenuBgScreenId = node?.appearance?.backgroundScreenAssetId;
          let submenuBgScreenLabel = '0';
          if (submenuBgScreenId && analysis.screenMaps) {
            const bgScreen = analysis.screenMaps.find((s: any) => s.id === submenuBgScreenId);
            if (bgScreen) {
              const sName = (bgScreen.name as string).toUpperCase().replace(/[^A-Z0-9]/g, '_');
              const sIdSuffix = bgScreen.id ? `_${(bgScreen.id as string).replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
              const baseScreenLabel = `load_screen_${sName.toLowerCase()}${sIdSuffix.toLowerCase()}`;
              submenuBgScreenLabel = useFarCall ? `${baseScreenLabel}_far` : baseScreenLabel;
            }
          }
          const submenuBgScreenBankExpr = submenuBgScreenLabel === '0'
            ? '0'
            : `((${submenuBgScreenLabel} - #4000) / #2000)`;

          code += `    db ${submenuBgColor}    ; Background color (MSX index)\n`;
          code += `    db ${cursorSpriteIndex}    ; Cursor sprite asset index (#FF = use text marker)\n`;
          code += `    db ${cursorLayerCount}    ; Cursor sprite layer count (max 4)\n`;
          code += `    db ${cursorLayerOffsets[0]}, ${cursorLayerOffsets[1]}, ${cursorLayerOffsets[2]}, ${cursorLayerOffsets[3]}    ; Cursor source layer offsets\n`;
          code += `    db ${cursorLayerColors[0]}, ${cursorLayerColors[1]}, ${cursorLayerColors[2]}, ${cursorLayerColors[3]}    ; Cursor layer colors\n`;
          code += `    dw ${submenuBgScreenLabel}    ; Background screen load function (0=none)\n`;
          code += `    db ${submenuBgScreenBankExpr}    ; Background screen load bank\n`;
          code += `    db ${optionCount}    ; Number of options (max 6)\n`;
          code += `    db ${fallbackIndex}    ; Initial selected option\n`;
          code += `    dw submenu_${nodeId}_title\n`;
          options.forEach((_: any, idx: number) => {
            code += `    dw submenu_${nodeId}_opt${idx}\n`;
          });

          code += `\nsubmenu_${nodeId}_title:\n`;
          code += `    db "${titleText}", 0\n`;
          options.forEach((option: any, idx: number) => {
            const optionText = sanitizeAsmText(
              option?.text || option?.label || option?.name || option?.id || `OPTION ${idx + 1}`
            ).toUpperCase();
            code += `submenu_${nodeId}_opt${idx}:\n`;
            code += `    db "${optionText}", 0\n`;
          });
        }
        break;

      case 'Controls': {
        const nodeId = sanitizeId(node.id);
        const titleText = sanitizeAsmText(node.title || node.name || 'CONTROLES').toUpperCase();
        const primaryLabel = getControlsActionLabel(node.jumpActionLabel ?? node.jumpText ?? node.jumpLabel ?? node.primaryActionLabel, 'SALTO');
        const secondaryLabel = getControlsActionLabel(node.actionLabel ?? node.actionText ?? node.gameActionLabel ?? node.secondaryActionLabel, 'ACCION');
        const keyButton1 = getControlsKeyButton1Mode(node);
        const keyButton2 = getControlsKeyButton2Mode(node);
        const jumpButton = getControlsActionButtonMode(node.jumpActionButton ?? node.jumpButton, 'button1');
        const actionButton = getControlsActionButtonMode(node.actionButton ?? node.gameActionButton, 'button2');
        code += `    db ${keyButton1}    ; keyboard button 1 mode (0=SPC, 1=CTRL)\n`;
        code += `    db ${keyButton2}    ; keyboard button 2 mode (0=N, 1=CTRL)\n`;
        code += `    db ${jumpButton}    ; jump action physical button (0=B1, 1=B2)\n`;
        code += `    db ${actionButton}    ; action physical button (0=B1, 1=B2)\n`;
        code += `    dw controls_${nodeId}_title\n`;
        code += `    dw controls_${nodeId}_primary_label\n`;
        code += `    dw controls_${nodeId}_secondary_label\n\n`;
        code += `controls_${nodeId}_title:\n`;
        code += `    db "${titleText}", 0\n`;
        code += `controls_${nodeId}_primary_label:\n`;
        code += `    db "${primaryLabel}", 0\n`;
        code += `controls_${nodeId}_secondary_label:\n`;
        code += `    db "${secondaryLabel}", 0\n`;
        break;
      }

      case 'Text': {
        const nodeId = sanitizeId(node.id);
        const title = (node.title || node.name || '').replace(/"/g, '').replace(/\r?\n/g, ' ').trim().toUpperCase() || 'TEXT';
        const message = (node.message || '').replace(/"/g, '');
        const bgHex = (node as any).appearance?.colors?.background || '#000000';
        const bgColor = hexToMSXColor(bgHex);

        // Word-wrap message to 28 chars per line (leaving 2-char margin each side)
        // Respect explicit line breaks (\n) from the user
        const maxLineWidth = 28;
        const paragraphs = message.split(/\r?\n/);
        const messageLines: string[] = [];
        for (const paragraph of paragraphs) {
          const words = paragraph.split(' ');
          let currentLine = '';
          for (const word of words) {
            const upperWord = word.toUpperCase();
            const testLine = currentLine ? currentLine + ' ' + upperWord : upperWord;
            if (testLine.length > maxLineWidth && currentLine) {
              messageLines.push(currentLine);
              currentLine = upperWord;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine.trim()) messageLines.push(currentLine);
          else messageLines.push(''); // empty line for blank paragraph
        }

        const promptText = 'PRESS FIRE TO CONTINUE';

        // Build lines array: title + message lines + prompt
        const allLines: { row: number; text: string; label: string }[] = [];

        // Title at row 3
        allLines.push({ row: 3, text: title, label: `text_${nodeId}_title` });

        // Message lines starting at row 7, skip empty lines (but advance row)
        let msgRow = 7;
        let msgLabelIdx = 0;
        for (const line of messageLines) {
          if (line.trim()) {
            allLines.push({ row: msgRow, text: line, label: `text_${nodeId}_msg${msgLabelIdx}` });
            msgLabelIdx++;
          }
          msgRow++;
        }

        // Prompt at row 20
        allLines.push({ row: 20, text: promptText, label: `text_${nodeId}_prompt` });

        // Resolve background screen load function pointer
        const bgScreenId = (node as any).appearance?.backgroundScreenAssetId;
        let bgScreenLabel = '0';
        if (bgScreenId && analysis.screenMaps) {
          const bgScreen = analysis.screenMaps.find((s: any) => s.id === bgScreenId);
          if (bgScreen) {
            const sName = (bgScreen.name as string).toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const sIdSuffix = bgScreen.id ? `_${(bgScreen.id as string).replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
            const baseScreenLabel = `load_screen_${sName.toLowerCase()}${sIdSuffix.toLowerCase()}`;
            bgScreenLabel = useFarCall ? `${baseScreenLabel}_far` : baseScreenLabel;
          }
        }
        const bgScreenBankExpr = bgScreenLabel === '0'
          ? '0'
          : `((${bgScreenLabel} - #4000) / #2000)`;

        // Generate data table: bgColor, DW screen_load_ptr, DB screen_load_bank, numLines...
        code += `    DB ${bgColor}                  ; Background color (MSX index from ${bgHex})\n`;
        code += `    DW ${bgScreenLabel}            ; Background screen load function (0=none)\n`;
        code += `    DB ${bgScreenBankExpr}         ; Background screen load bank\n`;
        code += `    DB ${allLines.length}                  ; Number of lines\n`;

        for (const line of allLines) {
          const col = Math.max(0, Math.floor((32 - line.text.length) / 2));
          code += `    DB ${line.row}, ${col}              ; Row ${line.row}, Col ${col}\n`;
          code += `    DW ${line.label}          ; -> "${line.text}"\n`;
        }

        // Generate string data labels
        code += `\n`;
        for (const line of allLines) {
          code += `${line.label}:\n`;
          code += `    DB "${line.text}", 0\n`;
        }
        break;
      }

      case 'TextScroll':
      case 'TextScrollColor': {
        const nodeId = sanitizeId(node.id);
        const bgHex = node.backgroundColor || '#000000';
        const stripeHex = node.stripeColor || '#000080';
        const textHex = node.textColor || '#FFFFFF';
        const bgColor = hexToMSXColor(bgHex);
        const stripeColor = hexToMSXColor(stripeHex);
        const textColor = hexToMSXColor(textHex);
        const speedFrames = Math.max(1, Math.min(8, Number(node.speedFrames || 2) || 2));
        const rawText = String(node.text || '').replace(/\\n/g, '\n');
        const maxLineWidth = 28;
        const normalizeLine = (value: string): string => sanitizeAsmText(value)
          .toUpperCase()
          .replace(/[^\x20-\x5F]/g, '?')
          .slice(0, maxLineWidth);
        const lines: string[] = [];

        rawText.split(/\r?\n/).forEach((paragraph) => {
          const words = paragraph.split(/\s+/).filter(Boolean);
          if (words.length === 0) {
            lines.push('');
            return;
          }
          let currentLine = '';
          words.forEach((word) => {
            const upperWord = normalizeLine(word);
            const testLine = currentLine ? `${currentLine} ${upperWord}` : upperWord;
            if (testLine.length > maxLineWidth && currentLine) {
              lines.push(currentLine);
              currentLine = upperWord.slice(0, maxLineWidth);
            } else {
              currentLine = testLine.slice(0, maxLineWidth);
            }
          });
          lines.push(currentLine);
        });

        const visibleLines = lines.map(normalizeLine).slice(0, 80);
        const allLines: { text: string; label: string }[] = [];
        const title = normalizeLine(node.title || 'TEXTO SCROLL');
        if (title.trim()) {
          allLines.push({
            text: title,
            label: `textscroll_${nodeId}_title`,
          });
          allLines.push({
            text: '',
            label: `textscroll_${nodeId}_blank0`,
          });
        }
        visibleLines.forEach((line, index) => {
          allLines.push({
            text: normalizeLine(line),
            label: `textscroll_${nodeId}_line${index}`,
          });
        });

        code += `    db ${bgColor}                  ; Background color (MSX index from ${bgHex})\n`;
        code += `    db ${stripeColor}                  ; Stripe color (MSX index from ${stripeHex})\n`;
        if (node.type === 'TextScrollColor') {
          code += `    db ${textColor}                  ; Text color (MSX index from ${textHex})\n`;
        }
        code += `    db ${speedFrames}                  ; Frames per pixel step\n`;
        code += `    db ${allLines.length}                  ; Number of lines\n`;
        allLines.forEach((line) => {
          const col = Math.max(0, Math.floor((32 - line.text.length) / 2));
          code += `    db ${col}\n`;
          code += `    dw ${line.label}\n`;
        });

        code += `\n`;
        allLines.forEach((line) => {
          code += `${line.label}:\n`;
          const text = line.text.replace(/"/g, '');
          code += text ? `    db "${text}", 0\n` : `    db 0\n`;
        });
        break;
      }

      case 'TextScroll2': {
        const nodeId = sanitizeId(node.id);
        const bgHex = node.backgroundColor || '#000000';
        const stripeHex = node.stripeColor || '#000000';
        const bgColor = hexToMSXColor(bgHex);
        const stripeColor = hexToMSXColor(stripeHex);
        const speedFrames = Math.max(1, Math.min(8, Number(node.speedFrames || 2) || 2));
        const rawText = String(node.text || '').replace(/\\n/g, '\n');
        const maxLineWidth = 32;
        const normalizeLine = (value: string): string => sanitizeAsmText(value)
          .toUpperCase()
          .replace(/[^\x20-\x5F]/g, '?')
          .slice(0, maxLineWidth);
        const fixedLine = (value: string): string => normalizeLine(value).padEnd(32, ' ').slice(0, 32);
        const lines: string[] = [];

        rawText.split(/\r?\n/).forEach((paragraph) => {
          const words = paragraph.split(/\s+/).filter(Boolean);
          if (words.length === 0) {
            lines.push('');
            return;
          }
          let currentLine = '';
          words.forEach((word) => {
            const upperWord = normalizeLine(word);
            const testLine = currentLine ? `${currentLine} ${upperWord}` : upperWord;
            if (testLine.length > maxLineWidth && currentLine) {
              lines.push(currentLine);
              currentLine = upperWord.slice(0, maxLineWidth);
            } else {
              currentLine = testLine.slice(0, maxLineWidth);
            }
          });
          lines.push(currentLine);
        });

        const allLines: string[] = [];
        const title = normalizeLine(node.title || 'TEXTO SCROLL 2');
        if (title.trim()) {
          allLines.push(title);
          allLines.push('');
        }
        lines.map(normalizeLine).slice(0, 80).forEach((line) => allLines.push(line));
        const emittedLines = allLines.length > 0 ? allLines : [''];
        const lineLabel = `textscroll2_${nodeId}_lines`;

        code += `    db ${bgColor}                  ; Background color (MSX index from ${bgHex})\n`;
        code += `    db ${stripeColor}                  ; Pattern background color (MSX index from ${stripeHex})\n`;
        code += `    db ${speedFrames}                  ; Frames per pixel step\n`;
        code += `    db ${emittedLines.length}                  ; Number of fixed 32-byte lines\n`;
        code += `    dw ${lineLabel}\n\n`;
        code += `${lineLabel}:\n`;
        emittedLines.forEach((line) => {
          code += `    db "${fixedLine(line)}"\n`;
        });
        code += `    db #FF\n`;
        break;
      }

      case 'Music': {
        const trackAssetId = typeof node.trackAssetId === 'string' ? node.trackAssetId : '';
        const trackIndexMap = ((analysis as any).trackIndexByAssetId || {}) as Record<string, number>;
        const trackAssets = (((analysis as any).tracks || []) as any[]);
        let command = 0xFF;
        let trackIndex = 0xFF;
        let loopFlag = node.loop === false ? 0 : 1;
        let warning = '';

        if (node.stop === true) {
          command = 0;
          loopFlag = 0;
        } else if (node.autoPlay === false) {
          warning = '; WARNING: Music node autoPlay=false -> no-op in ROM';
        } else if (trackAssetId && trackIndexMap[trackAssetId] !== undefined) {
          command = 1;
          trackIndex = trackIndexMap[trackAssetId];
        } else if (trackAssetId) {
          const sameIdTrack = trackAssets.find((track: any) => track?.id === trackAssetId);
          if (sameIdTrack?.soundChip === 'SCC') {
            warning = `; WARNING: Track "${trackAssetId}" uses SCC and is ignored in ROM export`;
          } else {
            warning = `; WARNING: Track "${trackAssetId}" not found / not exportable as PSG`;
          }
        } else {
          warning = '; WARNING: Music node has no trackAssetId -> no-op';
        }

        code += `    db ${command}, ${trackIndex}, ${loopFlag}    ; command, track index, loop flag\n`;
        if (warning) {
          code += `    ${warning}\n`;
        }
        break;
      }

      case 'IfThenElse':
        const varName = node.variableName || 'unknown';
        const resolvedVar = resolveGlobalVariable(varName, analysis);
        const asmVarName = resolveGlobalVariableAsmName(varName, analysis);
        const numericCompareValue = resolveIfThenElseCompareValue(resolvedVar, node.compareValue);
        const operatorId = getIfThenElseOperatorId(node.operator);
        const variableType = String(resolvedVar?.type || '').toLowerCase();
        const isWordVariable = variableType === 'word' || variableType === '16bit';
        const clampedCompareValue = isWordVariable
          ? Math.max(0, Math.min(65535, numericCompareValue))
          : Math.max(0, Math.min(255, numericCompareValue));
        if (asmVarName) {
          code += `    dw ${asmVarName}    ; Variable to check\n`;
        } else {
          code += `    dw 0                 ; WARNING: Missing global variable "${varName}"\n`;
        }
        code += `    db ${clampedCompareValue & 0xFF}   ; Compare value low byte\n`;
        code += `    db ${(clampedCompareValue >> 8) & 0xFF}   ; Compare value high byte\n`;
        code += `    db ${operatorId}   ; Operator (0===, 1=!=, 2=>, 3=<, 4=>=, 5=<=)\n`;
        code += `    db ${isWordVariable ? 1 : 0}   ; Variable size (0=byte, 1=word)\n`;
        break;

      case 'Globals':
        if (node.variables && node.variables.length > 0) {
          const resolvedAssignments = node.variables
            .map((v: any) => {
              const vName = v.variableName || v.name || 'unknown';
              const vAsmName = resolveGlobalVariableAsmName(vName, analysis);
              const vValue = v.value || 0;
              return { vName, vAsmName, vValue };
            })
            .filter((entry: any) => !!entry.vAsmName);

          code += `    db ${resolvedAssignments.length}    ; Number of assignments\n`;
          resolvedAssignments.forEach((entry: any) => {
            code += `    dw ${entry.vAsmName}\n`;
            code += `    db ${entry.vValue}\n`;
          });

          const missingAssignments = node.variables.length - resolvedAssignments.length;
          if (missingAssignments > 0) {
            code += `    ; WARNING: ${missingAssignments} Globals assignment(s) skipped (undefined global variable)\n`;
          }

          if (resolvedAssignments.length === 0) {
            code += `    ; No valid global assignments found\n`;
          }
        } else {
          code += `    db 0    ; No assignments\n`;
        }
        break;

      case 'Transition': {
        // Effect IDs match execute_transition_effect dispatch (0-15)
        const transEffectMap: Record<string, number> = {
          'cls': 0,
          'dissolve_pixels': 1,
          'dissolve_chars': 2,
          'vertical_lines': 3,
          'horizontal_lines': 4,
          'spiral': 5,
          'fill_white_squares': 6,
          'diagonal_clear': 7,
          'diagonal_inverse': 8,
          'checkerboard': 9,
          'doors': 10,
          'center_curtain': 11,
          'venetian_blinds': 12,
          'radial_wipe': 13,
          'block4_shuffle': 14,
          'zoom_box': 15,
        };
        // Steps per effect = number of animation stages (each stage = N frames)
        const transStepsMap: Record<string, number> = {
          'cls': 1,
          'dissolve_pixels': 8,
          'dissolve_chars': 8,
          'vertical_lines': 16,
          'horizontal_lines': 24,
          'spiral': 12,   // 12 Name Table rings
          'fill_white_squares': 4,
          'diagonal_clear': 48, // 768 name-table chars in 16-char batches
          'diagonal_inverse': 48, // 768 name-table chars in 16-char batches
          'checkerboard': 2,
          'doors': 16,
          'center_curtain': 16,
          'venetian_blinds': 2,
          'radial_wipe': 27,
          'block4_shuffle': 64,
          'zoom_box': 6,
        };
        const transEffectId = transEffectMap[node.effect] ?? 0;
        const transSteps = transStepsMap[node.effect] ?? 8;
        const transDurationMs = node.duration ?? 1000;
        // Convert ms → frames per step (50Hz MSX = 20ms/frame). Clamp to 1-255.
        const transFramesPerStep = Math.max(1, Math.min(255,
          Math.round(transDurationMs / transSteps / 20)
        ));
        const transFillChar = Number(node.fillChar) === 255 ? 255 : 254;
        code += `    db ${transEffectId}              ; Effect: ${node.effect || 'cls'}\n`;
        code += `    db ${transFramesPerStep}              ; Frames per step (duration ${transDurationMs}ms / ${transSteps} steps / 20ms)\n`;
        code += `    db ${transFillChar}              ; Fill char (${transFillChar === 255 ? 'SPC blank' : 'box outline'})\n`;
        break;
      }

      case 'PresentationScreen': {
        const deferInit = presentationScreenDefersGameInitToTransition(node, gameFlow) ? 1 : 0;
        code += `    db ${deferInit}              ; Defer init_game_systems until after next Transition\n`;
        break;
      }
    }

    code += `\n`;
  }

  // Generate connection table
  code += `${connLabel}:
`;

  const connections = gameFlow.connections?.filter((c: any) =>
    (c.from?.nodeId || c.from) === node.id
  ) || [];

  if (node.type === 'IfThenElse') {
    // THEN/ELSE connections
    const thenConn = connections.find((c: any) => c.from?.sourceId === 'then' || !c.from?.sourceId);
    const elseConn = connections.find((c: any) => c.from?.sourceId === 'else');

    code += `    db CONNECTION_THEN\n`;
    code += `    dw ${thenConn ? `gameflow_node_${sanitizeId(thenConn.to?.nodeId || thenConn.to)}` : '0'}\n`;
    code += `    db CONNECTION_ELSE\n`;
    code += `    dw ${elseConn ? `gameflow_node_${sanitizeId(elseConn.to?.nodeId || elseConn.to)}` : '0'}\n`;
  } else if (node.type === 'SubMenu') {
    // Option connections
    const options = (Array.isArray(node.options) ? node.options : []).slice(0, 6);
    options.forEach((option: any, idx: number) => {
      const optConn = connections.find((c: any) => c.from?.sourceId === option.id);
      code += `    db CONNECTION_OPTION_${idx}\n`;
      code += `    dw ${optConn ? `gameflow_node_${sanitizeId(optConn.to?.nodeId || optConn.to)}` : '0'}\n`;
    });
  } else {
    // Single default connection
    const defaultConn = connections[0];
    code += `    db CONNECTION_DEFAULT\n`;
    code += `    dw ${defaultConn ? `gameflow_node_${sanitizeId(defaultConn.to?.nodeId || defaultConn.to)}` : '0'}\n`;
  }

  code += `    db CONNECTION_END\n\n`;

  // Generate initialization routine for Start nodes
  if (node.type === 'Start') {
    code += generateStartNodeInitRoutine(node, nodeLabel, analysis, gameFlow, romMode);
  }
  if (node.type === 'WorldLink') {
    code += generateWorldLinkNodeInitRoutine(node, nodeLabel, analysis);
  }

  return code;
}

function generateGlobalInitializationAsm(initGlobals: any, analysis: ProjectAnalysis): string {
  if (!initGlobals?.enabled) {
    return '';
  }

  const toDefaultAsmName = (name: string): string =>
    `global_var_${name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;

  let code = `    ; === Global Variables Initialization ===\n`;
  const explicitVariables = Array.isArray(initGlobals.variables) ? initGlobals.variables : [];

  if (explicitVariables.length > 0) {
    explicitVariables.forEach((entry: any) => {
      const rawVarName = String(entry?.variableName || '').trim();
      if (!rawVarName) return;

      const resolvedVar = resolveGlobalVariable(rawVarName, analysis);
      const varName = String(resolvedVar?.name || rawVarName);
      const asmVarName = String(resolvedVar?.asmName || toDefaultAsmName(varName));
      const type = String(resolvedVar?.type || '').toLowerCase();

      let numericValue = 0;
      if (typeof entry.value === 'boolean') {
        numericValue = entry.value ? 1 : 0;
      } else {
        const parsedValue = Number(entry.value);
        numericValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;
      }

      if (type === 'word' || type === '16bit') {
        const wordValue = Math.max(0, Math.min(65535, numericValue));
        code += `    ld a, ${wordValue & 0xFF}\n`;
        code += `    ld (${asmVarName}), a    ; ${varName} low byte = ${wordValue}\n`;
        code += `    ld a, ${(wordValue >> 8) & 0xFF}\n`;
        code += `    ld (${asmVarName}+1), a    ; ${varName} high byte = ${wordValue}\n`;
        return;
      }

      const byteValue = Math.max(0, Math.min(255, numericValue));
      code += `    ld a, ${byteValue}\n`;
      code += `    ld (${asmVarName}), a    ; ${varName} = ${byteValue}\n`;
    });
  } else {
    code += `    ; Initialize all global variables to default values\n`;
    code += `    call init_all_global_variables\n`;
  }

  code += `\n`;
  return code;
}

function generateWorldLinkNodeInitRoutine(node: any, nodeLabel: string, analysis: ProjectAnalysis): string {
  let code = `; ------------------------------------------------------------------
; ${nodeLabel}_init
; Initialization routine for WorldLink node
; Applies optional per-world global values when entering the world
; ------------------------------------------------------------------
${nodeLabel}_init:
`;

  code += generateGlobalInitializationAsm(node.initializeGlobals, analysis);
  code += `    ret\n\n`;
  return code;
}

function getDefaultConnectionTargetNode(node: any, gameFlow: any): any | undefined {
  const defaultConnection = gameFlow.connections?.find((connection: any) =>
    (connection.from?.nodeId || connection.from) === node.id
  );
  const nextNodeId = defaultConnection?.to?.nodeId || defaultConnection?.to;
  return gameFlow.nodes?.find((candidate: any) => candidate.id === nextNodeId);
}

function presentationScreenDefersGameInitToTransition(node: any, gameFlow: any): boolean {
  return getDefaultConnectionTargetNode(node, gameFlow)?.type === 'Transition';
}

/**
 * Generate initialization routine for Start node
 */
function startNodeDefersGameInitForPresentation(node: any, gameFlow: any, romMode: string): boolean {
  if (romMode !== 'megarom') {
    return false;
  }
  return getDefaultConnectionTargetNode(node, gameFlow)?.type === 'PresentationScreen';
}

function generateStartNodeInitRoutine(
  node: any,
  nodeLabel: string,
  analysis: ProjectAnalysis,
  gameFlow: any,
  romMode: string
): string {
  let code = `; ------------------------------------------------------------------
; ${nodeLabel}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${nodeLabel}_init:
`;

  const systemConfig = node.systemConfig;

  const deferGameInitForPresentation = startNodeDefersGameInitForPresentation(node, gameFlow, romMode);
  if (deferGameInitForPresentation) {
    code += `    ; === Core Game Systems Initialization deferred ===\n`;
    code += `    ; PresentationScreen reloads gameplay VRAM and entities after its wait.\n\n`;
  } else {
    // CRITICAL: Always call init_game_systems to initialize ECS components,
    // entities, and load game assets. Without this, the screen stays black
    // because no patterns, sprites, or entities are set up.
    code += `    ; === Core Game Systems Initialization (ALWAYS required) ===\n`;
    code += `    call init_game_systems\n\n`;
  }

  // 1. Initialize MSX Systems (if configured)
  if (systemConfig) {
    code += `    ; === MSX System Initialization ===\n`;

    if (systemConfig.initPSG) {
      code += `    ; Initialize PSG (silence all channels)\n`;
      code += `    call init_psg_silence\n\n`;
    }

    if (systemConfig.clearSprites) {
      code += `    ; Clear sprite attribute table\n`;
      code += `    call clear_sprite_table\n\n`;
    }

    if (systemConfig.clearVRAM) {
      code += `    ; Clear VRAM areas\n`;
      code += `    call clear_vram_areas\n\n`;
    }

    if (systemConfig.resetVDP) {
      code += `    ; Reset VDP registers to default\n`;
      code += `    call reset_vdp_registers\n\n`;
    }
  }

  // 2. Initialize Global Variables (if configured)
  code += generateGlobalInitializationAsm(node.initializeGlobals, analysis);

  // 3. Initial delay (if configured)
  if (systemConfig && systemConfig.initialDelayFrames && systemConfig.initialDelayFrames > 0) {
    code += `    ; Initial delay\n`;
    code += `    ld b, ${systemConfig.initialDelayFrames}\n`;
    code += `.delay_loop:\n`;
    code += `    halt    ; Wait for V-blank\n`;
    code += `    djnz .delay_loop\n\n`;
  }

  code += `    ret\n\n`;

  return code;
}

/**
 * Generate default GameFlow when none exists
 */
function generateDefaultGameFlow(
  analysis: ProjectAnalysis,
  executionPlan?: ExecutionPlan,
  romMode: string = 'simple32k'
): string {
  const defaultHudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
  const defaultHasHud = defaultHudRuntimeScreenIndexes.length > 0;
  const defaultStartHudAsm = generateConditionalRenderHudAsm(defaultHudRuntimeScreenIndexes, 'gf_default_start_hud', true);
  const defaultLoopHudAsm = generateConditionalRenderHudAsm(defaultHudRuntimeScreenIndexes, 'gf_default_loop_hud');
  const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);
  const defaultBossUpdateAsm = projectHasBossRuntime(analysis)
    ? `    call update_boss_system
`
    : '';
  const firstScreen = analysis.screenMaps && analysis.screenMaps.length > 0 ? analysis.screenMaps[0] : null;
  const firstImportedHudFrameDrawRoutine = firstScreen ? getImportedHudFrameDrawRoutineName(firstScreen as any) : null;
  const useFarCall = romMode === 'megarom';
  const firstScreenLoadCode = firstScreen
    ? `    call ${getScreenLoadRoutineName(firstScreen)}${useFarCall ? '_far' : ''}\n`
    : `    ; No screens available\n`;

  const componentTriggerHelpersAsm = shouldEmitComponentTriggerHelpersInGameFlow(analysis, romMode)
    ? generateComponentTriggerHelpers()
    : '';

  return `; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${firstScreenLoadCode}${firstImportedHudFrameDrawRoutine ? `    ; Draw imported HUD frame once at game start
    call ${firstImportedHudFrameDrawRoutine}
` : ``}
${defaultHasHud ? `    ; Bootstrap HUD only on screens that define HUD elements
${defaultStartHudAsm}` : ``}    ret

; @mideas:block id=runtime.gameflow.world_loop kind=routine owner=gameflow roots=gameflow_world_game_loop
gameflow_world_game_loop:
    halt                            ; Frame sync at loop start (V-Blank edge)
${frameAudioTickAsm}    ; Poll input immediately after V-Blank so hero movement lands
    ; in the same frame that gets uploaded to SAT.
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_pre_update
    call task_update_input
    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_pre_update
    call update_player_fastpath
.skip_player_fastpath_pre_update:
    call check_world_screen_transition
    call update_all_entities
    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_before_sm
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_before_sm
    call refresh_player_deadly_fastpath
    call refresh_player_tile_interaction_fastpath
    call refresh_player_state_machine_fastpath
.skip_player_fastpath_before_sm:
    call execute_all_state_machines
    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_post_update
    ld a, (player_hard_tick_enabled)
    or a
    jp nz, .skip_player_fastpath_post_update
    call refresh_player_wallgrab_fastpath
    call update_wallgrab_component
    call refresh_player_animation_fastpath
    call refresh_player_sprite_fastpath
.skip_player_fastpath_post_update:
${defaultBossUpdateAsm}    call update_sprites_to_vram     ; Upload current-frame sprite positions
    call update_animated_tiles      ; Defer tile VRAM work behind hero updates
${defaultHasHud ? `    ; Render HUD only on screens that define HUD elements
${defaultLoopHudAsm}
` : ``}
    jp gameflow_world_game_loop
; @mideas:endblock id=runtime.gameflow.world_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

${componentTriggerHelpersAsm}

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`;
}
