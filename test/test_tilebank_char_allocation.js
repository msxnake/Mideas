/**
 * Validate TileBank char allocation contracts for SCREEN 2.
 */

import fs from 'fs';

const optimizerSource = fs.readFileSync('utils/tileBankOptimization.ts', 'utf8');
const editorSource = fs.readFileSync('components/editors/TileBankEditor.tsx', 'utf8');
const screen2TileBanksSource = fs.readFileSync('utils/msxGenerator/utils/screen2TileBanks.ts', 'utf8');
const screensGeneratorSource = fs.readFileSync('utils/msxGenerator/generators/screensGenerator.ts', 'utf8');
const patternsSource = fs.readFileSync('utils/msxGenerator/generators/patternsGenerator.ts', 'utf8');
const colorsSource = fs.readFileSync('utils/msxGenerator/generators/colorsGenerator.ts', 'utf8');
const screensSource = fs.readFileSync('utils/msxGenerator/generators/screensGenerator.ts', 'utf8');
const gameFlowSource = fs.readFileSync('utils/msxGenerator/generators/gameFlowGenerator.ts', 'utf8');
const variablesSource = fs.readFileSync('utils/msxGenerator/generators/variablesGenerator.ts', 'utf8');
const unifiedSource = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const gameFlowEditorSource = fs.readFileSync('components/editors/GameFlowEditor.tsx', 'utf8');
const gameFlowPreviewSource = fs.readFileSync('components/modals/GameFlowPreviewModal.tsx', 'utf8');

const failures = [];

if (!optimizerSource.includes('export const SCREEN2_MAX_ASSIGNABLE_TILE_CHAR_CODE = 253')) {
  failures.push('SCREEN 2 tile chars must reserve 254 for transition box and 255 for empty/SPC');
}

if (!optimizerSource.includes('export const SCREEN2_TRANSITION_BOX_CHAR_CODE = 254')) {
  failures.push('SCREEN 2 tile chars must expose char 254 as the transition box sentinel');
}

if (!optimizerSource.includes('export const SCREEN2_MIN_ASSIGNABLE_TILE_CHAR_CODE = 1')) {
  failures.push('SCREEN 2 tile chars must reserve 0 for blank/runtime clear state');
}

if (!optimizerSource.includes('if (rangeStart > rangeEnd) return rangesToTry')) {
  failures.push('TileBank allocator must not clamp reserved-only ranges back into assignable chars');
}

if (!screen2TileBanksSource.includes('const RUNTIME_SCREEN2_CHAR_MAX = 253')) {
  failures.push('Runtime SCREEN 2 tilebank materialization must not write char 254');
}

if (!patternsSource.includes('const BASE_SCREEN2_DYNAMIC_CHAR_CAPACITY = 126')) {
  failures.push('Base SCREEN 2 pattern upload must stop at char 253');
}

if (!colorsSource.includes('const BASE_SCREEN2_DYNAMIC_CHAR_CAPACITY = 126')) {
  failures.push('Base SCREEN 2 color upload must stop at char 253');
}

if (!screensSource.includes('transition_box_char_pattern') || !screensSource.includes('db #FF, #81, #81, #81, #81, #81, #81, #FF')) {
  failures.push('Screen runtime must initialize char 254 as an 8x8 outline square');
}

if (!variablesSource.includes('transition_fill_char')) {
  failures.push('GameFlow runtime variables must reserve transition_fill_char for per-node transition wipe chars');
}

if (!variablesSource.includes('gameflow_reveal_world_after_load') || !variablesSource.includes('transition_effect_id')) {
  failures.push('GameFlow runtime variables must track Transition->WorldLink target reveal state');
}

if (!gameFlowSource.includes('ld (transition_fill_char), a') || !gameFlowSource.includes('ld a, (transition_fill_char)')) {
  failures.push('GameFlow name-table transitions must write the node-selected transition fill char');
}

if (gameFlowSource.includes('trans_clear_pixel_row_colors') || gameFlowSource.includes('fg=black, bg=black') || gameFlowSource.includes('color table layout')) {
  failures.push('GameFlow transitions must not raster-wipe through SCREEN 2 color table bytes');
}

if (!gameFlowSource.includes('trans_clear_row_range:') || !gameFlowSource.includes('trans_clear_column_range:') || !gameFlowSource.includes("'spiral': 12")) {
  failures.push('GameFlow dissolve/spiral transitions must operate as Name Table character ranges');
}

if (gameFlowPreviewSource.includes('fillRect(x, y, 1, 1)') || gameFlowPreviewSource.includes('spiralStep')) {
  failures.push('GameFlow preview transitions must not simulate pixel-level raster wipes');
}

if (!gameFlowPreviewSource.includes('drawTransitionRowRange') || !gameFlowPreviewSource.includes('drawTransitionColumnRange')) {
  failures.push('GameFlow preview spiral must draw Name Table row/column ranges');
}

