#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const editorPath = join(repoRoot, 'components', 'editors', 'Msx2Screen4RoomEditor.tsx');
const partsPath = join(repoRoot, 'components', 'msx2_screen4_editor', 'Msx2Screen4EditorParts.tsx');
const catalogPath = join(repoRoot, 'components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const generatorPath = join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4Generator.ts');
const bitmapRoomGeneratorPath = join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen4BitmapRoomGenerator.ts');
const entityRuntimeGeneratorPath = join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2EntityRuntimeGenerator.ts');
const msxGeneratorIndexPath = join(repoRoot, 'utils', 'msxGenerator', 'index.ts');
const asmTemplateGeneratorPath = join(repoRoot, 'utils', 'asmTemplateGenerator.ts');
const appUiPath = join(repoRoot, 'components', 'AppUI.tsx');
const componentEditorPath = join(repoRoot, 'components', 'editors', 'ComponentDefinitionEditor.tsx');
const templateEditorPath = join(repoRoot, 'components', 'editors', 'EntityTemplateEditor.tsx');
const msx2SpriteEditorPath = join(repoRoot, 'components', 'editors', 'Msx2SpriteEditor.tsx');
const msx2HudFontEditorPath = join(repoRoot, 'components', 'editors', 'Msx2HudFontEditor.tsx');
const msx2BitmapRoomEditorPath = join(repoRoot, 'components', 'editors', 'Msx2Screen4BitmapRoomEditor.tsx');
const panelPath = join(repoRoot, 'components', 'common', 'Panel.tsx');
const defaultsPath = join(repoRoot, 'data', 'defaults.ts');
const projectTargetPath = join(repoRoot, 'utils', 'projectTarget.ts');
const asmTemplatePath = join(repoRoot, 'utils', 'asmTemplateGenerator.ts');
const typesPath = join(repoRoot, 'types.ts');
const exportWorldMapAsmModalPath = join(repoRoot, 'components', 'modals', 'ExportWorldMapASMModal.tsx');
const worldMapEditorPath = join(repoRoot, 'components', 'editors', 'WorldMapEditor.tsx');
const worldViewEditorPath = join(repoRoot, 'components', 'editors', 'WorldViewEditor.tsx');
const useAssetHandlersPath = join(repoRoot, 'handlers', 'useAssetHandlers.tsx');
const toolbarPath = join(repoRoot, 'components', 'layout', 'Toolbar.tsx');
const codeExportModalPath = join(repoRoot, 'components', 'modals', 'CodeExportModal.tsx');
const fileExplorerPath = join(repoRoot, 'components', 'tools', 'FileExplorerPanel.tsx');
const propertiesPanelPath = join(repoRoot, 'components', 'tools', 'PropertiesPanel.tsx');
const serverPath = join(repoRoot, 'server', 'server.js');
const buildScriptPath = join(repoRoot, 'scripts', 'build_mideas_unified_rom.py');
const summaryExtractorPath = join(repoRoot, 'utils', 'summaryExtractor.ts');
const globalVariablesUtilsPath = join(repoRoot, 'utils', 'globalVariablesUtils.ts');
const msx2BudgetFeedbackPath = join(repoRoot, 'utils', 'msx2BudgetFeedback.ts');
const loderunnerCreatorPath = join(repoRoot, 'scripts', 'create_msx2_loderunner_clone.mjs');
const msx2AtlasPreviewPath = join(repoRoot, 'components', 'screen_editor', 'MSX2AtlasPreviewPanel.tsx');
const msx2ExportContractPath = join(repoRoot, 'components', 'screen_editor', 'MSX2ExportContractPanel.tsx');
const msx2HudPlanPath = join(repoRoot, 'components', 'msx2_screen4_editor', 'MSX2HudPlanPanel.tsx');
const packageJsonPath = join(repoRoot, 'package.json');
const source = [
  readFileSync(editorPath, 'utf8'),
  readFileSync(partsPath, 'utf8'),
  readFileSync(catalogPath, 'utf8'),
  readFileSync(msx2HudPlanPath, 'utf8'),
  readFileSync(msx2AtlasPreviewPath, 'utf8'),
  readFileSync(msx2ExportContractPath, 'utf8'),
  readFileSync(generatorPath, 'utf8'),
  readFileSync(bitmapRoomGeneratorPath, 'utf8'),
  readFileSync(entityRuntimeGeneratorPath, 'utf8'),
  readFileSync(msxGeneratorIndexPath, 'utf8'),
  readFileSync(asmTemplateGeneratorPath, 'utf8'),
  readFileSync(appUiPath, 'utf8'),
  readFileSync(componentEditorPath, 'utf8'),
  readFileSync(templateEditorPath, 'utf8'),
  readFileSync(msx2SpriteEditorPath, 'utf8'),
  readFileSync(msx2HudFontEditorPath, 'utf8'),
  readFileSync(msx2BitmapRoomEditorPath, 'utf8'),
  readFileSync(panelPath, 'utf8'),
  readFileSync(defaultsPath, 'utf8'),
  readFileSync(projectTargetPath, 'utf8'),
  readFileSync(asmTemplatePath, 'utf8'),
  readFileSync(typesPath, 'utf8'),
  readFileSync(exportWorldMapAsmModalPath, 'utf8'),
  readFileSync(worldMapEditorPath, 'utf8'),
  readFileSync(worldViewEditorPath, 'utf8'),
  readFileSync(useAssetHandlersPath, 'utf8'),
  readFileSync(toolbarPath, 'utf8'),
  readFileSync(codeExportModalPath, 'utf8'),
  readFileSync(fileExplorerPath, 'utf8'),
  readFileSync(propertiesPanelPath, 'utf8'),
  readFileSync(serverPath, 'utf8'),
  readFileSync(summaryExtractorPath, 'utf8'),
  readFileSync(globalVariablesUtilsPath, 'utf8'),
  readFileSync(msx2BudgetFeedbackPath, 'utf8'),
].join('\n');

