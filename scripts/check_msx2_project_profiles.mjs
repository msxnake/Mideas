#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const read = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8');

const profilesSource = read('utils', 'msx2ProjectProfiles.ts');
const typesSource = read('types.ts');
const appUiSource = read('components', 'AppUI.tsx');
const projectHandlersSource = read('handlers', 'useProjectHandlers.tsx');
const newProjectModalSource = read('components', 'modals', 'NewProjectModal.tsx');
const pickerSource = read('components', 'modals', 'Msx2GameProfilePicker.tsx');
const projectTargetSource = read('utils', 'projectTarget.ts');
const roomEditorSource = read('components', 'editors', 'Msx2Screen4RoomEditor.tsx');
const msx2EditorPartsSource = read('components', 'msx2_screen4_editor', 'Msx2Screen4EditorParts.tsx');
const toolbarSource = read('components', 'layout', 'Toolbar.tsx');
const generatorIndexSource = read('utils', 'msxGenerator', 'index.ts');
const packageJson = JSON.parse(read('package.json'));

const errors = [];

const requiredProfileIds = ['platform', 'maze', 'shooterVertical', 'shooterHorizontal', 'bitmapPlatform'];
const creatableProfileIds = ['platform', 'maze', 'shooterVertical', 'shooterHorizontal', 'bitmapPlatform'];
for (const profileId of requiredProfileIds) {
  if (!profilesSource.includes(`${profileId}:`)) {
    errors.push(`Missing PROFILE_DEFINITIONS entry for ${profileId}`);
  }
}

for (const token of [
  'buildMsx2ProjectProfile',
  'filterMsx2EntityPresetsForProfile',
  'filterEntityTemplatesForMsx2Profile',
  'isEntityTemplateAllowedForMsx2Profile',
  'getMsx2ProfileEntityLabels',
  'getMsx2LockedRuntimeMode',
  'filterMsx2EntityMovementOptionsForProfile',
  'mapMsx2MovementOptionToEngine',
  'isAssetTypeAllowedForMsx2Profile',
  'buildStarterMsx2ScreenAsset',
  'buildStarterMsx2BitmapRoomAsset',
  'usesMsx2BitmapRoomStarter',
  'buildStarterMsx2GameFlowAsset',
  'MSX2_GAME_PROFILE_OPTIONS',
  'MSX2_CREATABLE_GAME_PROFILE_IDS',
]) {
  if (!profilesSource.includes(token)) {
    errors.push(`msx2ProjectProfiles.ts missing export/helper ${token}`);
  }
}

if (!/MSX2_CREATABLE_GAME_PROFILE_IDS:\s*Msx2GameProfileId\[\]\s*=\s*\[[\s\S]*?'platform'[\s\S]*?'maze'[\s\S]*?'shooterVertical'[\s\S]*?'shooterHorizontal'[\s\S]*?\]/.test(profilesSource)) {
  errors.push('MSX2_CREATABLE_GAME_PROFILE_IDS must list platform, maze, shooterVertical and shooterHorizontal');
}
if (!profilesSource.includes('MSX2_GAME_PROFILE_OPTIONS: Msx2GameProfileOption[] = MSX2_CREATABLE_GAME_PROFILE_IDS.map')) {
  errors.push('MSX2_GAME_PROFILE_OPTIONS must be built only from MSX2_CREATABLE_GAME_PROFILE_IDS');
}
const creatableBlock = profilesSource.match(/MSX2_CREATABLE_GAME_PROFILE_IDS:[\s\S]*?\];/)?.[0] || '';
if (!creatableBlock.includes('bitmapPlatform')) {
  errors.push('bitmapPlatform must be listed in MSX2_CREATABLE_GAME_PROFILE_IDS (exposed as Experimental SCREEN 5 bitmap room)');
}
if (!profilesSource.includes('MSX2_EXPERIMENTAL_GAME_PROFILE_IDS')) {
  errors.push('msx2ProjectProfiles.ts must define MSX2_EXPERIMENTAL_GAME_PROFILE_IDS');
}
if (!/MSX2_EXPERIMENTAL_GAME_PROFILE_IDS:[\s\S]*?'bitmapPlatform'/.test(profilesSource)) {
  errors.push('bitmapPlatform must be marked experimental in MSX2_EXPERIMENTAL_GAME_PROFILE_IDS');
}
if (!pickerSource.includes('Experimental')) {
  errors.push('Msx2GameProfilePicker.tsx must show an Experimental badge for experimental profiles');
}