if (!gameFlowSource.includes('trans_diag_inverse_setup_diagonal:') || !gameFlowSource.includes("'diagonal_inverse': 8")) {
  failures.push('GameFlow must expose the inverse diagonal transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('diagonal_inverse') || !gameFlowPreviewSource.includes("case 'diagonal_inverse'")) {
  failures.push('GameFlow editor and preview must expose the inverse diagonal transition');
}

if (!gameFlowSource.includes('trans_clear_checkerboard_pass:') || !gameFlowSource.includes("'checkerboard': 9")) {
  failures.push('GameFlow must expose the checkerboard transition in ASM and serialized data');
}

if (!gameFlowSource.includes('.trans_doors:') || !gameFlowSource.includes("'doors': 10")) {
  failures.push('GameFlow must expose the doors transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('checkerboard') || !gameFlowEditorSource.includes('doors') || !gameFlowPreviewSource.includes("case 'checkerboard'") || !gameFlowPreviewSource.includes("case 'doors'")) {
  failures.push('GameFlow editor and preview must expose checkerboard and doors transitions');
}

if (!gameFlowSource.includes('.trans_center_curtain:') || !gameFlowSource.includes("'center_curtain': 11")) {
  failures.push('GameFlow must expose the center curtain transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('center_curtain') || !gameFlowPreviewSource.includes("case 'center_curtain'")) {
  failures.push('GameFlow editor and preview must expose the center curtain transition');
}

if (!gameFlowSource.includes('.trans_venetian_blinds:') || !gameFlowSource.includes("'venetian_blinds': 12")) {
  failures.push('GameFlow must expose the venetian blinds transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('venetian_blinds') || !gameFlowPreviewSource.includes("case 'venetian_blinds'")) {
  failures.push('GameFlow editor and preview must expose the venetian blinds transition');
}

if (!gameFlowSource.includes('trans_clear_manhattan_pass:') || !gameFlowSource.includes("'radial_wipe': 13")) {
  failures.push('GameFlow must expose the radial wipe transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('radial_wipe') || !gameFlowPreviewSource.includes("case 'radial_wipe'")) {
  failures.push('GameFlow editor and preview must expose the radial wipe transition');
}

if (!gameFlowSource.includes('trans_clear_block4_order:') || !gameFlowSource.includes('trans_reveal_row_range:') || !gameFlowSource.includes("'block4_shuffle': 14")) {
  failures.push('GameFlow must expose the block4 shuffle transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('block4_shuffle') || !gameFlowPreviewSource.includes("case 'block4_shuffle'")) {
  failures.push('GameFlow editor and preview must expose the block4 shuffle transition');
}

if (!gameFlowSource.includes('trans_clear_zoom_band:') || !gameFlowSource.includes('trans_reveal_column_range:') || !gameFlowSource.includes("'zoom_box': 15")) {
  failures.push('GameFlow must expose the zoom box transition in ASM and serialized data');
}

if (!gameFlowEditorSource.includes('zoom_box') || !gameFlowPreviewSource.includes("case 'zoom_box'")) {
  failures.push('GameFlow editor and preview must expose the zoom box transition');
}

if (!gameFlowSource.includes('const transFillChar = Number(node.fillChar) === 255 ? 255 : 254')) {
  failures.push('GameFlow transition data must serialize fillChar as either 254 or 255');
}

if (!gameFlowEditorSource.includes('fillChar: 254') || !gameFlowEditorSource.includes('SPC blank (255)')) {
  failures.push('GameFlow editor must expose the transition fill char selector');
}

if (!/call init_char0_color[\s\S]{0,600}call execute_transition_effect/.test(gameFlowSource)) {
  failures.push('GameFlow transitions must reinstall reserved char 254 before wiping');
}

if (!gameFlowSource.includes('cp NODE_TYPE_TRANSITION') || !gameFlowSource.includes('Chain transitions without an intermediate VRAM restore/clear')) {
  failures.push('GameFlow must chain consecutive Transition nodes without an intermediate VRAM restore/clear');
}

if (!gameFlowSource.includes('execute_transition_reveal_target:') || !gameFlowSource.includes('call execute_transition_reveal_target')) {
  failures.push('GameFlow WorldLink transitions must reveal the loaded target screen by raster');
}

if (!unifiedSource.includes('.igs_skip_disscr') || !unifiedSource.includes('.igs_skip_enascr')) {
  failures.push('init_game_systems must keep the transition cover visible during Transition->WorldLink reveal');
}

if (!gameFlowSource.includes('trans_reveal_column:') || !gameFlowSource.includes('trans_reveal_row_direct:')) {
  failures.push('GameFlow target reveal must copy runtime_screen_layout by column/row raster');
}

if (!screensGeneratorSource.includes('gameflow_reveal_world_after_load')) {
  failures.push('Screen loaders must skip direct Name Table copy while GameFlow target reveal is pending');
}

if (!optimizerSource.includes('export const findAvailableScreen2CharBlock')) {
  failures.push('TileBank optimizer must expose contiguous char block allocation');
}

if (!optimizerSource.includes('return isAssignableScreen2TileCharCode(resolvedCharCode) ? resolvedCharCode : undefined')) {
  failures.push('TileBank char resolution must reject out-of-range base+offset instead of wrapping');
}

if (optimizerSource.includes('baseCharCode + localIndex) & 0xff') || optimizerSource.includes('optimizedCharCode & 0xff')) {
  failures.push('TileBank char resolution must not use byte wraparound for tile parts');
}

if (!editorSource.includes('allocateTileCharMap')) {
  failures.push('TileBankEditor must allocate tile char maps through one grouped allocator');
}

if (!editorSource.includes('findAvailableScreen2CharBlock(')) {
  failures.push('TileBankEditor must request contiguous free blocks for new tile chars');
}

if (!editorSource.includes('bloque contiguo')) {
  failures.push('TileBankEditor error text should explain contiguous block exhaustion');
}

if (failures.length > 0) {
  console.error('TileBank char allocation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('TileBank char allocation validation passed');