const generatorSource = readFileSync(generatorPath, 'utf8');
const bitmapRoomGeneratorSource = readFileSync(bitmapRoomGeneratorPath, 'utf8');
const entityRuntimeSource = readFileSync(entityRuntimeGeneratorPath, 'utf8');
const msxGeneratorIndexSource = readFileSync(msxGeneratorIndexPath, 'utf8');
const asmTemplateGeneratorSource = readFileSync(asmTemplateGeneratorPath, 'utf8');
const appUiSource = readFileSync(appUiPath, 'utf8');
const catalogSource = readFileSync(catalogPath, 'utf8');
const partsSource = readFileSync(partsPath, 'utf8');
const panelSource = readFileSync(panelPath, 'utf8');
const exportWorldMapAsmSource = readFileSync(exportWorldMapAsmModalPath, 'utf8');
const worldMapEditorSource = readFileSync(worldMapEditorPath, 'utf8');
const worldViewEditorSource = readFileSync(worldViewEditorPath, 'utf8');
const useAssetHandlersSource = readFileSync(useAssetHandlersPath, 'utf8');
const msx2SpriteEditorSource = readFileSync(msx2SpriteEditorPath, 'utf8');
const msx2HudFontEditorSource = readFileSync(msx2HudFontEditorPath, 'utf8');
const msx2BitmapRoomEditorSource = readFileSync(msx2BitmapRoomEditorPath, 'utf8');
const toolbarSource = readFileSync(toolbarPath, 'utf8');
const codeExportModalSource = readFileSync(codeExportModalPath, 'utf8');
const fileExplorerSource = readFileSync(fileExplorerPath, 'utf8');
const propertiesPanelSource = readFileSync(propertiesPanelPath, 'utf8');
const serverSource = readFileSync(serverPath, 'utf8');
const buildScriptSource = readFileSync(buildScriptPath, 'utf8');
const summaryExtractorSource = readFileSync(summaryExtractorPath, 'utf8');
const globalVariablesUtilsSource = readFileSync(globalVariablesUtilsPath, 'utf8');
const msx2BudgetFeedbackSource = readFileSync(msx2BudgetFeedbackPath, 'utf8');
const loderunnerCreatorSource = readFileSync(loderunnerCreatorPath, 'utf8');
const packageScripts = JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts || {};
const hardwareSpriteInit = generatorSource.match(/function buildHardwareSpriteInitAsm[\s\S]*?return `init_hardware_sprites:[\s\S]*?copy_to_vram_ext[\s\S]*?copy_to_vram_ext[\s\S]*?copy_to_vram_ext[\s\S]*?ld a, \$\{x\}/)?.[0] || '';
const hardwareSpritePatternBuilder = generatorSource.match(/function buildHardwareSpritePatternForLayer[\s\S]*?return bytes;\n}/)?.[0] || '';
const extendedVramWriters = generatorSource.match(/copy_to_vram_ext:[\s\S]*?write_vram_byte_ext:[\s\S]*?ret/)?.[0] || '';
const effectStateRoutine = generatorSource.match(/update_msx2_effect_state:[\s\S]*?msx2_compare_collectibles_required:/)?.[0] || '';
const verticalRoutine = generatorSource.match(/update_hardware_sprite_vertical:[\s\S]*?apply_hardware_sprite_gravity:/)?.[0] || '';

const checks = [
  ['single Entity Properties panel', (source.match(/Panel title="Entity Properties"/g) || []).length === 1],
  ['Behavior mode button exists', (source.includes("setMode('behavior')") || source.includes("layerButton('behavior'")) && source.includes("'Behavior'")],
  ['Entities mode button exists', (source.includes("setMode('entities')") || source.includes("layerButton('entities'")) && source.includes("'Entities'")],
  ['entity creation palette replaces tile palette in entities mode', source.includes('Panel title="Create MSX2 Entity"') && source.includes("mode !== 'entities'") && source.includes('MSX2_ENTITY_REPERTOIRE')],
  ['entity creation presets include core MSX2 actors', source.includes("id: 'player'") && source.includes("id: 'ghost_maze'") && source.includes("id: 'patrol_x'") && source.includes("id: 'door'")],
  ['entity creation presets include Pong and Arkanoid actors', source.includes("id: 'pong_paddle'") && source.includes("id: 'pong_ball'") && source.includes("id: 'arkanoid_brick'")],
  ['entity creation presets include Pong 2P control component', catalogSource.includes("'control_2_players'") && catalogSource.includes("id: 'pong_2p_left_paddle'") && catalogSource.includes("player1Input: 'cursors'") && catalogSource.includes("player2Input: 'joystick1'")],
  ['entity creation presets include Snake char actors', source.includes("id: 'snake_head'") && source.includes("id: 'snake_segment'") && source.includes("id: 'snake_food'") && source.includes('msx2_char_render')],
  ['MSX2 entity repertoire carries runtime and engine metadata', source.includes('MSX2_ENTITY_REPERTOIRE') && source.includes("runtime: 'MSX2'") && source.includes("engine: 'ghostMaze'") && source.includes("engine: 'patrolX'")],
  ['MSX2 player presets declare explicit SCREEN 4 movement engines', source.includes("engine: 'maze'") && source.includes("movementMode: 'maze'") && source.includes("engine: 'shooterHorizontal'") && source.includes("movementMode: 'shooterHorizontal'") && source.includes("movementMode: 'paddleHorizontal'") && source.includes("movementMode: 'snakeChar'")],
  ['MSX2 editor propagates player preset engine to screen runtime', source.includes("selectedEntityPreset.kind === 'player'") && source.includes('movementModel: movementMode') && source.includes("screenEngine: movementMode === 'maze'")],
  ['MSX2 runtime supports disabled air timer for arcade screens', source.includes('disableAirTimer') && source.includes('airTimer: false') && generatorSource.includes('runtime?.initialAir === 0') && generatorSource.includes('ret z\n    ld a, (msx2_air_frame_counter)')],
  ['new MSX2 editor assets are SCREEN 4 native', useAssetHandlersSource.includes("vdpMode: 'SCREEN4'") && useAssetHandlersSource.includes("mode: 'SCREEN4'") && useAssetHandlersSource.includes("movementMode: 'platform'")],
  ['WorldMap creates SCREEN 4 native rooms', worldMapEditorSource.includes("vdpMode: 'SCREEN4'") && worldMapEditorSource.includes('isMsx2Screen4Mode') && worldMapEditorSource.includes('isMsx2Screen4TileScreen(screen)')],
  ['WorldView accepts SCREEN 4 native rooms', worldViewEditorSource.includes('isMsx2Screen4Mode') && worldViewEditorSource.includes("vdpMode === 'SCREEN4'")],
  ['MSX2 sprite creator uses MSX2 Sprites label', toolbarSource.includes('>MSX2 Sprites</DropdownItem>') && fileExplorerSource.includes('msx2sprite: "MSX2 Sprites"')],
  ['MSX2 SCREEN 4 Bitmap Room is exposed as a separate asset', toolbarSource.includes("onNewAsset('msx2bitmaproom')") && toolbarSource.includes('>MSX2 SCREEN 4 Bitmap Room</DropdownItem>') && fileExplorerSource.includes('msx2bitmaproom: "MSX2 SCREEN 4 Bitmap Rooms"') && fileExplorerSource.includes('msx2bitmaproom: EditorType.Msx2BitmapRoom') && appUiSource.includes('Msx2Screen4BitmapRoomEditor')],
  ['MSX2 SCREEN 4 Bitmap Room editor is atlas command based', msx2BitmapRoomEditorSource.includes("op: 'copy'") && msx2BitmapRoomEditorSource.includes("op: 'fill'") && msx2BitmapRoomEditorSource.includes("op: 'lineH'") && msx2BitmapRoomEditorSource.includes('Import Atlas PNG') && msx2BitmapRoomEditorSource.includes('renderComposition')],
  ['MSX2 SCREEN 4 Bitmap Room editor exposes color-limit diagnostics', msx2BitmapRoomEditorSource.includes('analyzeScreen4ColorLimits') && msx2BitmapRoomEditorSource.includes('SCREEN 4 export contract') && msx2BitmapRoomEditorSource.includes('Color rows will be reduced') && msx2BitmapRoomEditorSource.includes('No 8-pixel row exceeds 2 colors')],
  ['MSX2 SCREEN 4 Bitmap Room properties and palette integration are exposed', propertiesPanelSource.includes("case 'msx2bitmaproom'") && propertiesPanelSource.includes('SCREEN 4 bitmap room') && appUiSource.includes("'msx2bitmaproom'") && appUiSource.includes('isMsx2BitmapRoomEditor') && appUiSource.includes('pantalla bitmap SCREEN 4')],
  ['MSX2 SCREEN 4 Bitmap Room reaches project analysis and backend routing', asmTemplateGeneratorSource.includes('msx2BitmapRooms') && asmTemplateGeneratorSource.includes("a.type === 'msx2bitmaproom'") && msxGeneratorIndexSource.includes("'msx2-screen4-bitmap-room'") && msxGeneratorIndexSource.includes('generateMsx2Screen4BitmapRoomFiles')],
  ['MSX2 SCREEN 4 Bitmap Room generator emits SCREEN 4 PGT/PNT/CGT tables', bitmapRoomGeneratorSource.includes('buildPatternColorTables') && bitmapRoomGeneratorSource.includes('screen4_pattern_data') && bitmapRoomGeneratorSource.includes('screen4_name_data') && bitmapRoomGeneratorSource.includes('screen4_color_data') && bitmapRoomGeneratorSource.includes('max 2 colors per 8 pixels horizontally') && bitmapRoomGeneratorSource.includes('ld de, #1800') && bitmapRoomGeneratorSource.includes('ld de, #2000')],
  ['MSX2 SCREEN 4 Bitmap Room smoke is exposed in npm scripts', packageScripts['smoke:msx2-screen4-bitmap-room'] === 'python scripts/build_msx2_screen4_bitmap_room_smoke.py' && packageScripts['smoke:msx2-static']?.includes('npm run smoke:msx2-screen4-bitmap-room -- --skip-openmsx')],
  ['MSX2 HUD Font asset is exposed separately from MSX1 font', toolbarSource.includes("onNewAsset('msx2hudfont')") && toolbarSource.includes('>MSX2 HUD Font</DropdownItem>') && fileExplorerSource.includes('msx2hudfont: "MSX2 HUD Fonts"') && fileExplorerSource.includes('msx2hudfont: EditorType.Msx2HudFont')],
  ['MSX2 HUD Font editor persists edits through asset update', appUiSource.includes('<Msx2HudFontEditor') && appUiSource.includes('onUpdate={(data) => handleUpdateAsset(activeAsset.id, data)}') && appUiSource.includes('dataOutputFormat={dataOutputFormat}')],
  ['MSX2 HUD Font editor imports rasterized TTF fonts', msx2HudFontEditorSource.includes('new FontFace') && msx2HudFontEditorSource.includes('Import TTF') && msx2HudFontEditorSource.includes('rasterizeGlyph')],
  ['MSX2 HUD Font editor imports ZX 8x8 binary fonts from ASCII space', msx2HudFontEditorSource.includes('Import ZX .ch8') && msx2HudFontEditorSource.includes('ZX_ASCII_FIRST = 0x20') && msx2HudFontEditorSource.includes('bytes.length % 8') && msx2HudFontEditorSource.includes('baseChar: ZX_ASCII_FIRST')],
  ['SCREEN 4 HUD font runtime supports ZX ASCII offset mapping', generatorSource.includes('isMsx2HudFontContiguousAscii') && generatorSource.includes('sub #20') && generatorSource.includes('add a, MSX2_HUD_FONT_BASE_CHAR') && generatorSource.includes('getMsx2HudFontBaseChar(analysis)')],
  ['SCREEN 4 palette assets are accepted by generator', generatorSource.includes("paletteAsset?.mode === 'SCREEN4'") && generatorSource.includes("paletteAsset?.mode === 'SCREEN5'")],
  ['MSX2 entity kind options exclude generic custom entities', source.includes('MSX2_ENTITY_KIND_OPTIONS') && !source.includes('<option value="custom">Custom</option>')],
  ['MSX2 entity components expose Position and Render labels', source.includes("label: 'Position'") && source.includes("label: 'Render'") && source.includes("name === 'msx2SpriteAssetId'")],
  ['MSX2 Render sprite uses an msx2sprite picker', source.includes("'msx2sprite_ref': 'msx2sprite'") && source.includes('assetTypeToPick="msx2sprite"') && source.includes('aria-label="Choose MSX2 render sprite"')],
  ['movement options include patrol X/Y, paddle/ball, and snake char modes', source.includes('MSX2_ENTITY_MOVEMENT_OPTIONS') && source.includes("value: 'patrolX'") && source.includes("value: 'patrolY'") && source.includes("value: 'paddleHorizontal'") && source.includes("value: 'ballBounce'") && source.includes("value: 'snakeChar'")],
  ['SCREEN 4 generator recognizes control_2_players Pong controls', generatorSource.includes('function usesControl2Players') && generatorSource.includes('update_hardware_sprite_input_control_2_players') && generatorSource.includes('control_2_players_update_p1_cursor') && generatorSource.includes('control_2_players_update_p2_joystick') && generatorSource.includes('ld a, 1\n    call GTSTCK')],
  ['SCREEN 4 generator recognizes paddleHorizontal without enabling shooter bullets', generatorSource.includes('function usesPaddleHorizontalMovement') && generatorSource.includes("mode === 'paddlehorizontal'") && generatorSource.includes('update_hardware_sprite_input_paddle_horizontal') && generatorSource.includes("${paddleHorizontal ? '    jp update_hardware_sprite_input_paddle_horizontal\\n' : ''}") && generatorSource.includes("${shooterHorizontal ? '    call update_msx2_player_bullet\\n    call update_msx2_enemy_bullet\\n' : ''}")],
  ['SCREEN 4 shooter movement uses configured horizontal speed', generatorSource.includes('const horizontalMoveSpeed = (paddleHorizontal || shooterHorizontal) ? getPaddleHorizontalSpeed(analysis) : 1') && generatorSource.includes('${paddleHorizontal || shooterHorizontal ? `    add a, ${horizontalMoveSpeed}') && generatorSource.includes('${paddleHorizontal || shooterHorizontal ? `    sub ${horizontalMoveSpeed}')],
  ['SCREEN 4 shooter projectiles use configured cooldown, velocity, and SPACE trigger fallback', generatorSource.includes('function getPlayerBulletCooldownFrames') && generatorSource.includes('function getPlayerBulletSpeedY') && generatorSource.includes('sub ${playerBulletSpeedY}') && generatorSource.includes('ld a, ${playerBulletCooldownFrames}') && generatorSource.includes('ld a, 8\n    call SNSMAT') && generatorSource.includes('call GTTRIG') && generatorSource.includes('GTTRIG  EQU #00D8')],
  ['SCREEN 4 shooter projectile lookup is player-owned', generatorSource.includes('function getPlayerProjectileEntity') && generatorSource.includes('entityToken.includes(presetToken)') && generatorSource.includes("entity?.components?.msx2_projectile?.owner === 'player'") && !generatorSource.includes('entity?.params?.projectile === true\n      || entity?.params?.owner === \'player\'' )],
  ['SCREEN 4 shooter projectiles clear destructible effect shields', generatorSource.includes('msx2_player_bullet_check_effect_collision') && generatorSource.includes('msx2_enemy_bullet_check_effect_collision') && generatorSource.includes('call clear_msx2_effect_visual_at_pixel') && generatorSource.includes('ld (msx2_player_bullet_active), a') && generatorSource.includes('ld (msx2_enemy_bullet_active), a')],
  ['SCREEN 4 wave continue advances through referenced sectors', generatorSource.includes('function buildLoadCurrentTileScreenDispatcher') && generatorSource.includes('load_current_msx2_screen4') && generatorSource.includes('msx2_advance_to_next_wave_screen') && generatorSource.includes('tileScreens.length')],
  ['SCREEN 4 wave transition draws centered STAGE banner', generatorSource.includes('draw_msx2_stage_banner') && generatorSource.includes('wait_msx2_stage_banner') && generatorSource.includes('msx2_stage_font_patterns') && generatorSource.includes('call FILVRM') && generatorSource.includes('ld hl, #1970') && generatorSource.includes('showShooterStageBanner')],
  ['SCREEN 4 frame pacing uses VBlank HALT wait', generatorSource.includes('wait_frame_busy:') && generatorSource.includes('halt') && !generatorSource.includes('ld bc, #0400\n.wait_loop:')],
  ['SCREEN 4 shooter does not spawn phantom bullets on init or reset', !generatorSource.includes('ld a, 1\n    ld (msx2_player_bullet_active), a\n    call draw_msx2_lives_hud') && !generatorSource.includes('call msx2_respawn_current_screen\n    ld a, 1\n    ld (msx2_player_bullet_active), a')],
  ['SCREEN 4 game over restart accepts SPACE trigger fallback', generatorSource.includes('msx2_game_over_idle:') && generatorSource.includes('.restart_space_check:') && (generatorSource.match(/call GTTRIG/g) || []).length >= 3],
  ['SCREEN 4 final-state border is cleared on restart and continue', generatorSource.includes('reset_msx2_status_border') && (generatorSource.match(/call reset_msx2_status_border/g) || []).length >= 2 && generatorSource.includes('ld bc, #0007\n    call WRTVDP')],
  ['MSX2 component repertoire exposes Galaxian Attack Wave settings', catalogSource.includes("'msx2_attack_wave'") && catalogSource.includes('intervalFrames: 180') && catalogSource.includes('minAttackers: 1') && catalogSource.includes('maxAttackers: 3')],
  ['MSX2 entity panel exposes Galaxian attack component controls', partsSource.includes('aria-label="Galaxian attack pattern"') && partsSource.includes('aria-label="Galaxian attack wave interval frames"') && partsSource.includes('aria-label="Galaxian attack wave maximum attackers"') && partsSource.includes('patchSelectedComponent')],
  ['SCREEN 4 Galaxian scheduler reads Attack Wave component settings', generatorSource.includes('getGalaxianAttackWaveSettingsForScreen') && generatorSource.includes('component.intervalFrames') && generatorSource.includes('component.minAttackers') && generatorSource.includes('component.maxAttackers') && generatorSource.includes('update_msx2_galaxian_attack_scheduler')],
  ['SCREEN 4 Galaxian Attack Wave is emitted per screen', generatorSource.includes('attackWaveSettingsByScreen') && generatorSource.includes('msx2_screen_attack_interval') && generatorSource.includes('msx2_screen_attack_min') && generatorSource.includes('msx2_screen_attack_max') && generatorSource.includes('msx2_screen_attack_seed')],
  ['SCREEN 4 Galaxian movement reads Attack Pattern components', generatorSource.includes('getGalaxianAttackPatterns') && generatorSource.includes('components?.msx2_attack_pattern?.pattern') && generatorSource.includes("attackPattern === 'circle'") && generatorSource.includes("attackPattern === 'zigzag'") && !generatorSource.includes('const shooterDiveMovement = slot % 3')],
  ['SCREEN 4 Galaxian scheduler launches random 1..3 enemy attackers every 180 frames', generatorSource.includes('update_msx2_galaxian_attack_scheduler') && generatorSource.includes('msx2_activate_galaxian_attack_slot') && generatorSource.includes('msx2_attack_timer EQU #C03C')],
  ['SCREEN 4 Galaxian attackers include circle, diagonal, and zigzag motion labels', generatorSource.includes('_circle_store_y') && generatorSource.includes('_zigzag_left') && generatorSource.includes('_diagonal_left')],
  ['SCREEN 4 Galaxian PSG SFX fires on shot and impact states', generatorSource.includes('msx2_play_psg_sfx') && generatorSource.includes('msx2_sfx_fire') && generatorSource.includes('msx2_sfx_hit') && generatorSource.includes('call msx2_sfx_fire') && generatorSource.includes('call msx2_sfx_hit')],
  ['SCREEN 4 generator moves ballBounce hazards for Pong/Arkanoid', entityRuntimeSource.includes('MSX2_ENEMY_MOVEMENT_BALL_BOUNCE') && entityRuntimeSource.includes("movement === 'ballbounce'") && generatorSource.includes('MSX2_ENEMY_MOVEMENT_BALL_BOUNCE') && generatorSource.includes('signedRuntimeByte(enemies[index]?.dy)') && generatorSource.includes('function getPaddleCollisionSettings') && generatorSource.includes('ball_check_paddle') && generatorSource.includes('call msx2_apply_damage_respawn')],
  ['SCREEN 4 generator maps Arkanoid bricks to mutable effects', generatorSource.includes('entity?.components?.msx2_brick') && generatorSource.includes('clear_msx2_effect_visual_at_pixel') && generatorSource.includes('ball_break_brick')],
  ['entity tile coordinate labels exist', source.includes('>Tile X</span>') && source.includes('>Tile Y</span>')],
  ['automation labels exist for core controls', [
    'aria-label="MSX2 screen name"',
    'aria-label="MSX2 effect code"',
    'aria-label="MSX2 behavior code"',
    'aria-label="MSX2 required collectibles"',
    'aria-label="MSX2 initial air"',
    'aria-label="Entity name"',
    'aria-label="Entity kind"',
    'aria-label="Entity movement"',
  ].every((needle) => source.includes(needle))],
  ['MSX2 behavior painter exposes rope code', partsSource.includes('<option value={4}>4 Rope</option>')],
  ['patrol X labels exist', source.includes('>Min X</span>') && source.includes('>Max X</span>')],
  ['patrol Y labels exist', source.includes('>Min Y</span>') && source.includes('>Max Y</span>')],
  ['patrol X edits only X bounds', source.includes("selectedEntity.params.movement === 'patrolX'") && source.includes('aria-label="Patrol min X"') && source.includes('aria-label="Patrol max X"')],
  ['patrol Y edits only Y bounds', source.includes('aria-label="Patrol min Y"') && source.includes('aria-label="Patrol max Y"')],
  ['active area clamps width and height to origin', source.includes('MAP_WIDTH - activeAreaX') && source.includes('MAP_HEIGHT - activeAreaY') && source.includes('MAP_WIDTH - x') && source.includes('MAP_HEIGHT - y')],
  ['copy paste uses active or selected area crop', source.includes('activeEditRect.y + y') && source.includes('activeEditRect.x + x') && source.includes('pasteWidth') && source.includes('pasteHeight')],
  ['selection tools panel exists', source.includes('Panel title="MSX2 Selection Tools"') && source.includes('MSX2 Select Area') && source.includes('MSX2 Fill') && source.includes('MSX2 Clear')],
  ['MSX2 screen editor columns scroll independently', source.includes('flex h-full min-h-0 min-w-0 gap-2 overflow-hidden') && source.includes('w-[220px] flex-shrink-0 min-h-0 overflow-y-auto') && source.includes('min-w-0 flex-1 min-h-0 overflow-auto') && source.includes('w-[300px] flex-shrink-0 min-h-0 overflow-y-auto')],
  ['MSX2 screen editor exposes collapse all controls', source.includes('Collapse All') && source.includes('Expand All') && source.includes('aria-label="Collapse all MSX2 editor sections"') && source.includes('mideas:panel-collapse-all')],
  ['MSX2 screen editor panels are collapsible', (partsSource.match(/<Panel title=.*collapsible/g) || []).length >= 7 && panelSource.includes('window.addEventListener') && panelSource.includes('mideas:panel-collapse-all')],
  ['Project Assets panel can collapse left for editor space', fileExplorerSource.includes('onRequestCollapse') && fileExplorerSource.includes('Hide Project Assets') && appUiSource.includes('isAssetExplorerCollapsed') && appUiSource.includes('Show Project Assets')],
  ['Asset Properties panel can collapse right for editor space', propertiesPanelSource.includes('onRequestCollapse') && propertiesPanelSource.includes('Hide Asset Properties') && appUiSource.includes('isPropertiesPanelCollapsed') && appUiSource.includes('Show Asset Properties')],
  ['selection rect is rendered in grid', source.includes('selectionRect.x * TILE_SIZE * 2') && source.includes('selectionRect.width * TILE_SIZE * 2')],
  ['variable tile dimensions controls exist', source.includes('MSX2_TILE_DIMENSION_OPTIONS') && source.includes('aria-label="MSX2 tile width"') && source.includes('aria-label="MSX2 tile height"')],
  ['variable tile dimensions are normalized to multiples of 8', source.includes('Math.round(numeric / 8) * 8') && source.includes('Math.max(8, Math.min(32')],
  ['tile list shows visual previews', source.includes('Msx2TilePreview') && source.includes('MSX2 tile ${tile.name} preview')],
  ['tile editor exposes MSX2 palette swatches', source.includes('aria-label="MSX2 tile palette"') && source.includes('aria-label={`MSX2 paint slot ${slot.slotIndex}`}')],
  ['tile editor exposes fill and transform tools', [
    'aria-label="MSX2 fill tile"',
    'aria-label="MSX2 flip tile horizontal"',
    'aria-label="MSX2 flip tile vertical"',
    'aria-label="MSX2 shift tile left"',
    'aria-label="MSX2 shift tile up"',
    'aria-label="MSX2 shift tile right"',
    'aria-label="MSX2 shift tile down"',
  ].every((needle) => source.includes(needle))],
  ['tile editor exposes paint modes', [
    'aria-label="MSX2 tile paint tools"',
    'aria-label={`MSX2 tile tool ${tool}`}',
    "Msx2Screen4TilePaintTool = 'pencil' | 'erase' | 'fill' | 'pick'",
    "paintTool === 'fill'",
    "paintTool === 'pick'",
  ].every((needle) => source.includes(needle))],
  ['hardware sprite init uses SCREEN 4 extended VRAM copies', hardwareSpriteInit.includes('SCREEN4_SPRPAT_VRAM') && hardwareSpriteInit.includes('SCREEN4_SPRCOL_VRAM') && hardwareSpriteInit.includes('SCREEN4_SPRATR_VRAM') && !hardwareSpriteInit.includes('call LDIRVM')],
  ['hardware 16x16 sprite pattern order is V9938 quadrant order', hardwareSpritePatternBuilder.includes('top-left, bottom-left, top-right, bottom-right') && hardwareSpritePatternBuilder.includes('layerIndex, 0, y));\n  for (let y = 8; y < 16; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 0, y));\n  for (let y = 0; y < 8; y++) bytes.push(spritePatternByteForLayer(rowCompositions, layerIndex, 8, y));')],
  ['SCREEN 4 generator has no legacy bitmap load path', !generatorSource.includes('load_${label}_bitmap') && !generatorSource.includes('load_${firstScreenLabel}_bitmap') && !generatorSource.includes('buildScreen5BitmapBytes')],
  ['SCREEN 4 exports native HUD metadata without hardcoded bitmap overlay', !generatorSource.includes('false && usesInlineStatusHud(analysis)') && !generatorSource.includes('msx2_score_digit_patterns') && generatorSource.includes('msx2_screen_hud_style') && generatorSource.includes('Runtime drawing is intentionally data-driven work, not hardcoded bars')],
  ['SCREEN 4 editor exposes atlas and export contract previews', source.includes('MSX2AtlasPreviewPanel') && source.includes('MSX2ExportContractPanel') && source.includes('MSX2 Atlas Preview') && source.includes('MSX2 Export Contract')],
  ['SCREEN 4 HUD editor exposes per-widget export hints and templates', source.includes('Export hint') && source.includes('V9938 fill/line rectangle') && source.includes('8x8 glyph atlas copies') && source.includes('16x16 icon atlas copy') && source.includes('aria-label="MSX2 HUD widget variable name"') && source.includes('aria-label="MSX2 HUD widget icon tile"') && source.includes('clampNibble')],
  ['SCREEN 4 export contract maps HUD widgets to primitives', source.includes('v9938_fill_line_rect') && source.includes('glyph_atlas_copy_8x8') && source.includes('icon_atlas_copy_16x16') && source.includes('recordOffsetBytes') && source.includes('auxiliaryTables') && source.includes('runtimeRenderer')],
  ['SCREEN 4 generator exports HUD widget record offsets', generatorSource.includes('msx2_screen_hud_widget_record_size EQU 12') && generatorSource.includes('msx2_screen_hud_widget_offset') && generatorSource.includes('formatWords')],
  ['SCREEN 4 generator exports HUD widget auxiliary metadata', generatorSource.includes('msx2_screen_hud_widget_icon_tile') && generatorSource.includes('msx2_screen_hud_widget_text_offset') && generatorSource.includes('msx2_screen_hud_widget_text_pool') && generatorSource.includes('msx2_screen_hud_widget_variable_name_offset') && generatorSource.includes('msx2_screen_hud_widget_variable_name_pool') && generatorSource.includes('appendHudStringPoolEntry')],
  ['SCREEN 4 generator emits MSX2-owned HUD font runtime', generatorSource.includes('MSX2_HUD_FONT_BASE_CHAR') && generatorSource.includes('load_msx2_hud_font') && generatorSource.includes('draw_msx2_hud_string') && generatorSource.includes('msx2_hud_font_patterns') && generatorSource.includes('jp FILVRM') && generatorSource.includes('MSX2 SCREEN 4 HUD font patterns and loader are emitted inline')],
  ['SCREEN 4 generator fills HUD font colors instead of storing repeated color table', !generatorSource.includes("formatBytes('msx2_hud_font_colors'") && generatorSource.includes('ld a, #F1') && generatorSource.includes('msx2_hud_font_patterns_end - msx2_hud_font_patterns')],
  ['SCREEN 4 generator omits unused empty runtime layer fallbacks', generatorSource.includes('const emptyRuntimeLayerBlocks = tileScreens.length === 0') && generatorSource.includes('${emptyRuntimeLayerBlocks}')],
  ['SCREEN 4 editor exposes composition overlay modes', source.includes('Msx2Screen4CompositionOverlay') && source.includes('aria-label="MSX2 composition overlay"') && source.includes("compositionOverlay === 'copy8x8'") && source.includes("compositionOverlay === 'hudBands'") && source.includes("compositionOverlay === 'reuse2x2'") && source.includes("compositionOverlay === 'reuse4x4'") && source.includes("compositionOverlay === 'props16x16'")],
  ['extended VRAM writers reset VDP control latch', (extendedVramWriters.match(/in a, \(VDP_CTRL_PORT\)/g) || []).length >= 6],
  ['effect runtime does not flash debug border colors', effectStateRoutine.length > 0 && !effectStateRoutine.includes('call WRTVDP') && !effectStateRoutine.includes('.write_border')],
  ['collectible eraser uses authored tile background color', generatorSource.includes('function getCollectibleErasePaletteIndex') && generatorSource.includes('collectibleErasePackedByte') && !generatorSource.includes("formatBytes('screen5_blank_tile', Array(16 * 8).fill(0)")],
  ['maze player keeps moving in last direction', generatorSource.includes('maze_continue_current_direction') && generatorSource.includes('cp 2\n    jp z, maze_continue_up') && generatorSource.includes('ld a, 3\n    ld (msx2_player_sprite_dx), a')],
  ['maze direction changes are grid-gated to 16 pixels', generatorSource.includes('maze_can_change_direction_16') && generatorSource.includes('and #0F\n    ret nz') && generatorSource.includes('jp z, maze_move_right') && generatorSource.includes('jp z, maze_move_left')],
  ['maze input latches requested direction', generatorSource.includes('maze_try_latched_direction') && generatorSource.includes('ld (msx2_player_sprite_frame), a') && generatorSource.includes('ld a, (msx2_player_sprite_frame)')],
  ['hardware sprite animation uses MSX2-owned frame runtime', generatorSource.includes('buildHardwareSpriteLayersForFrame') && generatorSource.includes('msx2_player_anim_counter EQU #C01D') && generatorSource.includes('msx2_player_anim_frame EQU #C01E') && generatorSource.includes('update_msx2_player_sprite_animation') && generatorSource.includes('msx2_hw_sprite_frame_${frameIndex}_pattern_${layerIndex}')],
  ['MSX2 sprite editor exposes authored facing and mirror preview', msx2SpriteEditorSource.includes('Panel title="MSX2 Sprite Settings"') && msx2SpriteEditorSource.includes('value={facingDirection}') && msx2SpriteEditorSource.includes('mirrorPixelDataHorizontally(previewFrame)') && msx2SpriteEditorSource.includes('<option value="right">Right</option>') && msx2SpriteEditorSource.includes('<option value="left">Left</option>')],
  ['MSX2 sprite editor exposes hardware color plane diagnostics', msx2SpriteEditorSource.includes('stackedColorLineCount') && msx2SpriteEditorSource.includes('threeColorLineCount') && msx2SpriteEditorSource.includes('maxCellLayerCount') && msx2SpriteEditorSource.includes('3+ color rows') && msx2SpriteEditorSource.includes('Max cell layers')],
  ['MSX2 sprite editor exposes sprite export contract preview', msx2SpriteEditorSource.includes('spriteExportContract') && msx2SpriteEditorSource.includes('Panel title="MSX2 Sprite Export Contract"') && msx2SpriteEditorSource.includes('MSX2_SCREEN4_HARDWARE_SPRITE') && msx2SpriteEditorSource.includes('transparent_masks_plus_v9938_cc_or_color') && msx2SpriteEditorSource.includes('orColorRule')],
  ['MSX2 Sprites editor exposes OR color authoring helper', msx2SpriteEditorSource.includes('Panel title="MSX2 OR Color Helper"') && msx2SpriteEditorSource.includes('orPalettePairs') && msx2SpriteEditorSource.includes('useOrBrushColor') && msx2SpriteEditorSource.includes('A|B') && msx2SpriteEditorSource.includes('orCompatiblePairs')],
  ['MSX2 Sprites editor can separate real hardware layers', msx2SpriteEditorSource.includes('Separate HW Layers') && msx2SpriteEditorSource.includes('buildSeparatedHardwareLayerPreviews') && msx2SpriteEditorSource.includes('LayerPreviewGrid') && msx2SpriteEditorSource.includes('separatedLayerPreviewCount') && msx2SpriteEditorSource.includes('forcedByRows')],
  ['MSX2 Sprites separated layers are shown per 16x16 metasprite part', msx2SpriteEditorSource.includes('partLabelByOffset') && msx2SpriteEditorSource.includes('Part {partLabelByOffset.get') && msx2SpriteEditorSource.includes('width={16}') && msx2SpriteEditorSource.includes('height={16}') && msx2SpriteEditorSource.includes('offset x+{layer.xOffset}')],
  ['MSX2 Sprites editor exposes MetaSprite layout presets', msx2SpriteEditorSource.includes('Panel title="MSX2 MetaSprite Layout"') && msx2SpriteEditorSource.includes('MSX2_METASPRITE_PRESETS') && msx2SpriteEditorSource.includes('stackVertical') && msx2SpriteEditorSource.includes('stackHorizontal') && msx2SpriteEditorSource.includes('block2x2') && msx2SpriteEditorSource.includes('superSpriteParts') && msx2SpriteEditorSource.includes('applyMetaSpriteLayout')],
  ['MSX2 MetaSprite metadata reaches asset policy and properties panel', generatorSource.includes('superSpriteLayout') && generatorSource.includes('superSpriteParts') && generatorSource.includes('metaspriteCells') && generatorSource.includes('worstScanlineHardwareSprites') && propertiesPanelSource.includes('MetaSprite:') && propertiesPanelSource.includes('metaParts')],
  ['MSX2 sprite editor exposes collapse all controls', msx2SpriteEditorSource.includes('Collapse All') && msx2SpriteEditorSource.includes('Expand All') && msx2SpriteEditorSource.includes('aria-label="Collapse all MSX2 sprite editor sections"') && msx2SpriteEditorSource.includes('mideas:panel-collapse-all')],
  ['MSX2 sprite editor panels are collapsible', (msx2SpriteEditorSource.match(/<Panel title=.*collapsible/g) || []).length >= 10 && msx2SpriteEditorSource.includes('Panel title="Tools" collapsible') && msx2SpriteEditorSource.includes('Panel title="Active Brush" collapsible') && msx2SpriteEditorSource.includes('Panel title="MSX2 Transform Frame" collapsible')],
  ['new MSX2 sprites default to side-facing right', useAssetHandlersSource.includes("facingDirection: 'right'")],
  ['SCREEN 4 generator emits automatic mirrored MSX2 player patterns', generatorSource.includes('function mirrorHardwareSpritePatternHorizontally') && generatorSource.includes('function getHorizontalFacingDirection') && generatorSource.includes('msx2_hw_sprite_frame_${frameIndex}_mirror_pattern_${layerIndex}') && generatorSource.includes('mirrorPatternOffset') && generatorSource.includes('msx2_player_sprite_dx')],
  ['SCREEN 4 generator emits automatic mirrored MSX2 enemy patterns', generatorSource.includes('msx2_hw_enemy_sprite_mirror_pattern') && generatorSource.includes('enemyHorizontalFacing') && generatorSource.includes('enemyMirrorPatternIndex') && generatorSource.includes('msx2_enemy_runtime_dx')],
  ['Lode Runner MSX2 creator preserves side-facing sprite mirror policy', loderunnerCreatorSource.includes("facingDirection = 'right'") && loderunnerCreatorSource.includes("authoredPerspective: 'side'") && loderunnerCreatorSource.includes("horizontal: 'autoFromFacingDirection'") && loderunnerCreatorSource.includes('has_side_facing_msx2_sprites')],
  ['Lode Runner MSX2 creator marks ropes as behavior code 4', loderunnerCreatorSource.includes("ch === 'R' ? 4") && loderunnerCreatorSource.includes('has_ropes') && loderunnerCreatorSource.includes('Ropes: behavior layer value 4')],
  ['enemy patrol preserves coordinate register while computing screen offset', generatorSource.includes('ld b, (hl)\n    push bc\n${buildEnemyScreenSlotOffsetAsm(slot)}') && generatorSource.includes('add hl, de\n    pop bc\n    ld a, b')],
  ['MSX2 projects keep legacy MSX1 ECS offline', source.includes("target?: 'MSX1' | 'MSX2' | 'COMMON'") && source.includes('isComponentDefinitionEnabledForProject') && source.includes('isEntityTemplateEnabledForProject') && source.includes("component.target || 'MSX1'") && source.includes("template.target || 'MSX1'") && source.includes('target: projectTarget')],
  ['MSX2 entity normalization keeps projects on the MSX2 runtime', source.includes('normalizeEntityKind') && source.includes("params: { ...(entity.params || {}), runtime: 'MSX2' }")],
  ['maze world transitions bypass platform gravity', generatorSource.includes("const resumeAfterTransition = mazeMovement ? 'upload_hardware_sprite_attrs' : 'update_hardware_sprite_vertical'") && generatorSource.includes('const mazeDirectionReset = mazeMovement')],
  ['maze vertical routine guards against gravity', verticalRoutine.includes('Maze/Pac-Man mode has no platform vertical physics') && verticalRoutine.includes('jp upload_hardware_sprite_attrs')],
  ['Snake char runtime is generated as SCREEN 4 name-table updates with body growth', generatorSource.includes('function usesSnakeCharMovement') && generatorSource.includes('function buildSnakeCharRuntimeAsm') && generatorSource.includes('init_msx2_snake_char') && generatorSource.includes('update_msx2_snake_char') && generatorSource.includes('msx2_snake_draw_cell_16') && generatorSource.includes('msx2_snake_append_head') && generatorSource.includes('msx2_snake_check_self_collision') && generatorSource.includes('call WRTVRM')],
  ['Snake char runtime reserves and writes 16x16 blocks across SCREEN 4 banks', generatorSource.includes('getScreen4TileBytesForEntity') && generatorSource.includes('reserveCharBlockForAllBanks') && generatorSource.includes('findFreeScreen4CharBlockBase') && generatorSource.includes('call msx2_snake_load_runtime_chars') && generatorSource.includes('ld bc, ${byteCount}') && generatorSource.includes('add a, 3')],
  ['WorldMap ASM export accepts SCREEN 4 rooms', exportWorldMapAsmSource.includes('Msx2Screen4TileScreen') && exportWorldMapAsmSource.includes('ExportableWorldScreen') && worldMapEditorSource.includes('isMsx2Screen4TileScreen(screen)')],
  ['SCREEN 4 room labels replace old MSX2 screen wording', toolbarSource.includes('MSX2 SCREEN 4 Room (16x12)') && fileExplorerSource.includes('MSX2 SCREEN 4 Rooms') && !toolbarSource.includes('MSX2 16x16 Screen')],
  ['SCREEN 4 backend no longer rejects unused legacy screenmaps', !generatorSource.includes('addScreen(analysis.screenMaps?.[0])') && generatorSource.includes('collectReferencedTileScreens(analysis)')],
  ['GameFlow backgrounds resolve native SCREEN 4 rooms', (generatorSource.match(/screenLoadLabelForAssetId\(analysis, screenLabels, tileScreenLabels, current\.appearance\?\.backgroundScreenAssetId\)/g) || []).length >= 2 && generatorSource.includes("node.type === 'Restart'")],
  ['summary extraction keeps SCREEN 4 world references', summaryExtractorSource.includes('msx2Screens') && summaryExtractorSource.includes('node.screenAssetId || node.screenId') && summaryExtractorSource.includes("getAsset(assets, 'msx2screen', screenId)")],
  ['SCREEN 4 native entity scripts are scanned for variables', globalVariablesUtilsSource.includes("assets.filter(a => a.type === 'msx2screen')") && globalVariablesUtilsSource.includes('component?.behaviorCode') && globalVariablesUtilsSource.includes('component?.customCode')],
  ['MSX2 project slice explains runtime module placement', generatorSource.includes('includedRuntimeModuleDetails') && generatorSource.includes('runtimeModuleDetails') && generatorSource.includes("placement: 'resident'") && generatorSource.includes('excludedRuntimeModules') && generatorSource.includes('runtime.msx2.mapper.konami8k') && generatorSource.includes('reason: module.reason')],
  ['MSX2 project slice emits world bank manifest artifact', generatorSource.includes('function buildMsx2WorldBankManifest') && generatorSource.includes('worldBankManifest') && generatorSource.includes('msx2_world_bank_manifest.json') && generatorSource.includes("scope: 'msx2_screen4_world_bank_manifest'") && generatorSource.includes("dataWindowAddress = useKonamiDataBank ? '#A000'")],
  ['MSX2 preflight cross-validates world bank manifest against logical bank budget', buildScriptSource.includes('worldBankManifest bank') && buildScriptSource.includes('differs from logicalBankBudget') && buildScriptSource.includes('manifest_bank_by_index') && buildScriptSource.includes('estimatedPhysicalBanks length differs')],
  ['MSX2 preflight failures preserve world bank manifest summary', buildScriptSource.includes('"scope": "msx2_screen4_megarom_preflight_failure"') && buildScriptSource.includes('"worldBankManifest"') && buildScriptSource.includes('"overBudgetBankCount"') && buildScriptSource.includes('"estimatedPhysicalBanks"')],
  ['MSX2 preflight failures are tied to checked input artifacts', buildScriptSource.includes('"artifactChecks"') && buildScriptSource.includes('build_preflight_artifact_summaries') && buildScriptSource.includes('"msx2_world_bank_manifest.json"') && buildScriptSource.includes('if artifact_path.exists()')],
  ['MSX2 preflight failures expose failed pipeline gate', buildScriptSource.includes('build_msx2_preflight_failure_gate_summary') && buildScriptSource.includes('"pipelineGates"') && buildScriptSource.includes('"strict_warning_gate_rejected": "overflow_recovery_plan"') && buildScriptSource.includes('updated_gate["status"] = "not_run"')],
  ['MSX2 budget resolution attempts preserve compact failure context', buildScriptSource.includes('summarize_msx2_preflight_failure_for_resolution') && buildScriptSource.includes('"failedGateId"') && buildScriptSource.includes('"artifactCheckNames"') && buildScriptSource.includes('"failure": summarize_msx2_preflight_failure_for_resolution')],
  ['compile endpoint returns MSX2 budget feedback from embedded artifacts', serverSource.includes('function buildMsx2IdeBudgetFeedbackFromAsm') && serverSource.includes("project_slice.json") && serverSource.includes("logical_bank_budget.json") && serverSource.includes('responseData.msx2BudgetFeedback') && serverSource.includes('msx2BudgetFeedback: msx2BudgetFeedback') && serverSource.includes('msx2BudgetFeedback = buildMsx2IdeBudgetFeedbackFromAsm(codeToCompile)')],
  ['MSX2 budget feedback keeps IDE-facing shape stable', serverSource.includes("scope: 'msx2_screen4_ide_budget_feedback'") && serverSource.includes("status = 'warning'") && serverSource.includes("status = 'error'") && serverSource.includes('bankClassSummary: Array.isArray(logicalBudget.bankClassSummary)') && serverSource.includes('worldPackages: Array.isArray(projectSlice.worldPackageSummary)') && serverSource.includes('runtimeModules') && serverSource.includes('residentCount') && serverSource.includes('worldBankManifest') && serverSource.includes('packageCount') && serverSource.includes('largestAssets') && serverSource.includes('suggestedFixes')],
  ['compile endpoint gates MSX2 budget errors before Glass and records resolution attempts', serverSource.includes("error: 'MSX2 MegaROM preflight budget failed'") && serverSource.includes("action: 'server_compile_budget_gate'") && serverSource.includes("action: 'enable_zx0_preprocess'") && serverSource.includes('responseData.msx2BudgetResolution')],
  ['compile endpoint budget resolver preserves failure context', serverSource.includes('function buildMsx2BudgetResolutionFailureContext') && serverSource.includes('failedGateId') && serverSource.includes('buildMsx2BudgetResolutionFailureContext(msx2BudgetFeedback)') && codeExportModalSource.includes('failed gate:')],
  ['ROM build result displays MSX2 MegaROM budget feedback', codeExportModalSource.includes('MSX2 MegaROM budget') && codeExportModalSource.includes('msx2BudgetFeedback.rom?.payloadBytes') && codeExportModalSource.includes('msx2BudgetFeedback.rom.bankClassSummary') && codeExportModalSource.includes('msx2BudgetFeedback.largestAssets') && codeExportModalSource.includes('Suggested fixes:')],
  ['MSX2 budget feedback exposes warning banks and actionable fix targets', codeExportModalSource.includes('Warning banks:') && codeExportModalSource.includes('msx2BudgetFeedback.warnings?.warningPackedBanks') && codeExportModalSource.includes('fix.target') && codeExportModalSource.includes("fix.action || fix.reason || 'Review budget'")],
  ['ROM export modal previews MSX2 budget directly from generated ASM', codeExportModalSource.includes("from '../../utils/msx2BudgetFeedback'") && codeExportModalSource.includes('generatedMsx2BudgetFeedback') && codeExportModalSource.includes('MSX2 MegaROM budget preview') && codeExportModalSource.includes('updateGeneratedCode') && msx2BudgetFeedbackSource.includes('export const buildMsx2BudgetFeedbackFromAsm')],
  ['MSX2 budget preview parser is centralized outside the export modal', !codeExportModalSource.includes('const extractMideasArtifactCommentBlock') && !codeExportModalSource.includes('const parseMideasJsonArtifact') && msx2BudgetFeedbackSource.includes('MIDEAS_ARTIFACT') && msx2BudgetFeedbackSource.includes("scope: 'msx2_screen4_ide_budget_feedback'")],
  ['MSX2 budget feedback distinguishes resident core from world content pressure', codeExportModalSource.includes('summarizeMsx2BudgetPressure') && codeExportModalSource.includes('Core/resident:') && codeExportModalSource.includes('World/content:') && codeExportModalSource.includes('msx2BudgetFeedback.worldPackages') && msx2BudgetFeedbackSource.includes('residentCoreBytes') && msx2BudgetFeedbackSource.includes('worldContentBytes')],
  ['MSX2 budget feedback surfaces runtime module placement', msx2BudgetFeedbackSource.includes('runtimeModules') && msx2BudgetFeedbackSource.includes('residentCount') && msx2BudgetFeedbackSource.includes('farCodeCount') && codeExportModalSource.includes('Runtime modules:') && codeExportModalSource.includes('resident') && codeExportModalSource.includes('far')],
  ['MSX2 budget feedback surfaces world bank manifest placement', msx2BudgetFeedbackSource.includes('artifactWorldBankManifest') && msx2BudgetFeedbackSource.includes('estimatedPhysicalBankCount') && msx2BudgetFeedbackSource.includes('warningBankCount') && serverSource.includes('artifactWorldBankManifest') && serverSource.includes('manifestPackageCount') && serverSource.includes('manifestOverBudgetBankCount') && codeExportModalSource.includes('World Bank Packs:') && codeExportModalSource.includes('dataWindowAddress') && codeExportModalSource.includes('overBudgetBankCount')],
  ['ROM build result keeps MSX2 budget feedback on failed compile responses', codeExportModalSource.includes('msx2BudgetFeedback: result.msx2BudgetFeedback') && codeExportModalSource.includes('msx2BudgetResolution: result.msx2BudgetResolution') && codeExportModalSource.includes('screenCompressionInfo: result.screenCompressionInfo')],
  ['ROM build result keeps MSX2 resident compile failure guidance', serverSource.includes('buildMsx2ResidentOverflowFailure') && serverSource.includes('msx2CompileFailure') && codeExportModalSource.includes('msx2CompileFailure: result.msx2CompileFailure') && codeExportModalSource.includes('MSX2 resident bank overflow') && codeExportModalSource.includes('Plan B:')],
  ['ROM build result highlights MSX2 budget warning and error status', codeExportModalSource.includes('msx2BudgetStatusClass') && codeExportModalSource.includes("msx2BudgetStatus === 'error'") && codeExportModalSource.includes("msx2BudgetStatus === 'warning'") && codeExportModalSource.includes('border-red-500') && codeExportModalSource.includes('border-yellow-500') && codeExportModalSource.includes('msx2BudgetBadgeClass')],
  ['ROM build summary reports MSX2 budget resolution attempts', codeExportModalSource.includes('MSX2 budget resolution:') && codeExportModalSource.includes('MSX2 budget action:') && codeExportModalSource.includes('compileResult?.msx2BudgetResolution') && codeExportModalSource.includes('msx2BudgetResolutionAttempts.slice(-3)')],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
}

if (failures.length) {
  console.error(`\nMSX2 entity editor contract failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log('\nMSX2 entity editor contract passed.');