const entityTemplateEditorSource = read('components', 'editors', 'EntityTemplateEditor.tsx');
if (!entityTemplateEditorSource.includes('filterEntityTemplatesForProject')) {
  errors.push('EntityTemplateEditor.tsx must filter templates with filterEntityTemplatesForProject');
}
if (!entityTemplateEditorSource.includes('msx2ProjectProfile')) {
  errors.push('EntityTemplateEditor.tsx must accept msx2ProjectProfile');
}

if (!projectTargetSource.includes('MSX2_UI_HIDDEN_ASSET_TYPES')) {
  errors.push('projectTarget.ts must define MSX2_UI_HIDDEN_ASSET_TYPES');
}
// One ROM = one MSX2 graphics mode: tile (SCREEN 4) profiles only allow tile screens, and the
// bitmap room (SCREEN 5) profile only allows bitmap rooms. The two screen-mode asset types
// (`msx2screen` / `msx2bitmaproom`) must never be offered together.
if (!profilesSource.includes('MSX2_TILE_SCREEN_ASSET_TYPES')) {
  errors.push('msx2ProjectProfiles.ts must define MSX2_TILE_SCREEN_ASSET_TYPES');
}
if (!profilesSource.includes('MSX2_BITMAP_ROOM_ASSET_TYPES')) {
  errors.push('msx2ProjectProfiles.ts must define MSX2_BITMAP_ROOM_ASSET_TYPES');
}
if (!profilesSource.includes("'msx2bitmaproom'")) {
  errors.push('msx2ProjectProfiles.ts must reference msx2bitmaproom for the bitmap room (SCREEN 5) profile');
}
if (!profilesSource.includes("'msx2screen'")) {
  errors.push('msx2ProjectProfiles.ts must reference msx2screen for tile (SCREEN 4) profiles');
}

const sharedAssetList = profilesSource.match(/MSX2_SHARED_ASSET_TYPES[^=]*=\s*\[[\s\S]*?\];/)?.[0] || '';
const tileAssetList = profilesSource.match(/MSX2_TILE_SCREEN_ASSET_TYPES[^=]*=\s*\[[\s\S]*?\];/)?.[0] || '';
const bitmapAssetList = profilesSource.match(/MSX2_BITMAP_ROOM_ASSET_TYPES[^=]*=\s*\[[\s\S]*?\];/)?.[0] || '';
if (sharedAssetList.includes("'msx2screen'") || sharedAssetList.includes("'msx2bitmaproom'")) {
  errors.push('MSX2_SHARED_ASSET_TYPES must not contain screen-mode-specific types (msx2screen/msx2bitmaproom)');
}
if (!tileAssetList.includes("'msx2screen'")) {
  errors.push('MSX2_TILE_SCREEN_ASSET_TYPES must include msx2screen');
}
if (tileAssetList.includes("'msx2bitmaproom'")) {
  errors.push('MSX2_TILE_SCREEN_ASSET_TYPES must NOT include msx2bitmaproom (no SCREEN 4/SCREEN 5 mixing)');
}
if (!bitmapAssetList.includes("'msx2bitmaproom'")) {
  errors.push('MSX2_BITMAP_ROOM_ASSET_TYPES must include msx2bitmaproom');
}
if (bitmapAssetList.includes("'msx2screen'")) {
  errors.push('MSX2_BITMAP_ROOM_ASSET_TYPES must NOT include msx2screen (no SCREEN 4/SCREEN 5 mixing)');
}

for (const tileProfile of ['platform', 'maze', 'shooterVertical', 'shooterHorizontal']) {
  const usesTileList = new RegExp(`${tileProfile}:[\\s\\S]*?allowedAssetTypes:\\s*\\[\\.\\.\\.MSX2_TILE_SCREEN_ASSET_TYPES\\]`);
  if (!usesTileList.test(profilesSource)) {
    errors.push(`${tileProfile} profile must use MSX2_TILE_SCREEN_ASSET_TYPES (tile SCREEN 4, no bitmap rooms)`);
  }
}
if (!/bitmapPlatform:[\s\S]*?allowedAssetTypes:\s*\[\.\.\.MSX2_BITMAP_ROOM_ASSET_TYPES\]/.test(profilesSource)) {
  errors.push('bitmapPlatform profile must use MSX2_BITMAP_ROOM_ASSET_TYPES (bitmap SCREEN 5, no tile screens)');
}

// allowedAssetTypes must be baseline-authoritative (not unioned with saved profiles), otherwise a
// legacy mixed project would keep both screen-mode types after normalization.
if (/allowedAssetTypes:\s*mergeUnique\(/.test(profilesSource)) {
  errors.push('normalizeMsx2ProjectProfile must NOT mergeUnique allowedAssetTypes (screen-mode types are baseline-authoritative)');
}

// Export-time guard: mixed-mode projects must be blocked, not silently routed to one backend.
for (const helper of ['detectMsx2ScreenModeConflict', 'getMsx2ScreenModeConflictMessage']) {
  if (!profilesSource.includes(helper)) {
    errors.push(`msx2ProjectProfiles.ts must export ${helper} (MSX2 screen-mode conflict guard)`);
  }
}
if (!generatorIndexSource.includes('getMsx2ScreenModeConflictMessage')
  || !/getMsx2ScreenModeConflictMessage[\s\S]*?throw new Error/.test(generatorIndexSource)) {
  errors.push('generateModularASM must call getMsx2ScreenModeConflictMessage and throw on a screen-mode conflict');
}

for (const token of [
  'filterEntityTemplatesForProject(DEFAULT_ENTITY_TEMPLATES, newProjectScreenMode, profile)',
  'filterComponentDefinitionsForProject(DEFAULT_COMPONENT_DEFINITIONS, newProjectScreenMode, profile)',
]) {
  if (!projectHandlersSource.includes(token)) {
    errors.push(`useProjectHandlers.tsx missing ${token}`);
  }
}

for (const token of [
  'Msx2GameProfileId',
  'Msx2ProjectProfile',
  'Msx2ProjectProfileFilters',
]) {
  if (!typesSource.includes(token)) {
    errors.push(`types.ts missing ${token}`);
  }
}

for (const token of [
  'Msx2GameProfilePicker',
  'pendingMsx2NewProject',
  'handleRequestMsx2GameProfile',
  'handleConfirmMsx2GameProfile',
  'msx2ProjectProfile={msx2ProjectProfile}',
]) {
  if (!appUiSource.includes(token)) {
    errors.push(`AppUI.tsx missing wiring for ${token}`);
  }
}

for (const token of [
  'finalizeNewProject',
  'handleRequestMsx2GameProfile',
  'handleConfirmMsx2GameProfile',
  'buildStarterMsx2ScreenAsset',
  'buildStarterMsx2GameFlowAsset',
  'msx2ProjectProfile:',
]) {
  if (!projectHandlersSource.includes(token)) {
    errors.push(`useProjectHandlers.tsx missing ${token}`);
  }
}

for (const token of [
  'onRequestMsx2GameProfile',
  'Continue',
]) {
  if (!newProjectModalSource.includes(token)) {
    errors.push(`NewProjectModal.tsx missing ${token}`);
  }
}

for (const token of [
  'ProfilePreview',
  'PROFILE_PREVIEW_IMAGES',
  'platform-preview.png',
  'maze-preview.png',
  'shooter-vertical-preview.png',
  'shooter-horizontal-preview.png',
  'drawShooterVerticalPreview',
  'MSX2_GAME_PROFILE_OPTIONS',
]) {
  if (!pickerSource.includes(token)) {
    errors.push(`Msx2GameProfilePicker.tsx missing ${token}`);
  }
}

for (const token of [
  'isAssetTypeEnabledForMsx2Project',
]) {
  if (!projectTargetSource.includes(token)) {
    errors.push(`projectTarget.ts missing ${token}`);
  }
}

if (!roomEditorSource.includes('lockedRuntimeMode={lockedRuntimeMode}')) {
  errors.push('Msx2Screen4RoomEditor.tsx must lock runtime mode from msx2ProjectProfile');
}
if (!roomEditorSource.includes('filterMsx2EntityPresetsForProfile')) {
  errors.push('Msx2Screen4RoomEditor.tsx missing filterMsx2EntityPresetsForProfile');
}
if (!msx2EditorPartsSource.includes('filterMsx2EntityMovementOptionsForProfile')) {
  errors.push('Msx2Screen4EditorParts.tsx must filter entity movement options by MSX2 project profile');
}
if (!roomEditorSource.includes('msx2ProjectProfile={msx2ProjectProfile}')) {
  errors.push('Msx2Screen4RoomEditor.tsx must pass msx2ProjectProfile to entity panel');
}

if (!toolbarSource.includes('isAssetTypeEnabledForMsx2Project')) {
  errors.push('Toolbar.tsx must filter assets with isAssetTypeEnabledForMsx2Project');
}

if (!profilesSource.includes("'msx2presentation'")) {
  errors.push('MSX2 shared asset types must include msx2presentation');
}

// Validate preset ids referenced by profiles exist in entity catalog.
const catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const presetIds = [...catalog.matchAll(/\bid:\s*'([^']+)'/g)]
  .map(match => match[1])
  .filter(id => !id.startsWith('msx2_'));

for (const profileId of requiredProfileIds) {
  const blockMatch = profilesSource.match(new RegExp(`${profileId}:\\s*\\{[\\s\\S]*?allowedEntityPresetIds:\\s*\\[([\\s\\S]*?)\\]`));
  if (!blockMatch) {
    errors.push(`Could not parse allowedEntityPresetIds for ${profileId}`);
    continue;
  }
  const ids = [...blockMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  for (const presetId of ids) {
    if (!presetIds.includes(presetId)) {
      errors.push(`Profile ${profileId} references unknown entity preset ${presetId}`);
    }
  }
}

if (!existsSync(join(repoRoot, 'src', 'assets', 'msx2-project-profiles', 'platform-preview.png'))) {
  errors.push('Missing src/assets/msx2-project-profiles/platform-preview.png');
}
if (!existsSync(join(repoRoot, 'src', 'assets', 'msx2-project-profiles', 'maze-preview.png'))) {
  errors.push('Missing src/assets/msx2-project-profiles/maze-preview.png');
}
if (!existsSync(join(repoRoot, 'src', 'assets', 'msx2-project-profiles', 'shooter-vertical-preview.png'))) {
  errors.push('Missing src/assets/msx2-project-profiles/shooter-vertical-preview.png');
}
if (!existsSync(join(repoRoot, 'src', 'assets', 'msx2-project-profiles', 'shooter-horizontal-preview.png'))) {
  errors.push('Missing src/assets/msx2-project-profiles/shooter-horizontal-preview.png');
}

// The graphics mode is picked when the project is created and cannot change
// afterwards, so the MSX2 GameFlow editor disables the backend button that does
// not match. The mode is derived from the profile's own asset-type filter (the
// same list that stops tile screens and bitmap rooms from coexisting), never
// from a hard-coded list of profile ids.
if (!profilesSource.includes('export function resolveMsx2ProfileGraphicsMode')) {
  errors.push('msx2ProjectProfiles.ts must export resolveMsx2ProfileGraphicsMode');
} else if (!profilesSource.includes("allowed.includes('msx2bitmaproom')") || !profilesSource.includes("allowed.includes('msx2screen')")) {
  errors.push('resolveMsx2ProfileGraphicsMode must derive the mode from allowedAssetTypes, not from profile ids');
}

const gameFlowEditorSource = read('components', 'editors', 'Msx2GameFlowEditor.tsx');
if (!gameFlowEditorSource.includes("disabled={lockedGraphicsMode === 'screen5'}")
  || !gameFlowEditorSource.includes("disabled={lockedGraphicsMode === 'screen4'}")) {
  errors.push('MSX2 GameFlow editor must disable the backend button that does not match the project profile');
}
if (!appUiSource.includes('msx2ProjectProfile={msx2ProjectProfile}')) {
  errors.push('AppUI must pass msx2ProjectProfile to the MSX2 GameFlow editor');
}

if (errors.length > 0) {
  console.error('MSX2 project profile contract check FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('MSX2 project profile contract check passed.');
console.log(`  profiles: ${requiredProfileIds.join(', ')}`);
console.log(`  creatable: ${creatableProfileIds.join(', ')}`);
