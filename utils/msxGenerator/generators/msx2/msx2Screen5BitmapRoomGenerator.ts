import { ConnectionDirection, Msx2BitmapRoomCommand, Msx2GameFlowGraph, Msx2GameFlowNode, Msx2GameFlowScreen5PresentationNode, Msx2GameFlowTransitionNode, Msx2HudAsset, Msx2HudElement, Msx2HudFontAsset, Msx2HudIconEntry, Msx2HudWidget, Msx2PlayerDefinition, Msx2Screen5BitmapRoom, Msx2Screen5PresentationConfig, Msx2Sprite, PaletteAsset, Screen5PaletteSlot } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';
import { getMsx2PlatformPhysicsFromPlayerEntity, getMsx2DashConfigFromPlayerEntity, getMsx2AirDashConfigFromPlayerEntity, getMsx2GlideConfigFromPlayerEntity, getMsx2WallJumpConfigFromPlayerEntity, getMsx2PowerStompConfigFromPlayerEntity, getMsx2ShootConfigFromPlayerEntity, getMsx2TeleportABConfigFromPlayerEntity, getMsx2SlashConfigFromPlayerEntity, getMsx2GrabConfigFromPlayerEntity, getMsx2HighJumpConfigFromPlayerEntity, getMsx2WallBreakConfigFromPlayerEntity, getMsx2SpinAttackConfigFromPlayerEntity, getMsx2IceSlideConfigFromPlayerEntity, getMsx2CrouchConfigFromPlayerEntity, resolveMsx2BitmapKeyboardBinding } from '../../../msx2PlatformPhysics';
import {
  bitmapAirDashEnabled,
  buildBitmapAirDashEquates,
  buildBitmapAirDashGateAsm,
  buildBitmapAirDashInitClearAsm,
  buildBitmapAirDashRuntimeAsm,
  MSX2_BITMAP_AIR_DASH_RAM_BYTES,
} from './msx2BitmapAirDashGenerator';
import {
  buildBitmapDashEquates,
  buildBitmapDashGateAsm,
  buildBitmapDashInitClearAsm,
  buildBitmapDashRuntimeAsm,
  bitmapDashEnabled,
  MSX2_BITMAP_DASH_RAM_BASE,
  MSX2_BITMAP_DASH_RAM_BYTES,
} from './msx2BitmapDashGenerator';
import {
  buildBitmapDoubleJumpEquates,
  buildBitmapDoubleJumpInitClearAsm,
  buildBitmapJumpBlockAsm,
  buildBitmapCoyoteBufferEquates,
  buildBitmapCoyoteBufferInitClearAsm,
  buildBitmapCoyoteBufferLandHookAsm,
  buildBitmapCoyoteBufferLeaveGroundHookAsm,
} from './msx2BitmapDoubleJumpGenerator';
import {
  buildBitmapWallClimbGravityHookAsm,
  buildBitmapWallClimbRuntimeAsm,
  resolveBitmapWallClimbConfig,
} from './msx2BitmapWallClimbGenerator';
import {
  buildBitmapGlideEquates,
  buildBitmapGlideGravityHookAsm,
  buildBitmapGlideInitClearAsm,
  buildBitmapGlideRuntimeAsm,
  MSX2_BITMAP_GLIDE_RAM_BYTES,
} from './msx2BitmapGlideGenerator';
import {
  buildBitmapWallJumpEquates,
  buildBitmapWallJumpGravityHookAsm,
  buildBitmapWallJumpInitClearAsm,
  buildBitmapWallJumpInputHookAsm,
  buildBitmapWallJumpLandClearAsm,
  buildBitmapWallJumpRuntimeAsm,
  MSX2_BITMAP_WALL_JUMP_RAM_BYTES,
} from './msx2BitmapWallJumpGenerator';
import {
  bitmapPowerStompEnabled,
  buildBitmapPowerStompEquates,
  buildBitmapPowerStompGravityHookAsm,
  buildBitmapPowerStompInitClearAsm,
  buildBitmapPowerStompInputHookAsm,
  buildBitmapPowerStompLandClearAsm,
  buildBitmapPowerStompMainLoopCallAsm,
  buildBitmapPowerStompRuntimeAsm,
  MSX2_BITMAP_POWER_STOMP_RAM_BYTES,
  MSX2_BITMAP_SCREEN_SHAKE_RAM_BYTES,
} from './msx2BitmapPowerStompGenerator';
import {
  bitmapShootEnabled,
  bitmapShootRamBytes,
  buildBitmapBulletDataTables,
  buildBitmapBulletInitUploadAsm,
  buildBitmapBulletSatCallAsm,
  buildBitmapShootEquates,
  buildBitmapShootGateAsm,
  buildBitmapShootInitClearAsm,
  buildBitmapShootRuntimeAsm,
  type BitmapShootRuntimeOptions,
  type BitmapShootSpriteData,
} from './msx2BitmapShootGenerator';
import {
  bitmapTeleportABEnabled,
  buildBitmapTeleportABEquates,
  buildBitmapTeleportABGateAsm,
  buildBitmapTeleportABInitClearAsm,
  buildBitmapTeleportABRuntimeAsm,
  MSX2_BITMAP_TELEPORT_AB_RAM_BYTES,
} from './msx2BitmapTeleportABGenerator';
import {
  bitmapSlashEnabled,
  buildBitmapSlashEquates,
  buildBitmapSlashGateAsm,
  buildBitmapSlashInitClearAsm,
  buildBitmapSlashRuntimeAsm,
  MSX2_BITMAP_SLASH_RAM_BYTES,
} from './msx2BitmapSlashGenerator';
import {
  bitmapGrabEnabled,
  buildBitmapGrabEquates,
  buildBitmapGrabGateAsm,
  buildBitmapGrabGravityHookAsm,
  buildBitmapGrabInitClearAsm,
  buildBitmapGrabRuntimeAsm,
  MSX2_BITMAP_GRAB_RAM_BYTES,
} from './msx2BitmapGrabGenerator';
import {
  bitmapHighJumpEnabled,
  buildBitmapHighJumpEquates,
  buildBitmapHighJumpGravityHookAsm,
  buildBitmapHighJumpInitClearAsm,
  buildBitmapHighJumpInputHookAsm,
  buildBitmapHighJumpLandClearAsm,
  buildBitmapHighJumpRuntimeAsm,
  MSX2_BITMAP_HIGH_JUMP_RAM_BYTES,
} from './msx2BitmapHighJumpGenerator';
import {
  bitmapWallBreakEnabled,
  buildBitmapWallBreakEquates,
  buildBitmapWallBreakGateAsm,
  buildBitmapWallBreakInitClearAsm,
  buildBitmapWallBreakRuntimeAsm,
  MSX2_BITMAP_WALL_BREAK_RAM_BYTES,
} from './msx2BitmapWallBreakGenerator';
import {
  bitmapSpinAttackEnabled,
  buildBitmapSpinAttackEquates,
  buildBitmapSpinAttackGateAsm,
  buildBitmapSpinAttackInitClearAsm,
  buildBitmapSpinAttackRuntimeAsm,
  MSX2_BITMAP_SPIN_ATTACK_RAM_BYTES,
} from './msx2BitmapSpinAttackGenerator';
import {
  bitmapIceSlideEnabled,
  buildBitmapIceSlideEquates,
  buildBitmapIceSlideHorizontalHookAsm,
  buildBitmapIceSlideInitClearAsm,
  buildBitmapIceSlideRuntimeAsm,
  MSX2_BITMAP_ICE_SLIDE_RAM_BYTES,
} from './msx2BitmapIceSlideGenerator';
import {
  bitmapCrouchEnabled,
  buildBitmapCrouchEquates,
  buildBitmapCrouchHorizontalHookAsm,
  buildBitmapCrouchInitClearAsm,
  buildBitmapCrouchRuntimeAsm,
  MSX2_BITMAP_CROUCH_RAM_BYTES,
} from './msx2BitmapCrouchGenerator';
import {
  buildHardwareSpriteLayersForFrame,
  getFirstReferencedMsx2Sprite,
  getMsx2PlayerAssetRecords,
  resolveMsx2SpriteById,
} from './msx2Screen4Generator';

interface Msx2BitmapRoomConfig {
  screenMode: 'SCREEN 4 (Graphics II)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT_DEFAULT = 192;
const SCREEN5_VISIBLE_HEIGHT = 212;
// 212-line SCREEN 5 layout, no leftover: 20px HUD band on top + 192px game band
// (20 + 192 = 212). Requires VDP R#9 LN=1 (set in init_screen5_bitmap_vdp).
const BITMAP_ROOM_HUD_HEIGHT = 20;
const BITMAP_ROOM_GAME_Y_OFFSET = BITMAP_ROOM_HUD_HEIGHT;
const ROW_BYTES = SCREEN_WIDTH / 2;
const BITMAP_ROOM_PAGE0_BASE_Y = 0;
const BITMAP_ROOM_PAGE1_BASE_Y = 256;
const BITMAP_ROOM_ATLAS_BASE_Y = 512;
const BITMAP_ROOM_ATLAS_MAX_HEIGHT = 512;
const BITMAP_ROOM_SOURCE_ATLAS_MAX_HEIGHT = 2048;
const BITMAP_ROOM_PAGE0_R2 = 0x1f;
const BITMAP_ROOM_PAGE1_R2 = 0x3f;
const BITMAP_ROOM_GAME_VRAM_BASE = BITMAP_ROOM_GAME_Y_OFFSET * ROW_BYTES;
const BITMAP_ROOM_PAGE1_VRAM_BASE = BITMAP_ROOM_PAGE1_BASE_Y * ROW_BYTES;
const TILE_GRID_SIZE = 16;
const VDP_CTRL_PORT = '#99';
const VDP_DATA_PORT = '#98';
const VDP_CMD_PORT = '#9B';
const VDP_PALETTE_PORT = '#9A';

// V9938 HIGH-SPEED commands. HMMM/HMMV use the SAME pixel coordinate space as
// LMMM/LMMV (verified empirically: byte-coord halving rendered only the left
// half). They are ~10x faster because they skip the per-pixel logical op.
// X coordinates should be even (byte-aligned); all our coords already are.
const CMD_COPY_8 = 0xD0;   // HMMM: high-speed move VRAM -> VRAM
const CMD_COPY_16 = 0xD0;  // HMMM
const CMD_FILL = 0xC0;     // HMMV: high-speed fill VRAM rectangle
const CMD_LINE = 0x70;     // LINE (unused by records; HMMV handles line records)

const OP_FILL = 0;
const OP_LINE_H = 1;
const OP_LINE_V = 2;
const OP_COPY_8 = 3;
const OP_COPY_16 = 4;

const VDP_CMD_BLOCK_SIZE = 15;
const BITMAP_ROOM_COMPOSITION_BLOCKS_PER_FRAME = 24;
const VRAM_BANK_BYTES = 0x4000;
const ROM_DATA_BANK_BYTES = 0x2000;

// Hearts HUD (v1): tiles live in the always-free page-0 offscreen band (below the
// 212 visible lines, above the atlas region). Fixed address so they never depend
// on the per-world atlas size. Y=224 -> VRAM #7000 (R#14=1). Two 16x16 tiles sit
// side by side: heart_full (sx=0) and heart_empty (sx=16). Copied to the HUD band
// (color-1 background) via HMMM whenever player_health changes.
const BITMAP_HUD_HEART_TILE_Y = 224;
const BITMAP_HUD_HEART_VRAM = BITMAP_HUD_HEART_TILE_Y * ROW_BYTES; // #7000
const BITMAP_HUD_HEART_FULL_SX = 0;
const BITMAP_HUD_HEART_EMPTY_SX = 16;
const BITMAP_HUD_HEART_NX = 16;
const BITMAP_HUD_HEART_NY = 16;
const BITMAP_HUD_HEART_FIRST_X = 8;   // first heart dest X
const BITMAP_HUD_HEART_SPACING = 16;  // px between heart slots
const BITMAP_HUD_HEART_DEST_Y = 2;    // dest Y within the 20px HUD band
// Palette indices for the baked heart pixels. Full = bright red (MSX2 default
// light red), empty = gray outline. The project palette must map these slots to
// red/gray for the hearts to read correctly (configurable later via widget asset).
const BITMAP_HUD_HEART_COLOR_FULL = 9;
const BITMAP_HUD_HEART_COLOR_EMPTY = 14;
const BITMAP_HUD_HEART_COLOR_BG = 1;  // matches the HUD seed background
// Max hearts that fit in a 256px row at 16px each (left margin 8). Overflow
// (>12 hearts) is a documented follow-up (8x8 scaling); v1 assumes <= 12.
const BITMAP_HUD_HEART_MAX_SLOTS = 12;
const BITMAP_ROOM_MEGAROM_FIRST_DATA_BANK = 4;
const RLE_ROM_CHUNK_MAX_BYTES = 0x1f00;

const clampByte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
};

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
const hexVram = (value: number): string => `#${Math.max(0, Math.trunc(value)).toString(16).toUpperCase().padStart(5, '0')}`;

function firstBitmapRoom(analysis: ProjectAnalysis): Msx2Screen5BitmapRoom | undefined {
  return ((analysis as any).msx2BitmapRooms || [])[0] as Msx2Screen5BitmapRoom | undefined;
}

type RoomTransitions = Map<number, Partial<Record<ConnectionDirection, number>>>;

/**
 * A "world" is a `worldmap` asset; its nodes are the bitmap-room screens that
 * share one tileset/palette. This collects the ordered rooms of the world that
 * contains the first bitmap room, the start room index, and the edge-transition
 * table (room index + direction -> destination room index) derived from the
 * worldmap connections. With no worldmap it degrades to a single standalone room.
 */
function collectBitmapWorldRooms(analysis: ProjectAnalysis): {
  rooms: Msx2Screen5BitmapRoom[];
  startIndex: number;
  transitions: RoomTransitions;
  paletteAssetId?: string;
} {
  const allRooms = (((analysis as any).msx2BitmapRooms || []) as Msx2Screen5BitmapRoom[]).filter(Boolean);
  if (allRooms.length === 0) return { rooms: [], startIndex: 0, transitions: new Map() };

  const roomById = new Map(allRooms.map(room => [room.id, room]));
  const worldmaps = ((analysis as any).worldmaps || []) as any[];
  const graph = worldmaps.find(wm => (wm?.nodes || []).some((node: any) => roomById.has(node?.screenAssetId)));
  if (!graph) return { rooms: [allRooms[0]], startIndex: 0, transitions: new Map() };

  // Order the rooms by the worldmap nodes that resolve to a bitmap room.
  const orderedNodes = (graph.nodes || []).filter((node: any) => roomById.has(node?.screenAssetId));
  const rooms = orderedNodes.map((node: any) => roomById.get(node.screenAssetId)!);
  const indexByScreenId = new Map<string, number>(orderedNodes.map((node: any, index: number) => [node.screenAssetId, index]));
  const nodeById = new Map<string, any>((graph.nodes || []).map((node: any) => [node.id, node]));

  let startIndex = 0;
  const startNode = graph.startScreenNodeId ? nodeById.get(graph.startScreenNodeId) : undefined;
  if (startNode && indexByScreenId.has(startNode.screenAssetId)) {
    startIndex = indexByScreenId.get(startNode.screenAssetId)!;
  }

  const transitions: RoomTransitions = new Map();
  const setTransition = (from: number, dir: ConnectionDirection, to: number) => {
    const entry = transitions.get(from) || {};
    entry[dir] = to;
    transitions.set(from, entry);
  };
  for (const connection of graph.connections || []) {
    const fromNode = nodeById.get(connection?.fromNodeId);
    const toNode = nodeById.get(connection?.toNodeId);
    if (!fromNode || !toNode) continue;
    const fromIndex = indexByScreenId.get(fromNode.screenAssetId);
    const toIndex = indexByScreenId.get(toNode.screenAssetId);
    if (fromIndex === undefined || toIndex === undefined) continue;
    if (connection.fromDirection) setTransition(fromIndex, connection.fromDirection, toIndex);
    if (connection.toDirection) setTransition(toIndex, connection.toDirection, fromIndex);
  }
  return { rooms, startIndex, transitions, paletteAssetId: typeof graph.paletteAssetId === 'string' ? graph.paletteAssetId : undefined };
}

// --- GameFlow intro: SCREEN 5 presentation scene(s) before gameplay ---------
// The bitmap-runtime GameFlow (purpose 'screen4-bitmap-runtime') may open with
// Start -> Screen5Presentation [-> Transition] (repeatable) before reaching the
// WorldLink/room node. Those scenes are rendered at boot on the visible page 0
// (full 212 lines), then the normal game boot repaints HUD band + room over them.

interface BitmapIntroTransition {
  effect: string;
  durationFrames: number;
}

interface BitmapIntroScene {
  name: string;
  paletteBytes: number[];
  bitmapBytes: number[];
  waitForKey: boolean;
  waitFrames: number;
  transition?: BitmapIntroTransition;
}

interface BitmapIntroSceneBlob {
  scene: BitmapIntroScene;
  index: number;
  rleChunks: RleChunk[];
}

const BITMAP_INTRO_SUPPORTED_EFFECTS = new Set<string>([
  'cls',
  'fade_to_black',
  'screen5_vertical_pixel_wipe',
  'screen5_horizontal_pixel_wipe',
  'screen5_diagonal_pixel_wipe',
  'screen5_mirror_pixel_wipe',
]);

function parseIntroHexColor(hex: unknown): [number, number, number] | null {
  if (typeof hex !== 'string') return null;
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [
    Math.round(((value >> 16) & 0xff) * 7 / 255),
    Math.round(((value >> 8) & 0xff) * 7 / 255),
    Math.round((value & 0xff) * 7 / 255),
  ];
}

// Presentation assets store palettes as masterIndex slots (like rooms) OR as
// raw hex strings, so this cannot reuse the room-only buildPaletteBytes.
function buildIntroPaletteBytes(palette: Screen5PaletteSlot[] | undefined): number[] {
  const source = Array.isArray(palette) ? palette : [];
  return Array.from({ length: 16 }, (_unused, slotIndex) => {
    const slot = source.find(item => item?.slotIndex === slotIndex) || source[slotIndex];
    const masterIndex = Number(slot?.masterIndex);
    if (Number.isFinite(masterIndex) && masterIndex >= 0) {
      const index = Math.max(0, Math.min(511, Math.trunc(masterIndex)));
      return [((index >> 6) & 0x07) << 4 | (index & 0x07), (index >> 3) & 0x07];
    }
    const rgb = parseIntroHexColor((slot as any)?.hex);
    if (rgb) return [(rgb[0] << 4) | rgb[2], rgb[1]];
    return [0, 0];
  }).flat();
}

// 4bpp packed bitmap padded/cropped to the full 212 visible lines. Presentation
// assets may nest the packed data under .data (PNG import path).
function buildIntroBitmapBytes(presentation: Msx2Screen5PresentationConfig): number[] {
  const nested = (presentation as any)?.data as { packedBitmap?: unknown; packedPixels?: unknown; height?: unknown } | undefined;
  const packed = (Array.isArray(presentation.packedBitmap) && presentation.packedBitmap.length ? presentation.packedBitmap : undefined)
    || (Array.isArray(nested?.packedBitmap) ? nested!.packedBitmap as number[] : undefined)
    || (Array.isArray(nested?.packedPixels) ? nested!.packedPixels as number[] : undefined)
    || [];
  const declaredHeight = presentation.height ?? (nested?.height as number | undefined);
  const imageHeight = declaredHeight === 212 ? 212 : 192;
  const imageBytes = Math.min(imageHeight * ROW_BYTES, packed.length);
  const bytes = Array.from({ length: SCREEN5_VISIBLE_HEIGHT * ROW_BYTES }, () => 0);
  for (let index = 0; index < imageBytes; index++) {
    bytes[index] = clampByte(packed[index], 0);
  }
  return bytes;
}

function resolveBitmapIntroScenes(analysis: ProjectAnalysis): BitmapIntroScene[] {
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[])
    .filter(flow => flow?.purpose === 'screen4-bitmap-runtime');
  const flow = flows.find(candidate => candidate?.name === 'Main MSX2') || flows[0];
  if (!flow || !Array.isArray(flow.nodes)) return [];
  const presentations = (((analysis as any).msx2Presentations || []) as Array<Msx2Screen5PresentationConfig & { id?: string; palette?: Screen5PaletteSlot[] }>);
  const nodeById = new Map(flow.nodes.map(node => [node.id, node]));
  const nextOf = (node: Msx2GameFlowNode): Msx2GameFlowNode | undefined => {
    const connection = (flow.connections || []).find(item => item.from.nodeId === node.id && !item.from.sourceId);
    return connection ? nodeById.get(connection.to.nodeId) : undefined;
  };
  const nextExport = (node: Msx2GameFlowNode): Msx2GameFlowNode | undefined => {
    let next = nextOf(node);
    const visited = new Set<string>();
    while (next && (next.type === 'Waypoint' || next.type === 'Globals') && !visited.has(next.id)) {
      visited.add(next.id);
      next = nextOf(next);
    }
    return next;
  };
  const startNode = (flow.startNodeId ? nodeById.get(flow.startNodeId) : undefined)
    || flow.nodes.find(node => node.type === 'Start');
  if (!startNode) return [];

  const scenes: BitmapIntroScene[] = [];
  let current = startNode.type === 'Screen5Presentation' ? startNode : nextExport(startNode);
  const visited = new Set<string>();
  while (current && current.type === 'Screen5Presentation' && !visited.has(current.id)) {
    visited.add(current.id);
    const node = current as Msx2GameFlowScreen5PresentationNode;
    const presentation = node.presentationAssetId
      ? presentations.find(item => (item as any).id === node.presentationAssetId)
      : presentations[0];
    if (!presentation) {
      throw new Error(`MSX2 bitmap-room GameFlow Screen5Presentation node "${node.id}" references missing msx2presentation asset "${node.presentationAssetId || 'auto-first'}".`);
    }
    const runtime = (presentation as any).runtime as { waitForKey?: boolean; waitForFrames?: number } | undefined;
    const scene: BitmapIntroScene = {
      name: String((presentation as any).name || `scene ${scenes.length}`),
      paletteBytes: buildIntroPaletteBytes((presentation as any).palette || ((presentation as any).data?.palette as Screen5PaletteSlot[] | undefined)),
      bitmapBytes: buildIntroBitmapBytes(presentation),
      waitForKey: node.waitForKey ?? (runtime?.waitForKey !== false),
      waitFrames: clampByte(node.waitFrames ?? runtime?.waitForFrames, 0),
    };
    let next = nextExport(current);
    if (next?.type === 'Transition') {
      const transitionNode = next as Msx2GameFlowTransitionNode;
      const effect = String(transitionNode.effect || '');
      if (!BITMAP_INTRO_SUPPORTED_EFFECTS.has(effect)) {
        throw new Error(`MSX2 bitmap-room GameFlow Transition effect "${effect}" is not supported by the SCREEN 5 bitmap-room intro; use a SCREEN 5 effect (pixel wipes, fade to black or CLS).`);
      }
      scene.transition = { effect, durationFrames: clampByte(transitionNode.durationFrames, 0) };
      next = nextExport(next);
    }
    scenes.push(scene);
    current = next;
  }
  return scenes;
}

const BITMAP_INTRO_EFFECT_CALLS: Record<string, string> = {
  cls: '    call bitmap_intro_cls\n',
  fade_to_black: '    call bitmap_intro_fade_black\n',
  screen5_vertical_pixel_wipe: '    call bitmap_intro_wipe_vertical\n',
  screen5_horizontal_pixel_wipe: '    call bitmap_intro_wipe_horizontal\n',
  screen5_diagonal_pixel_wipe: '    call bitmap_intro_wipe_diagonal\n',
  screen5_mirror_pixel_wipe: '    call bitmap_intro_wipe_mirror\n',
};

/**
 * Emits the boot-time GameFlow intro: per-scene palette + full-page bitmap on the
 * visible page 0, key/frame waits and SCREEN 5 transition effects. Everything runs
 * with interrupts disabled like the rest of the runtime: frame pacing polls S#0
 * (bitmap_wait_vblank), key waits poll PPI keyboard row 8 (SPACE) directly and the
 * wipes are V9938 HMMV fills, so no BIOS CHGET/FILVRM/halt is involved.
 */
function buildBitmapIntroAsm(
  blobs: BitmapIntroSceneBlob[],
  banked: boolean
): { initCallAsm: string; routinesAsm: string; dataAsm: string } {
  if (!blobs.length) return { initCallAsm: '', routinesAsm: '', dataAsm: '' };
  const usedEffects = new Set(blobs.map(blob => blob.scene.transition?.effect).filter(Boolean) as string[]);

  const sceneAsm = blobs.map(({ scene, index }) => {
    const safeName = scene.name.replace(/[^\x20-\x7E]/g, ' ');
    const waitAsm = scene.waitForKey
      ? '    call bitmap_intro_wait_space\n'
      : scene.waitFrames > 0
        ? `    ld b, ${scene.waitFrames}\n    call bitmap_intro_wait_frames\n`
        : '';
    const transitionAsm = scene.transition
      ? `${BITMAP_INTRO_EFFECT_CALLS[scene.transition.effect]}${scene.transition.durationFrames > 0
          ? `    ld b, ${scene.transition.durationFrames}\n    call bitmap_intro_wait_frames\n`
          : ''}`
      : '';
    return `    ; Intro scene ${index}: ${safeName}
    ld hl, bitmap_intro_scene${index}_palette
    call bitmap_intro_load_palette
    call bitmap_intro_upload_scene${index}
${waitAsm}${transitionAsm}`;
  }).join('');

  const uploadRoutines = blobs.map(({ index, rleChunks }) => `bitmap_intro_upload_scene${index}:
${buildRleUploadAsm(rleChunks, banked)}
`).join('\n');

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: run_bitmap_intro
; ------------------------------------------------------------
; PURPOSE:
;   Play the GameFlow intro (Screen5Presentation -> Transition chain) before the
;   game boot continues. Scenes render on the visible page 0 that the game boot
;   repaints right after (HUD seed + start room), so nothing needs restoring.
;
; INPUT:
;   None. Called once from init_rom right after init_screen5_bitmap_vdp.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; SIDE EFFECTS:
;   Hides hardware sprites during the intro (SAT is still uninitialized) and
;   restores R#8 = #08 (sprites enabled) before returning. In MegaROM mode the
;   scene uploads select P2 data banks and restore the resident banks.
; ------------------------------------------------------------
run_bitmap_intro:
    ; Hide sprites while the SAT/pattern tables still hold garbage
    ; (init_hardware_sprite_tables runs later). R#8 base value #08 matches the
    ; MSX2 BIOS default written by CHGMOD; bit 1 = SPD (sprite disable).
    ld a, #08
    ld e, #0A
    call vdp_write_register
    ; Blank the visible page before the first scene shows.
    call bitmap_intro_cls
${sceneAsm}    ; Re-enable sprites for gameplay.
    ld a, #08
    ld e, #08
    call vdp_write_register
    ret

bitmap_intro_load_palette:
    ; HL = 32-byte palette block (byte1=(R<<4)|B, byte2=G). Clobbers AF, BC, HL.
    ld b, 16
    xor a
.pal_loop:
    push af
    push bc
    push hl
    ld e, a
    ld a, 16
    call vdp_write_register
    pop hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .pal_loop
    ret

bitmap_intro_fill_rect:
    ; HMMV fill with colour 0 on the visible page: HL = DX (even px), DE = DY,
    ; BC = NX (even px), A = NY (1..212). Waits for the command engine, then
    ; streams R#36..R#46 through the indirect port. Preserves HL, DE, BC.
    ; Leaves R#15 = S#2 (bitmap_intro_frame_wait restores S#0).
    push af
    call vdp_wait_cmd_ready
    push de
    ld e, #24                 ; indirect register pointer -> R#36 (DX low)
    ld a, #11
    call vdp_write_register
    pop de
    ld a, l
    out (${VDP_CMD_PORT}), a  ; DX low
    ld a, h
    out (${VDP_CMD_PORT}), a  ; DX high
    ld a, e
    out (${VDP_CMD_PORT}), a  ; DY low
    ld a, d
    out (${VDP_CMD_PORT}), a  ; DY high
    ld a, c
    out (${VDP_CMD_PORT}), a  ; NX low
    ld a, b
    out (${VDP_CMD_PORT}), a  ; NX high
    pop af
    out (${VDP_CMD_PORT}), a  ; NY low
    xor a
    out (${VDP_CMD_PORT}), a  ; NY high
    out (${VDP_CMD_PORT}), a  ; COL = 0 (backdrop)
    out (${VDP_CMD_PORT}), a  ; ARG = 0
    ld a, #C0                 ; HMMV
    out (${VDP_CMD_PORT}), a
    ret

bitmap_intro_cls:
    ; Clear the full visible page (256x212) with one HMMV. Clobbers AF, BC, DE, HL.
    ld hl, 0
    ld de, 0
    ld bc, #0100
    ld a, 212
    jp bitmap_intro_fill_rect

bitmap_intro_frame_wait:
    ; One 60Hz tick: restore R#15 = S#0 (fills leave S#2 selected), then poll the
    ; frame flag. Preserves DE, HL. Clobbers AF, BC.
    push de
    push hl
    ld a, #0F
    ld e, #00
    call vdp_write_register
    call bitmap_wait_vblank
    pop hl
    pop de
    ret

bitmap_intro_wait_frames:
    ; B = frame count (1..255). Clobbers AF, BC.
.wf_loop:
    push bc
    call bitmap_intro_frame_wait
    pop bc
    djnz .wf_loop
    ret

bitmap_intro_wait_space:
    ; Wait for a SPACE press on PPI keyboard row 8 (bit 0), requiring
    ; release -> press -> release so a held key cannot leak into gameplay
    ; as an instant jump. Clobbers AF, BC.
.ws_release0:
    call bitmap_intro_read_row8
    bit 0, a
    jp nz, .ws_release0
.ws_press:
    call bitmap_intro_read_row8
    bit 0, a
    jp z, .ws_press
.ws_release1:
    call bitmap_intro_read_row8
    bit 0, a
    jp nz, .ws_release1
    ret

bitmap_intro_read_row8:
    ; A = pressed-bit mask of keyboard row 8 (bit0 = SPACE). Direct PPI read,
    ; same technique as update_player_movement (no BIOS under DI). Clobbers AF.
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret
${usedEffects.has('screen5_vertical_pixel_wipe') || usedEffects.has('screen5_mirror_pixel_wipe') ? `
bitmap_intro_fill_col2:
    ; Fill one 2x212 column at DX = HL, then HL += 2. Clobbers AF, BC, DE.
    ld de, 0
    ld bc, 2
    ld a, 212
    call bitmap_intro_fill_rect
    inc hl
    inc hl
    ret
` : ''}${usedEffects.has('screen5_vertical_pixel_wipe') ? `
bitmap_intro_wipe_vertical:
    ; Wipe the visible page with 2px columns, left -> right, 2 columns/frame.
    ld hl, 0
.vw_loop:
    call bitmap_intro_fill_col2
    call bitmap_intro_fill_col2
    call bitmap_intro_frame_wait
    ld a, h
    or a
    jp z, .vw_loop
    ret
` : ''}${usedEffects.has('screen5_mirror_pixel_wipe') ? `
bitmap_intro_wipe_mirror:
    ; Wipe 2px columns from both vertical edges inward, one pair per frame.
    ld hl, 0
.mw_loop:
    call bitmap_intro_fill_col2   ; left column; HL += 2
    push hl
    ld a, l                       ; right column DX = 256 - HL
    neg
    ld l, a
    ld h, 0
    ld de, 0
    ld bc, 2
    ld a, 212
    call bitmap_intro_fill_rect
    pop hl
    call bitmap_intro_frame_wait
    ld a, l
    cp 128
    jp c, .mw_loop
    ret
` : ''}${usedEffects.has('screen5_horizontal_pixel_wipe') ? `
bitmap_intro_wipe_horizontal:
    ; Wipe with 2px rows, top -> bottom, 2 rows per frame (212 lines).
    ld de, 0
.hw_loop:
    call bitmap_intro_fill_row2
    call bitmap_intro_fill_row2
    call bitmap_intro_frame_wait
    ld a, e
    cp 212
    jp c, .hw_loop
    ret

bitmap_intro_fill_row2:
    ; Fill one 256x2 row band at DY = DE, then DE += 2. Clobbers AF, BC, HL.
    ld hl, 0
    ld bc, #0100
    ld a, 2
    call bitmap_intro_fill_rect
    inc e
    inc e
    ret
` : ''}${usedEffects.has('screen5_diagonal_pixel_wipe') ? `
bitmap_intro_wipe_diagonal:
    ; Clear 8x8 blocks along anti-diagonals (32 cols x 27 rows, last row 4px),
    ; one diagonal per frame. Scratch: player_y = diagonal index, player_x = row
    ; block (both re-initialized by the boot sequence right after the intro).
    xor a
    ld (player_y), a
.dg_diag:
    xor a
    ld (player_x), a
.dg_row:
    ld a, (player_x)
    ld c, a                   ; C = row block 0..26
    ld a, (player_y)
    sub c                     ; A = column block = diagonal - row block
    jp c, .dg_next_row
    cp 32
    jp nc, .dg_next_row
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl                ; HL = DX = column block * 8
    ld a, c
    add a, a
    add a, a
    add a, a                  ; A = DY = row block * 8 (0..208)
    ld e, a
    ld d, 0
    cp 208
    ld a, 8
    jp c, .dg_fill
    ld a, 4                   ; last row block: 212 - 208 = 4 lines
.dg_fill:
    ld bc, 8
    call bitmap_intro_fill_rect
.dg_next_row:
    ld a, (player_x)
    inc a
    ld (player_x), a
    cp 27
    jp c, .dg_row
    call bitmap_intro_frame_wait
    ld a, (player_y)
    inc a
    ld (player_y), a
    cp 58
    jp c, .dg_diag
    ret
` : ''}${usedEffects.has('fade_to_black') ? `
bitmap_intro_fade_black:
    ; Write all 16 palette entries black, then blank the bitmap too: the game
    ; boot uploads the atlas next (slow) and the old presentation must not
    ; reappear when the game palette loads. Clobbers AF, BC, DE, HL.
    ld hl, bitmap_intro_black_palette
    call bitmap_intro_load_palette
    jp bitmap_intro_cls
` : ''}
${uploadRoutines}`;

  const paletteData = blobs.map(({ scene, index }) =>
    formatBytes(`bitmap_intro_scene${index}_palette`, scene.paletteBytes, `GameFlow intro scene ${index} palette: byte1=(R<<4)|B, byte2=G`)
  ).join('');
  const blackPaletteData = usedEffects.has('fade_to_black')
    ? formatBytes('bitmap_intro_black_palette', Array.from({ length: 32 }, () => 0), 'All-black palette for the fade_to_black intro transition')
    : '';
  const chunkData = banked
    ? (blobs.length ? '; GameFlow intro scene bitmap RLE is emitted in Konami MegaROM data banks below.\n' : '')
    : blobs.map(({ scene, index, rleChunks }) =>
        formatRleChunks(rleChunks, scene.bitmapBytes.length, `GameFlow intro scene ${index} SCREEN 5 bitmap, packed 4bpp RLE, destination VRAM #00000`)
      ).join('');

  return {
    initCallAsm: '    call run_bitmap_intro\n',
    routinesAsm,
    dataAsm: `${paletteData}${blackPaletteData}${chunkData}`,
  };
}

function normalizeRoom(room: Msx2Screen5BitmapRoom | undefined): Msx2Screen5BitmapRoom {
  const atlasWidth = clampInt(room?.atlas?.width, 1, 256, 256);
  const entryBottom = Math.max(
    0,
    ...((room?.atlas?.entries || []).map(entry =>
      Math.trunc(Number(entry?.sy) || 0) + Math.max(1, Math.trunc(Number(entry?.h) || TILE_GRID_SIZE))
    )),
  );
  const authoredAtlasHeight = Math.max(
    Number(room?.atlas?.height) || 0,
    Array.isArray(room?.atlas?.pixels) ? room!.atlas!.pixels.length : 0,
    entryBottom,
  );
  const atlasHeight = clampInt(authoredAtlasHeight, 1, BITMAP_ROOM_SOURCE_ATLAS_MAX_HEIGHT, 256);
  const height = room?.height === 212 ? 212 : SCREEN_HEIGHT_DEFAULT;
  return {
    id: room?.id || 'bitmap_room_0',
    name: room?.name || 'MSX2 SCREEN 4 Bitmap Room',
    target: 'MSX2',
    vdpMode: 'SCREEN5_BITMAP_ROOM',
    width: SCREEN_WIDTH,
    height,
    palette: Array.isArray(room?.palette) ? room!.palette : [],
    backgroundColor: clampByte(room?.backgroundColor, 0) & 0x0f,
    atlas: {
      width: atlasWidth,
      height: atlasHeight,
      offscreenBaseY: BITMAP_ROOM_ATLAS_BASE_Y,
      pixels: room?.atlas?.pixels || [],
      entries: room?.atlas?.entries || [],
    },
    composition: {
      source: room?.composition?.source || 'authored',
      commands: room?.composition?.commands || [],
    },
    tileGrid: room?.tileGrid,
    visibleFramebuffer: room?.visibleFramebuffer,
    collision: room?.collision || [],
    effects: room?.effects || [],
    behavior: room?.behavior || [],
    entities: room?.entities || [],
    keyItems: Array.isArray(room?.keyItems) ? room!.keyItems : [],
    playerEntries: room?.playerEntries || [],
    foregroundTiles: Array.isArray(room?.foregroundTiles) ? room!.foregroundTiles : undefined,
    runtime: room?.runtime,
    notes: room?.notes,
  };
}

function normalizeAtlasPixels(room: Msx2Screen5BitmapRoom): number[][] {
  return Array.from({ length: room.atlas.height }, (_unused, y) =>
    Array.from({ length: room.atlas.width }, (_unused2, x) => clampByte(room.atlas.pixels?.[y]?.[x], 0) & 0x0f)
  );
}

function paintRect(screen: number[][], x: number, y: number, w: number, h: number, color: number): void {
  const x0 = clampInt(x, 0, SCREEN_WIDTH, 0);
  const y0 = clampInt(y, 0, SCREEN_HEIGHT_DEFAULT, 0);
  const x1 = clampInt(x + Math.max(0, w), 0, SCREEN_WIDTH, 0);
  const y1 = clampInt(y + Math.max(0, h), 0, SCREEN_HEIGHT_DEFAULT, 0);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      screen[py][px] = color & 0x0f;
    }
  }
}

function packBitmapPixels(pixels: number[][]): number[] {
  const packed: number[] = [];
  for (const row of pixels) {
    for (let x = 0; x < SCREEN_WIDTH; x += 2) {
      const left = clampByte(row[x], 0) & 0x0f;
      const right = clampByte(row[x + 1], 0) & 0x0f;
      packed.push(((left & 0x0f) << 4) | (right & 0x0f));
    }
  }
  return packed;
}

function packAtlasPixels(room: Msx2Screen5BitmapRoom): number[] {
  const atlasPixels = normalizeAtlasPixels(room);
  const rows: number[][] = [];
  for (let y = 0; y < room.atlas.height; y++) {
    const row = Array.from({ length: SCREEN_WIDTH }, () => 0);
    for (let x = 0; x < room.atlas.width; x++) {
      row[x] = atlasPixels[y]?.[x] ?? 0;
    }
    rows.push(row);
  }
  return packBitmapPixels(rows);
}

function extractAtlasEntryPixels(room: Msx2Screen5BitmapRoom, entry: { sx: number; sy: number; w: number; h: number }): number[][] {
  const pixels = normalizeAtlasPixels(room);
  const width = Math.max(1, Math.min(TILE_GRID_SIZE, Math.trunc(Number(entry.w) || TILE_GRID_SIZE)));
  const height = Math.max(1, Math.min(TILE_GRID_SIZE, Math.trunc(Number(entry.h) || TILE_GRID_SIZE)));
  const sx = clampInt(entry.sx, 0, Math.max(0, room.atlas.width - 1), 0);
  const sy = clampInt(entry.sy, 0, Math.max(0, room.atlas.height - 1), 0);
  return Array.from({ length: height }, (_row, y) =>
    Array.from({ length: width }, (_col, x) => pixels[sy + y]?.[sx + x] ?? 0)
  );
}

function atlasEntryFingerprint(pixels: number[][]): string {
  const width = pixels[0]?.length || 0;
  const rows = pixels.map(row => (row || []).map(value => (clampByte(value, 0) & 0x0f).toString(16)).join(''));
  return `${width}x${pixels.length}:${rows.join('|')}`;
}

function buildSharedWorldAtlasRooms(rooms: Msx2Screen5BitmapRoom[]): { rooms: Msx2Screen5BitmapRoom[]; atlasRoom: Msx2Screen5BitmapRoom } {
  const sharedWidth = SCREEN_WIDTH;
  const uniqueItems: Array<{ fingerprint: string; pixels: number[][]; w: number; h: number }> = [];
  const seenFingerprints = new Set<string>();
  for (const room of rooms) {
    for (const entry of room.atlas?.entries || []) {
      const pixels = extractAtlasEntryPixels(room, entry);
      const fingerprint = atlasEntryFingerprint(pixels);
      if (seenFingerprints.has(fingerprint)) continue;
      seenFingerprints.add(fingerprint);
      uniqueItems.push({ fingerprint, pixels, w: Math.max(1, pixels[0]?.length || TILE_GRID_SIZE), h: Math.max(1, pixels.length) });
    }
  }
  let measureX = 0;
  let measureY = 0;
  let measureShelfHeight = TILE_GRID_SIZE;
  let requiredHeight = TILE_GRID_SIZE;
  for (const item of uniqueItems) {
    if (item.w > sharedWidth) {
      throw new Error(`SCREEN 5 bitmap-room atlas tile ${item.w}x${item.h} exceeds shared atlas width ${sharedWidth}.`);
    }
    if (measureX + item.w > sharedWidth) {
      measureX = 0;
      measureY += measureShelfHeight;
      measureShelfHeight = item.h;
    }
    requiredHeight = Math.max(requiredHeight, measureY + item.h);
    measureX += item.w;
    measureShelfHeight = Math.max(measureShelfHeight, item.h);
  }
  const sharedHeight = Math.max(
    TILE_GRID_SIZE,
    Math.min(BITMAP_ROOM_ATLAS_MAX_HEIGHT, requiredHeight),
  );
  if (requiredHeight > sharedHeight) {
    throw new Error(`SCREEN 5 bitmap-room shared atlas overflow: tiles from all rooms need more than ${sharedWidth}x${sharedHeight}.`);
  }
  const sharedPixels = Array.from({ length: sharedHeight }, () => Array.from({ length: sharedWidth }, () => 0));
  const placedByFingerprint = new Map<string, { sx: number; sy: number; w: number; h: number }>();
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = TILE_GRID_SIZE;

  const placePixels = (pixels: number[][]): { sx: number; sy: number; w: number; h: number } => {
    const h = Math.max(1, pixels.length);
    const w = Math.max(1, pixels[0]?.length || TILE_GRID_SIZE);
    const fingerprint = atlasEntryFingerprint(pixels);
    const existing = placedByFingerprint.get(fingerprint);
    if (existing) return existing;
    if (w > sharedWidth || h > sharedHeight) {
      throw new Error(`SCREEN 5 bitmap-room atlas tile ${w}x${h} exceeds shared atlas bounds ${sharedWidth}x${sharedHeight}.`);
    }
    if (cursorX + w > sharedWidth) {
      cursorX = 0;
      cursorY += shelfHeight;
      shelfHeight = h;
    }
    if (cursorY + h > sharedHeight) {
      throw new Error(`SCREEN 5 bitmap-room shared atlas overflow: tiles from all rooms need more than ${sharedWidth}x${sharedHeight}.`);
    }
    const placed = { sx: cursorX, sy: cursorY, w, h };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        sharedPixels[cursorY + y][cursorX + x] = clampByte(pixels[y]?.[x], 0) & 0x0f;
      }
    }
    cursorX += w;
    shelfHeight = Math.max(shelfHeight, h);
    placedByFingerprint.set(fingerprint, placed);
    return placed;
  };

  const remappedRooms = rooms.map(room => {
    const entries = (room.atlas?.entries || []).map(entry => {
      const placed = placePixels(extractAtlasEntryPixels(room, entry));
      return { ...entry, sx: placed.sx, sy: placed.sy, w: placed.w, h: placed.h };
    });
    return {
      ...room,
      atlas: {
        width: sharedWidth,
        height: sharedHeight,
        offscreenBaseY: BITMAP_ROOM_ATLAS_BASE_Y,
        pixels: sharedPixels,
        entries,
      },
    };
  });

  return {
    rooms: remappedRooms,
    atlasRoom: {
      ...remappedRooms[0],
      atlas: {
        width: sharedWidth,
        height: sharedHeight,
        offscreenBaseY: BITMAP_ROOM_ATLAS_BASE_Y,
        pixels: sharedPixels,
        entries: remappedRooms.flatMap(room => room.atlas.entries || []),
      },
    },
  };
}

const DEFAULT_HUD_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const DEFAULT_HUD_PATTERNS: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0, 0],
  '0': [0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0],
  '1': [0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0],
  '2': [0x3C,0x66,0x06,0x1C,0x30,0x60,0x7E,0],
  '3': [0x3C,0x66,0x06,0x1C,0x06,0x66,0x3C,0],
  '4': [0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0],
  '5': [0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0],
  '6': [0x1C,0x30,0x60,0x7C,0x66,0x66,0x3C,0],
  '7': [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0],
  '8': [0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0],
  '9': [0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0],
  A: [0x18,0x3C,0x66,0x66,0x7E,0x66,0x66,0],
  B: [0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0],
  C: [0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0],
  D: [0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0],
  E: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0],
  F: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0],
  G: [0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0],
  H: [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0],
  I: [0x7E,0x18,0x18,0x18,0x18,0x18,0x7E,0],
  J: [0x1E,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0],
  K: [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0],
  L: [0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0],
  M: [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0],
  N: [0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0],
  O: [0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  P: [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0],
  Q: [0x3C,0x66,0x66,0x66,0x6A,0x6C,0x36,0],
  R: [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0],
  S: [0x3C,0x66,0x60,0x3C,0x06,0x66,0x3C,0],
  T: [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0],
  U: [0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  V: [0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0],
  W: [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0],
  X: [0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0],
  Y: [0x66,0x66,0x66,0x3C,0x18,0x18,0x18,0],
  Z: [0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0],
  ':': [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0],
  '-': [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0],
  '/': [0x06,0x0C,0x0C,0x18,0x30,0x30,0x60,0],
};

function findBitmapHudFontAsset(
  assets: Array<{ id?: string; type?: string; data?: unknown }>,
  fontAssetId: string | null | undefined,
): Msx2HudFontAsset | undefined {
  if (!fontAssetId) return undefined;
  return assets.find(asset => asset.type === 'msx2hudfont' && asset.id === fontAssetId)?.data as Msx2HudFontAsset | undefined;
}

function getBitmapHudFontAsset(
  analysis: ProjectAnalysis,
  room: Msx2Screen5BitmapRoom,
  linkedHudAsset?: Msx2HudAsset,
): Msx2HudFontAsset | undefined {
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  if (linkedHudAsset) {
    if (Object.prototype.hasOwnProperty.call(linkedHudAsset, 'hudFontAssetId')) {
      return findBitmapHudFontAsset(assets, linkedHudAsset.hudFontAssetId);
    }
    if (room.runtime && Object.prototype.hasOwnProperty.call(room.runtime, 'hudFontAssetId')) {
      return findBitmapHudFontAsset(assets, room.runtime.hudFontAssetId);
    }
    return undefined;
  }
  if (room.runtime && Object.prototype.hasOwnProperty.call(room.runtime, 'hudFontAssetId')) {
    return findBitmapHudFontAsset(assets, room.runtime.hudFontAssetId);
  }
  return assets.find(asset => asset.type === 'msx2hudfont')?.data as Msx2HudFontAsset | undefined;
}

/**
 * Resolves the standalone MSX2 HUD asset (project asset type 'msx2hud') linked
 * from a bitmap room's `runtime.hudAssetId`, same lookup pattern as
 * `resolveWorldPalette`. Returns undefined when unlinked or unresolved, in which
 * case the caller falls back to the legacy hardcoded hearts HUD + inline
 * `room.runtime.hudWidgets` (byte-identical ROM for projects that never touch
 * the Msx2HudEditor).
 */
function resolveLinkedHudAsset(analysis: ProjectAnalysis, hudAssetId: string | undefined): Msx2HudAsset | undefined {
  if (!hudAssetId) return undefined;
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  const asset = assets.find(item => item.id === hudAssetId && item.type === 'msx2hud')?.data as Msx2HudAsset | undefined;
  return asset && Array.isArray(asset.layers) ? asset : undefined;
}

function normalizeHudText(value: string, maxLength: number, allowedCharacters: string): string {
  const allowed = new Set(Array.from(allowedCharacters || DEFAULT_HUD_CHARS));
  return Array.from(String(value || '').toUpperCase())
    .map(char => allowed.has(char) ? char : ' ')
    .join('')
    .slice(0, Math.max(0, maxLength));
}

function getBitmapHudWidgetText(widget: Msx2HudWidget, room: Msx2Screen5BitmapRoom, allowedCharacters: string): string {
  const maxChars = Math.max(1, Math.min(31, Math.floor((Number(widget.width) || 64) / 8)));
  if (widget.kind === 'text') return normalizeHudText(widget.text || widget.name || 'TEXT', maxChars, allowedCharacters);
  if (widget.kind !== 'counter') return '';
  const binding = widget.binding || 'custom';
  const fallbackValue =
    binding === 'air' ? room.runtime?.initialAir ?? 255 :
    binding === 'lives' ? 3 :
    binding === 'collectibles' ? 0 :
    binding === 'playerEnergy' ? room.runtime?.playerEnergyInitial ?? 16 :
    binding === 'bossEnergy' ? room.runtime?.bossEnergyInitial ?? 16 :
    0;
  const value = clampByte(widget.initialValue, fallbackValue);
  return normalizeHudText(String(value).padStart(maxChars, '0'), maxChars, allowedCharacters);
}

function normalizeScreen5HudFontGlyph(font: Msx2HudFontAsset | undefined, char: string, fallbackColor: number, fallbackBg = BITMAP_HUD_HEART_COLOR_BG): number[][] | undefined {
  if (font?.vdpMode !== 'SCREEN5') return undefined;
  const backgroundSlot = clampByte(font.screen5BackgroundSlot, fallbackBg) & 0x0f;
  const bitmap = font.bitmapPatterns?.[char] || font.bitmapPatterns?.[' '];
  if (Array.isArray(bitmap)) {
    return Array.from({ length: 8 }, (_unused, y) =>
      Array.from({ length: 8 }, (_unused2, x) => clampByte(bitmap[y]?.[x], backgroundSlot) & 0x0f)
    );
  }
  const pattern = font.patterns?.[char] || DEFAULT_HUD_PATTERNS[char] || DEFAULT_HUD_PATTERNS[' '];
  return Array.from({ length: 8 }, (_unused, y) =>
    Array.from({ length: 8 }, (_unused2, x) =>
      ((Number(pattern[y]) || 0) & (0x80 >> x)) ? (fallbackColor & 0x0f) : backgroundSlot
    )
  );
}

function drawBitmapHudText(
  pixels: number[][],
  text: string,
  x: number,
  y: number,
  font: Msx2HudFontAsset | undefined,
  color: number
): void {
  const patterns = font?.patterns || DEFAULT_HUD_PATTERNS;
  for (const [charIndex, char] of Array.from(text).entries()) {
    const bitmapGlyph = normalizeScreen5HudFontGlyph(font, char, color, 0);
    if (bitmapGlyph) {
      const backgroundSlot = clampByte(font?.screen5BackgroundSlot, 0) & 0x0f;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const glyphColor = bitmapGlyph[row][col] & 0x0f;
          if (glyphColor === backgroundSlot) continue;
          const px = x + (charIndex * 8) + col;
          const py = y + row;
          if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < pixels.length) pixels[py][px] = glyphColor;
        }
      }
      continue;
    }
    const pattern = patterns[char] || patterns[' '] || DEFAULT_HUD_PATTERNS[' '];
    for (let row = 0; row < 8; row++) {
      const bits = Number(pattern[row]) || 0;
      for (let col = 0; col < 8; col++) {
        if (!(bits & (0x80 >> col))) continue;
        const px = x + (charIndex * 8) + col;
        const py = y + row;
        if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < pixels.length) pixels[py][px] = color & 0x0f;
      }
    }
  }
}

function drawBitmapHudAtlasIcon(
  pixels: number[][],
  room: Msx2Screen5BitmapRoom,
  atlasPixels: number[][],
  widget: Msx2HudWidget
): void {
  const entries = room.atlas.entries || [];
  const entry = entries.find(item => item.id === widget.atlasEntryId) || entries[clampByte(widget.iconTileIndex, 0)];
  const x0 = clampInt(widget.x, 0, SCREEN_WIDTH - 1, 0);
  const y0 = clampInt(widget.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 0);
  const width = Math.max(1, Math.min(Number(widget.width) || entry?.w || 8, SCREEN_WIDTH - x0));
  const height = Math.max(1, Math.min(Number(widget.height) || entry?.h || 8, BITMAP_ROOM_HUD_HEIGHT - y0));
  if (!entry) {
    paintRect(pixels, x0, y0, width, height, widget.primaryColor ?? 15);
    return;
  }
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const color = atlasPixels[entry.sy + yy]?.[entry.sx + xx];
      if (color === undefined) continue;
      pixels[y0 + yy][x0 + xx] = color & 0x0f;
    }
  }
}

/**
 * Draws a static icon from a linked Msx2HudAsset's own mini-atlas (`Msx2HudAsset.icons`,
 * authored in the Mideas HUD Editor), used by 'portrait'/'iconCounter' elements and by
 * 'icon' elements when baked as a fallback. Falls back to a solid rect placeholder when
 * no icon is referenced/found, matching `drawBitmapHudAtlasIcon`'s behaviour.
 */
function drawHudAssetIcon(
  pixels: number[][],
  icons: Msx2HudIconEntry[],
  element: Msx2HudElement,
  x0: number,
  y0: number,
  width: number,
  height: number
): void {
  const icon = icons.find(item => item.id === element.atlasEntryId);
  if (!icon) {
    paintRect(pixels, x0, y0, width, height, element.colors.primary ?? 15);
    return;
  }
  for (let yy = 0; yy < height && yy < icon.height; yy++) {
    for (let xx = 0; xx < width && xx < icon.width; xx++) {
      const color = icon.pixels[yy]?.[xx];
      if (color === undefined || color < 0) continue;
      const px = x0 + xx;
      const py = y0 + yy;
      if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < pixels.length) pixels[py][px] = color & 0x0f;
    }
  }
}

// 16x16 heart silhouette (hand-authored). 'X' = a heart pixel.
const HEART_FULL_MASK: string[] = [
  '................',
  '...XX.....XX....',
  '..XXXX...XXXX...',
  '.XXXXXX.XXXXXXX.',
  '.XXXXXXXXXXXXXX.',
  '.XXXXXXXXXXXXXX.',
  '.XXXXXXXXXXXXXX.',
  '.XXXXXXXXXXXXXX.',
  '..XXXXXXXXXXXX..',
  '...XXXXXXXXXX...',
  '....XXXXXXXX....',
  '.....XXXXXX.....',
  '......XXXX......',
  '.......XX.......',
  '................',
  '................',
];

/**
 * Build the HUD heart tile pixels: a 16-row x 32-col framebuffer holding two
 * side-by-side 16x16 tiles — heart_full (cols 0..15) and heart_empty (cols
 * 16..31, the outline of the same shape). Background is the HUD seed color so
 * HMMM copies blend seamlessly into the HUD band. The empty heart is the
 * boundary of the full mask (a filled pixel kept only if any 4-neighbour is
 * empty), giving a hollow outline that reads as a "lost" heart.
 */
function buildBitmapHeartTilePixels(): number[][] {
  const bg = BITMAP_HUD_HEART_COLOR_BG;
  const full = BITMAP_HUD_HEART_COLOR_FULL;
  const empty = BITMAP_HUD_HEART_COLOR_EMPTY;
  const mask = HEART_FULL_MASK.map(row => row.split('').map(ch => ch === 'X'));
  // Full tile (cols 0..15): heart pixels = full color, rest = bg.
  // Empty tile (cols 16..31): outline pixels = empty color, rest = bg.
  const grid: number[][] = Array.from({ length: 16 }, () => Array.from({ length: 32 }, () => bg));
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (mask[y][x]) grid[y][x] = full;
      // outline: a filled cell with at least one empty 4-neighbour
      const neighbourEmpty =
        (x === 0) || (x === 15) || (y === 0) || (y === 15) ||
        !mask[y][x - 1] || !mask[y][x + 1] || !mask[y - 1]?.[x] || !mask[y + 1]?.[x];
      if (mask[y][x] && neighbourEmpty) grid[y][x + 16] = empty;
    }
  }
  return grid;
}

function buildBitmapHudSeedPixels(
  room: Msx2Screen5BitmapRoom,
  atlasPixels: number[][],
  analysis: ProjectAnalysis,
  linkedHudAsset?: Msx2HudAsset,
  playerVitals?: BitmapPlayerVitals
): number[][] {
  const framebuffer = Array.from({ length: BITMAP_ROOM_HUD_HEIGHT }, () => Array.from({ length: SCREEN_WIDTH }, () => 1));
  for (let y = 0; y < BITMAP_ROOM_HUD_HEIGHT - 1; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      framebuffer[y][x] = 1;
    }
  }
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    framebuffer[BITMAP_ROOM_HUD_HEIGHT - 1][x] = 15;
  }
  const hidden = room.runtime?.showHud === false || room.runtime?.hideHud === true;
  if (hidden) return framebuffer;
  const font = getBitmapHudFontAsset(analysis, room, linkedHudAsset);
  const allowedCharacters = font?.characters || DEFAULT_HUD_CHARS;

  if (linkedHudAsset) {
    // Standalone Msx2HudAsset (authored in the Mideas HUD Editor), linked via
    // room.runtime.hudAssetId. Supersedes room.runtime.hudWidgets entirely. Layers
    // are ordered top-of-editor-list = front; render back-to-front (reversed).
    // Runtime-changing widgets are intentionally not duplicated under their
    // dynamic copy. Static icon/portrait art is baked into the HUD seed; it does
    // not need RAM, update routines or offscreen VRAM slots.
    const icons = linkedHudAsset.icons || [];
    for (const layer of [...linkedHudAsset.layers].reverse()) {
      if (!layer.visible) continue;
      if (layer.kind === 'paint') {
        for (let y = 0; y < BITMAP_ROOM_HUD_HEIGHT; y++) {
          for (let x = 0; x < SCREEN_WIDTH; x++) {
            const color = layer.pixels[y]?.[x];
            if (color === undefined || color < 0) continue;
            framebuffer[y][x] = color & 0x0f;
          }
        }
        continue;
      }
      const element = layer.element;
      if (!element.visible) continue;
      const x = clampInt(element.x, 0, SCREEN_WIDTH - 1, 0);
      const y = clampInt(element.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 0);
      const width = clampInt(element.width, 1, SCREEN_WIDTH - x, element.kind === 'bar' ? 64 : 16);
      const height = clampInt(element.height, 1, BITMAP_ROOM_HUD_HEIGHT - y, element.kind === 'bar' ? 6 : 16);
      if (element.kind === 'bar') {
        const maxValue = resolveHudElementMaxValue(element, 16, playerVitals);
        const initialValue = resolveHudElementInitialValue(element, maxValue, playerVitals);
        // Match the dynamic HMMV region (buildBitmapHudLinkedBarAsm): even-aligned
        // full box, empty track + primary fill, NO 1px border. SCREEN 5 HMMV needs
        // byte-aligned DX/NX, so a 1px frame cannot survive the dynamic fill.
        const barX = clampInt(element.x, 0, SCREEN_WIDTH - 2, 8) & ~1;
        const barW = Math.min(254, Math.max(2, clampInt(element.width, 2, SCREEN_WIDTH - barX, 64) & ~1));
        const barY = clampInt(element.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 2);
        const barH = Math.max(1, clampInt(element.height, 1, BITMAP_ROOM_HUD_HEIGHT - barY, 6));
        const fillWidth = (Math.floor((barW * initialValue) / maxValue)) & ~1;
        paintRect(framebuffer, barX, barY, barW, barH, element.colors.empty ?? 4);
        paintRect(framebuffer, barX, barY, fillWidth, barH, element.colors.primary ?? 10);
      } else if (element.kind === 'text') {
        const color = element.colors.text ?? ((font?.colorByte ?? 0xF1) >> 4);
        const maxChars = Math.max(1, Math.min(31, Math.floor(width / 8)));
        drawBitmapHudText(framebuffer, normalizeHudText(element.text || '', maxChars, allowedCharacters), x, y, font, color);
      } else if (element.kind === 'portrait' || element.kind === 'icon' || element.kind === 'iconCounter') {
        drawHudAssetIcon(framebuffer, icons, element, x, y, width, height);
      }
      // 'iconRow' is runtime-dynamic: nothing baked here (see
      // linkedHudDynamicSources in generateUnitedFiles). 'counter' digits and
      // 'iconCounter' digits are also runtime-drawn; only the icon part is baked.
    }
    return framebuffer;
  }

  // Legacy fallback: inline room.runtime.hudWidgets (pre-Msx2HudEditor projects).
  const widgets = room.runtime?.hudWidgets || [];
  for (const widget of widgets) {
    const x = clampInt(widget.x, 0, SCREEN_WIDTH - 1, 0);
    const y = clampInt(widget.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 0);
    const width = clampInt(widget.width, 1, SCREEN_WIDTH - x, widget.kind === 'icon' ? 8 : 64);
    const height = clampInt(widget.height, 1, BITMAP_ROOM_HUD_HEIGHT - y, widget.kind === 'bar' ? 6 : 8);
    if (widget.kind === 'bar') {
      const maxValue = Math.max(1, clampByte(widget.maxValue, 16));
      const initialValue = Math.min(maxValue, clampByte(widget.initialValue, maxValue));
      const fillWidth = Math.max(0, Math.min(width - 2, Math.floor(((width - 2) * initialValue) / maxValue)));
      paintRect(framebuffer, x, y, width, height, widget.borderColor ?? 15);
      paintRect(framebuffer, x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2), widget.emptyColor ?? 4);
      paintRect(framebuffer, x + 1, y + 1, fillWidth, Math.max(0, height - 2), widget.primaryColor ?? 10);
    } else if (widget.kind === 'icon') {
      drawBitmapHudAtlasIcon(framebuffer, room, atlasPixels, { ...widget, width, height });
    } else {
      const color = widget.primaryColor ?? ((font?.colorByte ?? 0xF1) >> 4);
      drawBitmapHudText(framebuffer, getBitmapHudWidgetText(widget, room, allowedCharacters), x, y, font, color);
    }
  }
  return framebuffer;
}

interface CommandRecord {
  op: number;
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  color: number;
}

function buildVdpCommandBlock(record: CommandRecord): number[] {
  const commandByte =
    record.op === OP_COPY_16 ? CMD_COPY_16 :
    record.op === OP_COPY_8 ? CMD_COPY_8 :
    CMD_FILL;
  const color = record.op === OP_FILL || record.op === OP_LINE_H || record.op === OP_LINE_V
    ? ((record.color & 0x0f) << 4) | (record.color & 0x0f)
    : 0;
  // HMMM/HMMV use the SAME pixel coordinate space as LMMM/LMMV on the V9938
  // (verified empirically: dividing by 2 halved the rendered width). X coords
  // should be even (byte-aligned); all our coords are multiples of 16 or 2.
  return [
    record.sx & 0xff,
    (record.sx >> 8) & 0xff,
    record.sy & 0xff,
    (record.sy >> 8) & 0xff,
    record.dx & 0xff,
    (record.dx >> 8) & 0xff,
    record.dy & 0xff,
    (record.dy >> 8) & 0xff,
    record.nx & 0xff,
    (record.nx >> 8) & 0xff,
    record.ny & 0xff,
    (record.ny >> 8) & 0xff,
    color,
    0,
    commandByte,
  ];
}

function commandRecordsToVdpBlocks(records: CommandRecord[]): number[] {
  return records.flatMap(record => buildVdpCommandBlock(record));
}

/** True when a fill command covers the whole screen (the editor's background fill). */
function isFullScreenFillCommand(command: Msx2BitmapRoomCommand): boolean {
  return command.op === 'fill'
    && command.x <= 0
    && command.y <= 0
    && command.x + command.w >= SCREEN_WIDTH
    && command.y + command.h >= SCREEN_HEIGHT_DEFAULT;
}

/**
 * Read a room's 16x12 tile-index map (the authoritative 192-byte screen). Prefers
 * the persisted `tileGrid`; otherwise reconstructs it from the `copy` commands.
 * Each cell holds an atlas-entry reference (index+1; 0 = empty/background).
 */
function buildRoomTileIndexGrid(room: Msx2Screen5BitmapRoom): number[][] {
  const entries = room.atlas?.entries || [];
  const grid = Array.from({ length: COLLISION_ROWS }, () => Array.from({ length: COLLISION_COLS }, () => 0));
  if (Array.isArray(room.tileGrid)) {
    for (let y = 0; y < COLLISION_ROWS; y++) {
      for (let x = 0; x < COLLISION_COLS; x++) {
        const value = Math.max(0, Math.trunc(Number(room.tileGrid[y]?.[x]) || 0));
        grid[y][x] = value > 0 && value - 1 < entries.length ? value : 0;
      }
    }
    return grid;
  }
  const idToIndex = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const command of room.composition?.commands || []) {
    if (command.op !== 'copy') continue;
    const index = idToIndex.get(command.atlasEntryId);
    if (index === undefined) continue;
    const cx = Math.floor(command.dx / TILE_GRID_SIZE);
    const cy = Math.floor(command.dy / TILE_GRID_SIZE);
    if (cx >= 0 && cx < COLLISION_COLS && cy >= 0 && cy < COLLISION_ROWS) grid[cy][cx] = index + 1;
  }
  return grid;
}

/**
 * World-engine room render program: a list of V9938 command blocks the runtime
 * replays to (re)build one room's visible game band from the shared tileset that
 * already sits in offscreen VRAM. Block 0 clears the game band to the background
 * color; authored fills/lines come next; then one 16x16 VRAM->VRAM copy per
 * occupied cell of the 192-byte tile map (the authoritative screen). Every
 * destination Y is shifted by the HUD band so logical room coords (0..191) land
 * below the persistent HUD. Returns the flattened 15-byte blocks and their count.
 */
function buildRoomRenderBlocks(room: Msx2Screen5BitmapRoom, pageBaseY = BITMAP_ROOM_PAGE0_BASE_Y): { bytes: number[]; count: number } {
  const backgroundColor = clampByte(room.backgroundColor, 0) & 0x0f;
  const offscreenBaseY = BITMAP_ROOM_ATLAS_BASE_Y;
  const entries = room.atlas?.entries || [];
  const records: CommandRecord[] = [
    { op: OP_FILL, sx: 0, sy: 0, dx: 0, dy: pageBaseY + BITMAP_ROOM_GAME_Y_OFFSET, nx: SCREEN_WIDTH, ny: SCREEN_HEIGHT_DEFAULT, color: backgroundColor },
  ];
  // Authored color fills/lines (skip the full-screen background fill; the clear above covers it).
  for (const command of room.composition?.commands || []) {
    if (command.op === 'fill') {
      if (isFullScreenFillCommand(command)) continue;
      records.push({ op: OP_FILL, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: pageBaseY + clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: clampInt(command.w, 1, 256, 1), ny: clampInt(command.h, 1, 256, 1), color: clampByte(command.color, 0) & 0x0f });
    } else if (command.op === 'lineH') {
      records.push({ op: OP_LINE_H, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: pageBaseY + clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: clampInt(command.length, 1, 256, 1), ny: 1, color: clampByte(command.color, 0) & 0x0f });
    } else if (command.op === 'lineV') {
      records.push({ op: OP_LINE_V, sx: 0, sy: 0, dx: clampInt(command.x, 0, 255, 0), dy: pageBaseY + clampInt(command.y, 0, 511, 0) + BITMAP_ROOM_GAME_Y_OFFSET, nx: 1, ny: clampInt(command.length, 1, 256, 1), color: clampByte(command.color, 0) & 0x0f });
    }
  }
  // Tile copies from the authoritative 192-byte map.
  const grid = buildRoomTileIndexGrid(room);
  for (let y = 0; y < COLLISION_ROWS; y++) {
    for (let x = 0; x < COLLISION_COLS; x++) {
      const value = grid[y][x];
      if (!value) continue;
      const entry = entries[value - 1];
      if (!entry) continue;
      records.push({
        op: OP_COPY_16,
        sx: clampInt(entry.sx, 0, 255, 0),
        sy: clampInt(entry.sy, 0, 511, 0) + offscreenBaseY,
        dx: x * TILE_GRID_SIZE,
        dy: pageBaseY + y * TILE_GRID_SIZE + BITMAP_ROOM_GAME_Y_OFFSET,
        nx: TILE_GRID_SIZE,
        ny: TILE_GRID_SIZE,
        color: 0,
      });
    }
  }
  // NPC visuals: an atlas metatile baked into the render program at the NPC's
  // cell, so it draws on room entry AND on the dialogue-close repaint for free.
  for (const entity of room.entities || []) {
    if (entity.kind !== 'npc') continue;
    const npcParams = entity.params?.npcDialogue as { atlasEntryId?: string } | undefined;
    if (!npcParams?.atlasEntryId) continue;
    const entry = entries.find(item => item.id === npcParams.atlasEntryId);
    if (!entry) continue;
    const dx = clampInt((entity.position?.x ?? 0) * TILE_GRID_SIZE, 0, SCREEN_WIDTH - 1, 0);
    const dy = clampInt((entity.position?.y ?? 0) * TILE_GRID_SIZE, 0, SCREEN_HEIGHT_DEFAULT - 1, 0);
    const w = clampInt(entry.w, 1, 256, TILE_GRID_SIZE);
    const h = clampInt(entry.h, 1, SCREEN_HEIGHT_DEFAULT, TILE_GRID_SIZE);
    records.push({
      op: OP_COPY_16,
      sx: clampInt(entry.sx, 0, 255, 0),
      sy: clampInt(entry.sy, 0, 511, 0) + offscreenBaseY,
      dx,
      dy: pageBaseY + dy + BITMAP_ROOM_GAME_Y_OFFSET,
      nx: Math.max(1, Math.min(w, SCREEN_WIDTH - dx)),
      ny: Math.max(1, Math.min(h, SCREEN_HEIGHT_DEFAULT - dy)),
      color: 0,
    });
  }
  return { bytes: commandRecordsToVdpBlocks(records), count: records.length };
}

function formatBytes(label: string, bytes: number[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatDbExpressions(label: string, values: string[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < values.length; offset += 16) {
    lines.push(`    DB ${values.slice(offset, offset + 16).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

interface RleChunk {
  label: string;
  vramOffset: number;
  rawLength: number;
  bytes: number[];
  dataBank?: number;
}

function rleEncodeBytes(bytes: number[]): number[] {
  const encoded: number[] = [];
  for (let offset = 0; offset < bytes.length;) {
    const value = bytes[offset] & 0xff;
    let count = 1;
    offset++;
    while (offset < bytes.length && (bytes[offset] & 0xff) === value && count < 255) {
      count++;
      offset++;
    }
    encoded.push(count, value);
  }
  return encoded;
}

function buildRleChunksForVram(bytes: number[], vramBaseOffset: number, labelPrefix: string): RleChunk[] {
  const chunks: RleChunk[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const absoluteVramOffset = vramBaseOffset + offset;
    const remainingInBank = VRAM_BANK_BYTES - (absoluteVramOffset % VRAM_BANK_BYTES);
    const rawLength = Math.min(remainingInBank, bytes.length - offset);
    const raw = bytes.slice(offset, offset + rawLength);

    let rawOffset = 0;
    let chunkStartRawOffset = 0;
    let chunkBytes: number[] = [];
    let chunkRawLength = 0;
    const flushChunk = () => {
      if (!chunkBytes.length) return;
      chunks.push({
        label: `${labelPrefix}_${chunks.length}`,
        vramOffset: absoluteVramOffset + chunkStartRawOffset,
        rawLength: chunkRawLength,
        bytes: chunkBytes,
      });
      chunkStartRawOffset = rawOffset;
      chunkBytes = [];
      chunkRawLength = 0;
    };

    while (rawOffset < raw.length) {
      const value = raw[rawOffset] & 0xff;
      let count = 1;
      rawOffset++;
      while (rawOffset < raw.length && (raw[rawOffset] & 0xff) === value && count < 255) {
        count++;
        rawOffset++;
      }
      if (chunkBytes.length + 2 > RLE_ROM_CHUNK_MAX_BYTES) {
        rawOffset -= count;
        flushChunk();
        continue;
      }
      chunkBytes.push(count, value);
      chunkRawLength += count;
    }
    flushChunk();
    offset += rawLength;
  }
  return chunks;
}

function buildRleUploadAsm(rleChunks: RleChunk[], banked: boolean): string {
  const lines: string[] = [];
  for (const chunk of rleChunks) {
    if (banked) {
      lines.push(`    ld a, ${chunk.label}_DATA_BANK`);
      lines.push(`    call bitmap_room_select_data_bank_a`);
    }
    lines.push(`    ld hl, ${chunk.label}`);
    lines.push(`    ld a, ${Math.floor(chunk.vramOffset / VRAM_BANK_BYTES)}`);
    lines.push(`    ld de, ${hexWord(chunk.vramOffset % VRAM_BANK_BYTES)}`);
    lines.push(`    ld bc, ${chunk.label}_end - ${chunk.label}`);
    lines.push(`    call decompress_bitmap_rle_to_vram`);
  }
  if (banked) {
    lines.push(`    call bitmap_room_restore_resident_banks`);
  }
  lines.push(`    ret`);
  return lines.join('\n');
}

interface BankedDataBlock {
  label: string;
  bytes: number[];
  description: string;
}

interface PackedDataBank {
  bank: number;
  used: number;
  blocks: BankedDataBlock[];
}

function buildBankedRleDataBlocks(chunks: RleChunk[], description: string): BankedDataBlock[] {
  return chunks.map(chunk => ({
    label: chunk.label,
    bytes: chunk.bytes,
    description: `${description}; VRAM ${hexVram(chunk.vramOffset)}, raw ${chunk.rawLength} bytes, RLE ${chunk.bytes.length} bytes`,
  }));
}

function packBitmapRoomDataBanks(blocks: BankedDataBlock[]): PackedDataBank[] {
  const banks: PackedDataBank[] = [];
  let current: PackedDataBank | undefined;
  for (const block of blocks) {
    if (block.bytes.length > ROM_DATA_BANK_BYTES) {
      throw new Error(`Bitmap-room data block ${block.label} is ${block.bytes.length} bytes and exceeds one 8KB MegaROM bank`);
    }
    if (!current || current.used + block.bytes.length > ROM_DATA_BANK_BYTES) {
      current = {
        bank: BITMAP_ROOM_MEGAROM_FIRST_DATA_BANK + banks.length,
        used: 0,
        blocks: [],
      };
      banks.push(current);
    }
    current.blocks.push(block);
    current.used += block.bytes.length;
  }
  return banks;
}

function assignDataBankConstants(banks: PackedDataBank[], chunks: RleChunk[]): void {
  const chunkByLabel = new Map(chunks.map(chunk => [chunk.label, chunk]));
  for (const bank of banks) {
    for (const block of bank.blocks) {
      const chunk = chunkByLabel.get(block.label);
      if (chunk) chunk.dataBank = bank.bank;
    }
  }
}

function formatBankedDataEquates(banks: PackedDataBank[]): string {
  const lines: string[] = [];
  for (const bank of banks) {
    for (const block of bank.blocks) {
      lines.push(`${block.label}_DATA_BANK EQU ${bank.bank}`);
    }
  }
  return lines.length ? `${lines.join('\n')}\n` : '';
}

function formatBankedDataBanks(banks: PackedDataBank[]): string {
  if (!banks.length) return '';
  const lines: string[] = ['; --- SCREEN 5 bitmap-room Konami MegaROM data banks ---'];
  for (const bank of banks) {
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_PHYS_START:`);
    lines.push(`    org #8000`);
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_ROM_START:`);
    for (const block of bank.blocks) {
      lines.push(`; ${block.description}`);
      lines.push(`${block.label}:`);
      for (let offset = 0; offset < block.bytes.length; offset += 16) {
        lines.push(`    DB ${block.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
      }
      lines.push(`${block.label}_end:`);
      lines.push('');
    }
    lines.push(`BITMAP_ROOM_DATA_BANK_${bank.bank}_USED_END:`);
    lines.push(`    ds ${ROM_DATA_BANK_BYTES - bank.used}, #FF`);
    lines.push(`    org BITMAP_ROOM_DATA_BANK_${bank.bank}_PHYS_START + #2000`);
    lines.push('');
  }
  return lines.join('\n');
}

function formatRleChunks(chunks: RleChunk[], rawByteCount: number, description: string): string {
  const encodedByteCount = chunks.reduce((total, chunk) => total + chunk.bytes.length, 0);
  const lines: string[] = [
    `; ${description}`,
    `; Raw bytes: ${rawByteCount}; encoded bytes: ${encodedByteCount}`,
  ];
  for (const chunk of chunks) {
    lines.push(`; VRAM ${hexVram(chunk.vramOffset)}, raw ${chunk.rawLength} bytes, RLE ${chunk.bytes.length} bytes`);
    lines.push(`${chunk.label}:`);
    for (let offset = 0; offset < chunk.bytes.length; offset += 16) {
      lines.push(`    DB ${chunk.bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
    }
    lines.push(`${chunk.label}_end:`);
  }
  lines.push('');
  return lines.join('\n');
}

function buildPaletteBytes(palette: Screen5PaletteSlot[]): number[] {
  return Array.from({ length: 16 }, (_unused, slotIndex) => {
    const slot = palette.find(item => item?.slotIndex === slotIndex) || palette[slotIndex];
    const masterIndex = Number(slot?.masterIndex);
    if (!Number.isFinite(masterIndex) || masterIndex < 0) return [0, 0];
    const index = Math.max(0, Math.min(511, Math.trunc(masterIndex)));
    const r = (index >> 6) & 0x07;
    const g = (index >> 3) & 0x07;
    const b = index & 0x07;
    return [(r << 4) | b, g];
  }).flat();
}

function resolveWorldPalette(analysis: ProjectAnalysis, paletteAssetId: string | undefined, fallback: Screen5PaletteSlot[]): Screen5PaletteSlot[] {
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  const paletteAsset = assets.find(asset => asset.id === paletteAssetId && asset.type === 'palette')?.data as PaletteAsset | undefined;
  if ((paletteAsset?.mode === 'SCREEN4' || paletteAsset?.mode === 'SCREEN5') && paletteAsset.slots?.length === 16) {
    return paletteAsset.slots.map(slot => ({ ...slot }));
  }
  return fallback;
}

function multiplyABySmallConstantAsm(multiplier: number): string {
  if (multiplier <= 1) return '';
  if (multiplier === 2) return '    add a, a\n';
  if (multiplier === 4) return '    add a, a\n    add a, a\n';
  if (multiplier === 8) return '    add a, a\n    add a, a\n    add a, a\n';
  return `    push bc
    ld b, a
    xor a
${Array.from({ length: multiplier }, () => '    add a, b\n').join('')}    pop bc
`;
}

function buildRuntimeAsm(
  room: Msx2Screen5BitmapRoom,
  rleChunks: RleChunk[],
  hudSeedRleChunks: RleChunk[],
  playerAnimation: { frameCount: number; delayFrames: number; mirror: boolean; authoredFacing?: 'left' | 'right'; layerCount: number; spriteOffsets: BitmapSpriteSlotOffset[]; totalFrameCount?: number; hasStateAnimations?: boolean },
  options: { bankedRle: boolean },
  playerPhysics: BitmapPlayerPhysics,
  playerHitbox: BitmapPlayerHitbox,
  skillHooks: { inputGateAsm?: string; horizontalHookAsm?: string; gravityHookAsm?: string; landClearAsm?: string; leaveGroundAsm?: string } = {},
  foreground: { count: number; patternGroupBase: number; satBase: number; colorBase: number; loadCallAsm: string } | null = null,
  enableBlink: boolean = false,
  enableKeyDoorTransitions: boolean = false,
  doorVisualPendingPageCallAsm: string = '',
): string {
  // When foreground tiles exist, the player SAT/colour tables move past the
  // foreground slots so the player renders behind them. With no foreground these
  // default to the legacy #F600/#F400 bases (bit-identical output).
  const playerSatBaseWord = foreground ? hexWord(foreground.satBase) : '#F600';
  const playerColorBaseWord = foreground ? hexWord(foreground.colorBase) : '#F400';
  // Player body collision box (Player Config) -> solid-probe edges/offsets. The
  // leading edge is probed along the perpendicular axis at every <=16px step so a
  // body taller/wider than one 16px collision cell cannot tunnel through a cell.
  const hbLeft = playerHitbox.x;
  const hbRight = playerHitbox.x + playerHitbox.w - 1;
  const hbTop = playerHitbox.y;
  const hbBottom = playerHitbox.y + playerHitbox.h - 1;
  const probeRowOffsets: number[] = [];
  for (let row = hbTop; row < hbBottom; row += 16) probeRowOffsets.push(row);
  probeRowOffsets.push(hbBottom);
  const probeColOffsets: number[] = [];
  for (let col = hbLeft; col < hbRight; col += 16) probeColOffsets.push(col);
  probeColOffsets.push(hbRight);
  // Vertical room-edge thresholds scale with the body hitbox so a tall sprite
  // (e.g. 16x32, two stacked hardware sprites) can still fall through a gap
  // into the room below. bitmap_probe_solid treats Y >= 192 as solid, so the
  // feet leading edge (player_y + hbBottom) gets blocked at the screen bottom;
  // the south transition must fire just before that point. These reproduce the
  // legacy 175/174 for a 16px body (hbBottom = 15) and lower the threshold for
  // taller bodies (159/158 for a 32px body).
  const southEdgeThreshold = 190 - hbBottom;
  const bottomEntryY = southEdgeThreshold - 1;
  // `add a, n` only when n > 0 (keeps the n=0 path byte-identical to the legacy code).
  const addAImmediate = (offset: number) => (offset > 0 ? `    add a, ${offset}\n` : '');
  const atlasVramBase = BITMAP_ROOM_ATLAS_BASE_Y * ROW_BYTES;
  // Single backdrop color (R#7): background fill, transparency (color 0) and franjas share it.
  const backdropColor = clampByte(room.backgroundColor, 0) & 0x0f;
  const hudSeedUploadAsm = buildRleUploadAsm(hudSeedRleChunks, options.bankedRle);
  const tilesetUploadAsm = buildRleUploadAsm(rleChunks, options.bankedRle);
  // Per-state animations (separate sprite per state) append extra frame banks
  // after the base frames; totalFrames covers base + every state clip. When no
  // state animations exist, totalFrames === frameCount and hasStateAnim is false,
  // so every derived value below is identical to the legacy path (byte-equal ROM).
  const hasStateAnim = !!playerAnimation.hasStateAnimations;
  const totalFrames = playerAnimation.totalFrameCount ?? playerAnimation.frameCount;
  const shouldEmitPlayerPatternUpdate = totalFrames > 1 || playerAnimation.mirror || hasStateAnim;
  const playerPatternFrameStride = Math.max(4, playerAnimation.layerCount * 4);
  const playerPatternFrameStrideAsm = multiplyABySmallConstantAsm(playerPatternFrameStride);
  // Per-frame sprite colour table: one 16-line colour table per hardware layer.
  // The runtime re-uploads the current frame's colours so CC/OR multi-colour
  // rows (which differ between frames) render correctly past frame 0.
  const colorFrameStride = playerAnimation.layerCount * 16;
  const shouldEmitPlayerColorUpdate = totalFrames > 1 || hasStateAnim;
  // Mirror patterns sit after ALL base + state frames in the combined bank.
  const mirrorPatternOffset = totalFrames * playerPatternFrameStride;
  // The pattern/colour frame index source: with state animations the routine
  // resolves an absolute frame (clip base + intra-clip frame); otherwise the
  // legacy logical frame is used directly.
  const animFrameSource = hasStateAnim ? 'player_anim_abs_frame' : 'player_anim_frame';
  const mirrorSelectionAsm = playerAnimation.mirror && playerAnimation.authoredFacing === 'right'
    ? `    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp nz, .store_player_pattern
    add a, ${mirrorPatternOffset}
`
    : playerAnimation.mirror && playerAnimation.authoredFacing === 'left'
      ? `    ld b, a
    ld a, (player_facing)
    or a
    ld a, b
    jp z, .store_player_pattern
    add a, ${mirrorPatternOffset}
`
      : '';
  const playerAnimationAsm = shouldEmitPlayerPatternUpdate ? `
; ------------------------------------------------------------
; FUNCTION: bitmap_update_player_sprite_animation
; ------------------------------------------------------------
; PURPOSE:
;   Advance the SCREEN 5 bitmap-room player hardware sprite frame and update
;   the SAT pattern index used by bitmap_update_sprite_sat.
;
; INPUT:
;   player_anim_counter = frame-delay counter.
;   player_anim_frame   = current logical animation frame.
;   player_moving       = 1 when horizontal input moved the player this frame.
;
; OUTPUT:
;   player_pat updated to the V9938 16x16 pattern group for the current frame.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads player_moving and writes player_anim_counter, player_anim_frame and
;   player_pat in RAM.
;
; NOTES:
;   V9938 16x16 sprites consume four 8x8 patterns per hardware layer, so the
;   SAT base pattern advances by frame * ${playerPatternFrameStride}. Stack is
;   used only when the generated stride helper must preserve BC.
; ------------------------------------------------------------
bitmap_update_player_sprite_animation:
${hasStateAnim ? `    ; State-driven: player_anim_state selects a clip (frameBase,count,delay) from
    ; bitmap_player_anim_clip_table. State 0 = base idle/walk (pins to frame 0 when
    ; idle); every other state cycles its own clip. Clobbers AF/BC/DE/HL.
    ld a, (player_anim_state)
    ld b, a
    ld a, (player_anim_state_prev)
    cp b
    jp z, .anim_same_state
    ld a, b
    ld (player_anim_state_prev), a
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
.anim_same_state:
    ld hl, bitmap_player_anim_clip_table
    ld a, b
    add a, a
    add a, b                 ; A = state * 3
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    ld (player_anim_clip_base), a
    inc hl
    ld a, (hl)
    ld (player_anim_clip_count), a
    inc hl
    ld a, (hl)
    ld (player_anim_clip_delay), a
    ld a, b
    or a                     ; base state (0) pins to idle frame 0 while not moving
    jp nz, .anim_cycle
    ld a, (player_moving)
    or a
    jp nz, .anim_cycle
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    jp .anim_set_abs
.anim_cycle:
    ld a, (player_anim_clip_delay)
    ld b, a
    ld a, (player_anim_counter)
    inc a
    cp b
    jp nc, .anim_advance
    ld (player_anim_counter), a
    jp .anim_set_abs
.anim_advance:
    xor a
    ld (player_anim_counter), a
    ld a, (player_anim_clip_count)
    ld b, a
    ld a, (player_anim_frame)
    inc a
    cp b
    jp nc, .anim_wrap
    ld (player_anim_frame), a
    jp .anim_set_abs
.anim_wrap:
    xor a
    ld (player_anim_frame), a
.anim_set_abs:
    ld a, (player_anim_clip_base)
    ld b, a
    ld a, (player_anim_frame)
    add a, b
    ld (player_anim_abs_frame), a
` : `${playerAnimation.frameCount > 1 ? `    ld a, (player_moving)
    or a
    jp nz, .player_anim_active
    xor a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    jp .refresh_player_pattern
.player_anim_active:
    ld a, (player_anim_counter)
    inc a
    cp ${playerAnimation.delayFrames}
    jp nc, .advance_player_anim_frame
    ld (player_anim_counter), a
    jp .refresh_player_pattern
.advance_player_anim_frame:
    xor a
    ld (player_anim_counter), a
    ld a, (player_anim_frame)
    inc a
    cp ${playerAnimation.frameCount}
    jp c, .store_player_anim_frame
    xor a
.store_player_anim_frame:
    ld (player_anim_frame), a
` : ''}`}.refresh_player_pattern:
    ld a, (${animFrameSource})
${playerPatternFrameStrideAsm}
${mirrorSelectionAsm}.store_player_pattern:
    ld (player_pat), a
    ret
` : '';
  const playerColorsAsm = shouldEmitPlayerColorUpdate ? `
; ------------------------------------------------------------
; FUNCTION: fast_copy_to_vram_ext
; ------------------------------------------------------------
; PURPOSE:
;   Fast RAM->VRAM block copy of up to 256 bytes with OTIR (~21 cyc/byte vs the
;   ~48 cyc/byte of copy_to_vram_ext's byte loop). For per-frame VRAM work the
;   main loop does right after bitmap_wait_vblank, when VRAM is idle (no display
;   fetch), so the faster write rate is safe and leaves CPU budget for PT3/enemies.
;
; INPUT:
;   HL = source RAM pointer.
;   DE = destination VRAM address (full 16-bit).
;   B  = byte count (1..256; 0 means 256).
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_write_register.
;
; SIDE EFFECTS:
;   Writes B bytes to VRAM, restores R#14 = 0 (bitmap_wait_vblank reads S#0).
;   Does not select a status register (R#15 untouched).
; ------------------------------------------------------------
fast_copy_to_vram_ext:
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
    ld c, ${VDP_DATA_PORT}
    otir
    xor a
    ld e, a
    ld a, #0E
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_upload_player_frame_colors
; ------------------------------------------------------------
; PURPOSE:
;   Re-upload the player's per-line sprite colour table for the CURRENT
;   animation frame to the V9938 sprite colour table (#F400), but ONLY when the
;   frame changed. Each frame has its own colour table because CC/OR multi-colour
;   rows differ between frames; the SAT only swaps the pattern index, so without
;   this, frames > 0 render with frame 0's colours (white/garbage lines).
;
; INPUT:
;   player_anim_frame    = current logical frame (0..${playerAnimation.frameCount - 1}).
;   player_colors_loaded = frame whose colours are currently in VRAM.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF (always); BC, DE, HL only when a frame change triggers the upload.
;
; PRESERVES:
;   IX, IY. Returns after touching only AF when the frame is unchanged, so the
;   common case (most frames) costs ~7 instructions, not a VRAM copy.
;
; CALLS:
;   fast_copy_to_vram_ext (only on a frame change).
;
; SIDE EFFECTS:
;   On a frame change: writes ${colorFrameStride} bytes (${playerAnimation.layerCount} layer(s) x 16 lines)
;   to VRAM #F400 and updates player_colors_loaded.
;
; NOTES:
;   Source = bitmap_room_sprite_colors + player_anim_frame * ${colorFrameStride}.
;   Mirror frames reuse the same colours (a horizontal flip keeps line colours),
;   so the logical frame indexes the table directly. Self-correcting: any stale
;   player_colors_loaded just forces one upload on the first differing frame.
; ------------------------------------------------------------
bitmap_upload_player_frame_colors:
    ld a, (${animFrameSource})
    ld c, a
    ld a, (player_colors_loaded)
    cp c
    ret z
    ld a, c
    ld (player_colors_loaded), a
    ld hl, bitmap_room_sprite_colors
    or a
    jp z, .upload_frame_colors
    ld de, ${colorFrameStride}
.add_frame_color_offset:
    add hl, de
    dec a
    jp nz, .add_frame_color_offset
.upload_frame_colors:
    ld de, ${playerColorBaseWord}
    ld b, ${colorFrameStride}
    jp fast_copy_to_vram_ext
` : '';

  return `
; --- V9938 bitmap SCREEN 4 runtime (Vampire Killer style) ---

; ------------------------------------------------------------
; FUNCTION: init_plain32k_page2_slot
; ------------------------------------------------------------
; PURPOSE:
;   Mirror the cartridge primary slot from page 1 (#4000-#7FFF) into page 2
;   (#8000-#BFFF) so plain 32KB ROM data can be read linearly.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Updates the primary slot select register at PPI port #A8 for page 2.
;
; NOTES:
;   Bitmap rooms can place RLE source data above #8000 once tile variety grows.
;   Without this setup the second ROM page may still point at RAM/BIOS, causing
;   the decoder to feed #FF bytes into VRAM after the first visible render.
; ------------------------------------------------------------
init_plain32k_page2_slot:
    in a, (PPI_A)
    ld b, a
    and #0C                  ; keep page 1 primary slot bits
    rlca
    rlca                     ; move page 1 bits into page 2 position
    ld c, a
    ld a, b
    and #CF                  ; clear page 2 primary slot bits
    or c
    out (PPI_A), a
    ret

; ------------------------------------------------------------
; FUNCTION: map_page2_to_cart_primary
; ------------------------------------------------------------
; PURPOSE:
;   Map #8000-#BFFF to the same cartridge slot currently used by #4000-#7FFF.
;
; INPUT:
;   Current ROM is executing from the cartridge slot in page 1 (#4000).
;
; OUTPUT:
;   Page 2 (#8000-#BFFF) is switched to the cartridge slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   RSLREG, get_cart_slot_value, ENASLT.
;
; SIDE EFFECTS:
;   Changes the active slot for #8000-#BFFF.
;
; NOTES:
;   Required before Konami mapper writes. Without this, ld (#8000),A writes RAM
;   instead of the cartridge mapper register on machines where page 2 still
;   points to RAM after boot. Stack use is only the BIOS CALL/RET nesting.
; ------------------------------------------------------------
map_page2_to_cart_primary:
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

; ------------------------------------------------------------
; FUNCTION: get_cart_slot_value
; ------------------------------------------------------------
; PURPOSE:
;   Convert primary slot bits into the ENASLT slot descriptor, including
;   expanded-slot secondary bits when the cartridge slot is expanded.
;
; INPUT:
;   A bits 0-1 = primary slot id for the cartridge page.
;
; OUTPUT:
;   A = ENASLT slot descriptor for the same slot.
;
; DESTROYS:
;   AF, BC, HL.
;
; PRESERVES:
;   DE, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Reads BIOS expanded slot table at #FCC1.
;
; NOTES:
;   Mirrors the SCREEN 4 MegaROM slot setup. PUSH/POP are not used.
; ------------------------------------------------------------
get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jp z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

; ------------------------------------------------------------
; FUNCTION: init_konami8k_fixed_bank0_banks
; ------------------------------------------------------------
; PURPOSE:
;   Initialize a Konami 8KB MegaROM with bank 0 fixed at #4000 and the
;   resident startup banks mapped in #6000/#8000/#A000.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Writes Konami mapper registers #6000, #8000 and #A000.
;
; NOTES:
;   Stack is not used here. Bank 0 remains fixed by the cartridge mapper.
; ------------------------------------------------------------
init_konami8k_fixed_bank0_banks:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p1
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #6000-#7FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #6000.
;
; NOTES:
;   No PUSH/POP. LD (nn),A does not modify flags.
; ------------------------------------------------------------
mapper_set_bank_p1:
    ld (#6000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p2
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #8000-#9FFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #8000.
;
; NOTES:
;   P2 is the bitmap-room data read window for banked RLE sources.
; ------------------------------------------------------------
mapper_set_bank_p2:
    ld (#8000), a
    ret

; ------------------------------------------------------------
; FUNCTION: mapper_set_bank_p3
; ------------------------------------------------------------
; PURPOSE:
;   Select the physical Konami 8KB bank visible at #A000-#BFFF.
;
; INPUT:
;   A = physical bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes Konami mapper register #A000.
;
; NOTES:
;   Present for symmetry with the fixed-bank0 SCREEN 4 MegaROM runtime.
; ------------------------------------------------------------
mapper_set_bank_p3:
    ld (#A000), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_room_select_data_bank_a
; ------------------------------------------------------------
; PURPOSE:
;   Map one bitmap-room data bank into the P2 #8000 read window.
;
; INPUT:
;   A = physical data bank number.
;
; OUTPUT:
;   A unchanged.
;
; DESTROYS:
;   None.
;
; PRESERVES:
;   AF, BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2.
;
; SIDE EFFECTS:
;   Changes which ROM bank is readable at #8000-#9FFF.
;
; NOTES:
;   Call this before loading HL with a banked data label. Stack is not used.
; ------------------------------------------------------------
bitmap_room_select_data_bank_a:
    jp mapper_set_bank_p2

; ------------------------------------------------------------
; FUNCTION: bitmap_room_restore_resident_banks
; ------------------------------------------------------------
; PURPOSE:
;   Restore the resident physical banks after banked resource uploads.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF.
;
; PRESERVES:
;   BC, DE, HL, IX, IY.
;
; CALLS:
;   mapper_set_bank_p2, mapper_set_bank_p3.
;
; SIDE EFFECTS:
;   Restores P2=#8000 to physical bank 2 and P3=#A000 to physical bank 3.
;
; NOTES:
;   Keeps gameplay reads from resident tables deterministic after loading
;   large SCREEN 5 bitmap RLE resources. Stack is not used.
; ------------------------------------------------------------
bitmap_room_restore_resident_banks:
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    jp mapper_set_bank_p3

vdp_write_register:
    ; A=register, E=value. Preserves BC, clobbers AF.
    push bc
    ld b, a
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, b
    or #80
    out (${VDP_CTRL_PORT}), a
    pop bc
    ret

; ------------------------------------------------------------
; FUNCTION: copy_to_vram_ext
; ------------------------------------------------------------
; PURPOSE:
;   Copy one contiguous CPU memory block to an absolute V9938 VRAM address.
;
; INPUT:
;   HL = ROM/RAM source pointer.
;   DE = absolute VRAM destination address.
;   BC = byte count. Must not be zero.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes VRAM through VDP ports #99/#98 and leaves R#14 reset to zero.
;
; NOTES:
;   The V9938 data-port auto-increment is only trusted inside the current
;   16KB VRAM bank. Callers that copy more than one bank must split the copy.
; ------------------------------------------------------------
copy_to_vram_ext:
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
.copy_loop:
    ld a, (hl)
    out (${VDP_DATA_PORT}), a
    inc hl
    dec bc
    ld a, b
    or c
    jp nz, .copy_loop
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret

; ------------------------------------------------------------
; FUNCTION: decompress_bitmap_rle_to_vram
; ------------------------------------------------------------
; PURPOSE:
;   Expand count/value RLE bytes from ROM to one absolute V9938 VRAM bank.
;
; INPUT:
;   HL = RLE source pointer. Format is repeated count,value pairs.
;   A  = 16KB VRAM bank number (VRAM address >> 14).
;   DE = VRAM destination address inside that bank (address & #3FFF).
;   BC = encoded byte count. Must be even and non-zero.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes expanded bytes to VRAM through VDP ports #99/#98.
;
; NOTES:
;   Each call must target data that stays inside one 16KB VRAM bank. The
;   generator splits data on bank boundaries. Passing A separately allows
;   uploading the page-2 atlas at VRAM #10000, which cannot fit in a Z80
;   16-bit DE register.
; ------------------------------------------------------------
decompress_bitmap_rle_to_vram:
    push de
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
.rle_loop:
    ld a, b
    or c
    jp z, .rle_done
    ld a, (hl)
    inc hl
    dec bc
    ld d, a
    ld a, (hl)
    inc hl
    dec bc
.emit_loop:
    out (${VDP_DATA_PORT}), a
    dec d
    jp nz, .emit_loop
    jp .rle_loop
.rle_done:
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret

vdp_reinit_cmd_pointer:
    ; Point indirect writes at R#32 with auto-increment. Clobbers AF.
    ld a, #20
    ld e, a
    ld a, #11
    jp vdp_write_register

read_vdp_status_2:
    ; Returns S#2 in A. Clobbers AF.
    ld a, #02
    out (${VDP_CTRL_PORT}), a
    ld a, #8F
    out (${VDP_CTRL_PORT}), a
    in a, (${VDP_CTRL_PORT})
    ret

vdp_wait_cmd_ready:
    ; Wait while CE (bit 0) is set. Clobbers AF.
.wait_loop:
    call read_vdp_status_2
    bit 0, a
    jp nz, .wait_loop
    ret

init_screen5_bitmap_vdp:
    ; This backend composes 4bpp bitmap pages with V9938 commands (128 bytes per
    ; 256px row), so the actual VDP mode must be SCREEN 5/Graphic 4. The editor
    ; route is still named SCREEN 4 bitmap-room while this branch is bifurcated.
    ld a, #05
    call CHGMOD
    ; Enable 16x16 hardware sprites (R#1 bit1 = SI). CHGMOD 5 leaves R#1=#60 (8x8),
    ; which would render only the top-left 8x8 quadrant of the 16x16 player pattern.
    ld a, #01
    ld e, #62
    call vdp_write_register
    ; Start on SCREEN 5 page 0. Transitions compose on the hidden page and flip
    ; this register in commit_room_flip.
    ld a, #02
    ld e, #${BITMAP_ROOM_PAGE0_R2.toString(16).toUpperCase().padStart(2, '0')}
    call vdp_write_register
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ld a, #05
    ld e, #EF
    call vdp_write_register
    ld a, #06
    ld e, #1F
    call vdp_write_register
    ld a, #0B
    ld e, #01
    call vdp_write_register
    ; 212-line display (R#9 LN=1) so the 20px HUD + 192px game band fill the screen
    ; with no leftover scanlines at the bottom.
    ld a, #09
    ld e, #80
    call vdp_write_register
    ; Point indirect writes at command register R#32.
    ld a, #11
    ld e, #20
    call vdp_write_register
    ; Backdrop color (R#7) = background color. In SCREEN 5 this paints the outer "franjas"
    ; AND every color-0 (transparent) bitmap pixel, so background/transparency/border match.
    ld a, #07
    ld e, #${backdropColor.toString(16).toUpperCase().padStart(2, '0')}
    call vdp_write_register
    ret

load_screen5_bitmap_palette:
    ld hl, screen5_bitmap_palette_data
    ld b, 16
    xor a
.palette_loop:
    push af
    push bc
    push hl
    ld e, a
    ld a, 16
    call vdp_write_register
    pop hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    ld a, (hl)
    out (${VDP_PALETTE_PORT}), a
    inc hl
    pop bc
    pop af
    inc a
    djnz .palette_loop
    ret

; ------------------------------------------------------------
; FUNCTION: init_bitmap_hud_band
; ------------------------------------------------------------
; PURPOSE:
;   Initialize the persistent top HUD band on both double-buffer pages after
;   entering SCREEN 5.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   decompress_bitmap_rle_to_vram
;
; SIDE EFFECTS:
;   Writes the top ${BITMAP_ROOM_HUD_HEIGHT} scanlines at VRAM #00000 and #08000.
;
; NOTES:
;   The HUD band is uploaded once to page 0 and page 1. Room composition only
;   repaints the game band below it, so page flips do not expose an empty HUD.
; ------------------------------------------------------------
init_bitmap_hud_band:
${hudSeedUploadAsm}

; ------------------------------------------------------------
; FUNCTION: upload_tileset_atlas
; ------------------------------------------------------------
; PURPOSE:
;   Upload the shared world tileset (atlas, packed 4bpp RLE) once to page 2
;   offscreen VRAM. load_room/step_room_composition build each room by copying
;   16x16 tiles from here.
;
; INPUT:
;   None.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   decompress_bitmap_rle_to_vram
;
; SIDE EFFECTS:
;   Writes the offscreen tileset VRAM starting at ${hexVram(atlasVramBase)}.
;
; NOTES:
;   Reads compact RLE data from the resident ROM window (or P2 data banks), then
;   re-arms R#14 per 16KB VRAM bank so rows beyond physical VRAM #3FFF are
;   written correctly. Uploaded once at boot; rooms reference it by VRAM source.
; ------------------------------------------------------------
upload_tileset_atlas:
${tilesetUploadAsm}

; ------------------------------------------------------------
; FUNCTION: replay_room_commands
; ------------------------------------------------------------
; PURPOSE:
;   Feed a room render program (a list of ${VDP_CMD_BLOCK_SIZE}-byte V9938 command
;   blocks) to the VDP command engine, waiting for each command to finish.
;
; INPUT:
;   HL = pointer to the command blocks. BC = number of blocks.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, BC, DE, HL  (vdp_reinit_cmd_pointer overwrites E)
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer.
;
; SIDE EFFECTS:
;   Issues LMMV/LMMM/LINE commands that paint the visible game band.
;
; NOTES:
;   Each block is SX,SY,DX,DY,NX,NY (16-bit LE), CLR, ARG, CMR. Indirect register
;   writes auto-increment from R#32, so the pointer is re-armed per block.
; ------------------------------------------------------------
replay_room_commands:
    ld a, b
    or c
    ret z
.next_block:
    push bc
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, ${VDP_CMD_BLOCK_SIZE}
.write_block:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .write_block
    pop bc
    dec bc
    ld a, b
    or c
    jp nz, .next_block
    ret

; ------------------------------------------------------------
; FUNCTION: load_room
; ------------------------------------------------------------
; PURPOSE:
;   Render one room's visible game band from the shared tileset and reload its
;   collision map into RAM.
;
; INPUT:
;   A = room/screen index (0-based).
;
; OUTPUT:
;   current_screen_index updated; collision/behavior RAM refreshed.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   replay_room_commands.
;
; SIDE EFFECTS:
;   Repaints the game band via the VDP command engine; LDIR over room RAM maps.
;
; NOTES:
;   Pointer tables are word-indexed (DW), the block-count table is byte-indexed.
;   replay_room_commands clobbers DE (vdp_reinit_cmd_pointer writes E), so the
;   collision/behavior lookup re-derives the index from current_screen_index in RAM.
;   Boot always renders to display page 0. Room transitions use
;   start_room_transition + step_room_composition instead of this synchronous path.
; ------------------------------------------------------------
load_room:
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_render_ptr_table_p0
${options.bankedRle ? `    ld bc, bitmap_room_render_bank_table_p0
` : ''}
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room render blocks
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)              ; BC = block count
    pop hl
    call replay_room_commands
    ; DE was clobbered by the command engine; re-derive the room index.
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_ptr_table
${options.bankedRle ? `    ld bc, bitmap_room_collision_bank_table
` : ''}
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room collision source
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    ld de, bitmap_room_collision_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
${options.bankedRle ? `    ld bc, bitmap_room_behavior_bank_table
` : ''}
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room behavior source
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    ld de, bitmap_room_behavior_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ; The command-engine status polls above left R#15 pointing at S#2. Restore S#0
    ; selection so the main loop's bitmap_wait_vblank (which assumes R#15=0) syncs
    ; correctly; otherwise post-transition rooms run on the bounded-delay fallback
    ; every frame (severe lag).
${options.bankedRle ? `    call bitmap_room_restore_resident_banks
` : ''}    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: start_room_transition
; ------------------------------------------------------------
; PURPOSE:
;   Queue a transition to the neighbour room across one screen edge. The target
;   room is composed later, a few VDP command blocks per frame, on the hidden page.
;
; INPUT:
;   A = direction (0=west, 1=east, 2=north, 3=south).
;
; OUTPUT:
;   On a valid neighbour: transition state is initialized and carry is SET.
;   With no neighbour for that edge: carry is CLEAR and nothing changes.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_composition_state, bitmap_pending_room, bitmap_transition_dir,
;   bitmap_pending_display_page, bitmap_composition_block_ptr and
;   bitmap_composition_blocks_left in RAM.
;
; NOTES:
;   Table layout is 4 bytes per room (west, east, north, south); #FF = no rail.
;   If a composition is already active, carry is SET and the request is ignored
;   so input cannot restart the transition mid-composition.
; ------------------------------------------------------------
start_room_transition:
    ld c, a                 ; C = direction
    ld a, (bitmap_composition_state)
    or a
    jp nz, .already_composing
    ld a, (current_screen_index)
    add a, a
    add a, a                ; A = index * 4
    add a, c
    ld e, a
    ld d, 0
    ld hl, bitmap_room_transition_table
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .no_rail
    ld (bitmap_pending_room), a
    ld a, c
    ld (bitmap_transition_dir), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .compose_page1
    xor a
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p0
${options.bankedRle ? `    ld bc, bitmap_room_render_bank_table_p0
` : ''}    jp .select_render_program
.compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
${options.bankedRle ? `    ld bc, bitmap_room_render_bank_table_p1
` : ''}.select_render_program:
    ld a, (bitmap_pending_room)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_block_bank), a
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}    ld (bitmap_composition_block_ptr), hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_blocks_left), a
    inc hl
    ld a, (hl)
    ld (bitmap_composition_blocks_left + 1), a
    ld a, 1
    ld (bitmap_composition_state), a
${options.bankedRle ? `    call bitmap_room_restore_resident_banks
` : ''}
.already_composing:
    scf
    ret
.no_rail:
    or a                    ; clear carry: caller keeps the player on this screen
    ret

; ------------------------------------------------------------
; FUNCTION: step_room_composition
; ------------------------------------------------------------
; PURPOSE:
;   Continue composing a pending room on the hidden SCREEN 5 page. The visible
;   page is flipped only after all command blocks have completed.
;
; INPUT:
;   bitmap_composition_state = 1 when a transition is active.
;   bitmap_composition_block_ptr = next VDP command block to replay.
;   bitmap_composition_blocks_left = remaining command blocks (16-bit).
;
; OUTPUT:
;   Carry SET when a transition is active this frame; carry CLEAR when idle.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, commit_room_flip.
;
; SIDE EFFECTS:
;   Issues up to ${BITMAP_ROOM_COMPOSITION_BLOCKS_PER_FRAME} V9938 command blocks per call. Each block waits for the
;   previous command before submitting another block, avoiding a long synchronous
;   wait over the whole room. Restores R#15=0 before returning to the main loop.
;
; NOTES:
;   The routine keeps the old page visible while commands run. Stack balance:
;   one PUSH BC per command block, matched by one POP BC before the block count
;   is decremented.
; ------------------------------------------------------------
step_room_composition:
    ld a, (bitmap_composition_state)
    or a
    jp z, .composition_idle
    ld hl, (bitmap_composition_blocks_left)
    ld a, h
    or l
    jp z, commit_room_flip
    ld a, ${BITMAP_ROOM_COMPOSITION_BLOCKS_PER_FRAME}
    ld c, a                 ; C = blocks to process this frame
    ld a, h
    or a
    jp nz, .budget_ready
    ld a, l
    cp ${BITMAP_ROOM_COMPOSITION_BLOCKS_PER_FRAME}
    jp nc, .budget_ready
    ld c, a                 ; Final frame: process only remaining blocks.
.budget_ready:
${options.bankedRle ? `    ld a, (bitmap_composition_block_bank)
    call bitmap_room_select_data_bank_a
` : ''}    ld hl, (bitmap_composition_block_ptr)
.process_block:
    push bc
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld b, ${VDP_CMD_BLOCK_SIZE}
.write_step_block:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .write_step_block
    pop bc
    push hl
    ld hl, (bitmap_composition_blocks_left)
    dec hl
    ld (bitmap_composition_blocks_left), hl
    pop hl
    dec c
    jp nz, .process_block
    ld (bitmap_composition_block_ptr), hl
    ld hl, (bitmap_composition_blocks_left)
    ld a, h
    or l
    jp z, commit_room_flip
${options.bankedRle ? `    call bitmap_room_restore_resident_banks
` : ''}    ld a, #0F
    ld e, #00
    call vdp_write_register
    scf
    ret
.composition_idle:
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: commit_room_flip
; ------------------------------------------------------------
; PURPOSE:
;   Atomically publish a fully-composed hidden page as the visible room.
;
; INPUT:
;   bitmap_pending_room = target room index.
;   bitmap_pending_display_page = page to display (0 or 1).
;   bitmap_transition_dir = direction that triggered the transition.
;
; OUTPUT:
;   current_screen_index, bitmap_displayed_page, collision and behavior RAM updated.
;   player_x/player_y repositioned to the opposite edge; carry SET.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY.
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_write_register.
;
; SIDE EFFECTS:
;   Copies the target collision/behavior grids to RAM, flips VDP R#2, restores R#15=0,
;   clears bitmap_composition_state, and resets vertical player velocity. HUD dirty
;   flags are NOT invalidated: dynamic HUD widgets are mirrored to both pages when
;   their values change, so transitions only rewrite the game band.
;
; NOTES:
;   R#2 values are SCREEN 5 page bases: #1F for page 0, #3F for page 1.
;   The display register is written after collision/player state is ready, so
;   the player is not shown on the new page at an old edge for one frame.
; ------------------------------------------------------------
commit_room_flip:
    call vdp_wait_cmd_ready
    ld a, (bitmap_pending_room)
    ld (current_screen_index), a
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_ptr_table
${options.bankedRle ? `    ld bc, bitmap_room_collision_bank_table
` : ''}
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    ld de, bitmap_room_collision_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
${options.bankedRle ? `    ld bc, bitmap_room_behavior_bank_table
` : ''}
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${options.bankedRle ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    ld de, bitmap_room_behavior_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
${options.bankedRle ? `    call bitmap_room_restore_resident_banks
` : ''}
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
    ld a, (bitmap_transition_dir)
    or a
    jp z, .commit_enter_right
    cp 1
    jp z, .commit_enter_left
    cp 2
    jp z, .commit_enter_bottom
${enableKeyDoorTransitions ? `    cp 4
    jp z, .commit_enter_key_door
` : ''}.commit_enter_top:
    ld a, 2
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_bottom:
    ld a, ${bottomEntryY}
    ld (player_y), a
    jp .commit_flip_page
.commit_enter_right:
    ld a, 238
    ld (player_x), a
    jp .commit_flip_page
.commit_enter_left:
    ld a, 2
    ld (player_x), a
${enableKeyDoorTransitions ? `    jp .commit_flip_page
.commit_enter_key_door:
    ld a, (bitmap_key_pending_entry_y)
    ld (player_y), a
    ld a, (bitmap_key_pending_entry_x)
    ld (player_x), a
` : ''}.commit_flip_page:
${doorVisualPendingPageCallAsm}
    ld a, (bitmap_pending_display_page)
    ld (bitmap_displayed_page), a
    or a
    jp z, .flip_to_page0
    ld e, #${BITMAP_ROOM_PAGE1_R2.toString(16).toUpperCase().padStart(2, '0')}
    jp .write_display_page
.flip_to_page0:
    ld e, #${BITMAP_ROOM_PAGE0_R2.toString(16).toUpperCase().padStart(2, '0')}
.write_display_page:
    ld a, #02
    call vdp_write_register
    ld a, #0F
    ld e, #00
    call vdp_write_register
    xor a
    ld (bitmap_composition_state), a
    ld (bitmap_composition_blocks_left), a
    ld (bitmap_composition_blocks_left + 1), a
${foreground ? foreground.loadCallAsm : ''}    scf
    ret

init_hardware_sprite_tables:
    ; Sprite mode 2 tables at F400/F600/F800 (physical layout used by VK).
    ; Colours: upload ONLY frame 0's table here; the rest is per-frame and the
    ; main loop re-uploads on frame change (bitmap_upload_player_frame_colors).
    ld hl, bitmap_room_sprite_colors
    ld de, ${playerColorBaseWord}
    ld bc, ${colorFrameStride}
    call copy_to_vram_ext
${shouldEmitPlayerColorUpdate ? `    xor a                   ; frame 0 colours are now in VRAM
    ld (player_colors_loaded), a
` : ''}    ld hl, bitmap_room_sprite_attrs
    ld de, ${playerSatBaseWord}
    ld bc, bitmap_room_sprite_attrs_end - bitmap_room_sprite_attrs
    call copy_to_vram_ext
    ld hl, bitmap_room_sprite_patterns
    ld de, #F800
    ld bc, bitmap_room_sprite_patterns_end - bitmap_room_sprite_patterns
    jp copy_to_vram_ext

bitmap_wait_vblank:
    ; Poll VDP status S#0 until the frame flag (bit 7) is set: a 60 Hz tick that
    ; does NOT depend on BIOS frame interrupts (the VK-style VDP init does not
    ; enable a BIOS-compatible vblank IRQ). Assumes R#15 = 0. Clobbers AF/BC.
    ; If the host BIOS/VDP state never raises S#0 bit 7, return after a bounded
    ; delay so gameplay cannot hang on the first rendered frame.
    ld bc, #4000
.wv_loop:
    in a, (VDP_CTRL_PORT)
    bit 7, a
    ret nz
    dec bc
    ld a, b
    or c
    jp nz, .wv_loop
    ret

update_player_movement:
    ; Platform movement with 16x16-cell foreground collision. Reads keyboard row 8
    ; directly via PPI (pressed bit = 1 after CPL): bit7=right, bit5=up,
    ; bit4=left, bit0=SPACE. Clobbers AF/BC/DE/HL.
    ; Read keyboard row 8 (cursor keys) DIRECTLY via the PPI, not via BIOS SNSMAT.
    ; SNSMAT (a BIOS call) stalled the DI cartridge loop far below 60Hz (PC parked in
    ; BIOS) AND let the BIOS reset the VDP (R#1 back to 8x8 sprites) every frame.
    in a, (PPI_C)
    and #F0                 ; preserve CAPS LED / cassette / key-click bits
    or 8                    ; select keyboard row 8 in the low nibble
    out (PPI_C), a
    in a, (PPI_B)           ; row 8 data (0 = key pressed)
    cpl                     ; now a set bit means that key is pressed
    ld c, a                 ; C = pressed mask for keyboard row 8
    xor a
    ld (player_moving), a
${hasStateAnim ? '    ld (player_anim_state), a    ; default animation state each frame; skills assert theirs\n' : ''}${skillHooks.inputGateAsm || ''}
${skillHooks.horizontalHookAsm || ''}
bitmap_stick_dx:
    bit 7, c
    jp z, .not_right
    ld a, 1
    ld (player_facing), a
    ld (player_moving), a
    ld a, 2                 ; player speed: 2px/frame (was 1 -> felt sluggish)
    push bc
    call bitmap_try_move_x
    pop bc
    ; East edge: if a neighbour room exists, walk into it.
    ld a, (player_x)
    cp 238
    jp c, .check_jump
    ld a, 1                 ; direction east
    push bc
    call start_room_transition
    pop bc
    ret c                   ; transitioned -> done this frame
    jp .check_jump
.not_right:
    bit 4, c
    jp z, .check_jump
    xor a
    ld (player_facing), a
    inc a
    ld (player_moving), a
    ld a, #FE              ; -2px/frame (left)
    push bc
    call bitmap_try_move_x
    pop bc
    ; West edge: if a neighbour room exists, walk into it.
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                   ; direction west
    push bc
    call start_room_transition
    pop bc
    ret c
.check_horizontal_edges:
    ld a, (player_x)
    cp 238
    jp c, .check_west_edge
    ld a, 1                 ; direction east
    push bc                 ; start_room_transition clobbers BC; C (keyboard row 8 mask) must survive for .check_jump
    call start_room_transition
    pop bc
    ret c
    jp .check_jump
.check_west_edge:
    ld a, (player_x)
    cp 3
    jp nc, .check_jump
    xor a                   ; direction west
    push bc
    call start_room_transition
    pop bc
    ret c
${buildBitmapJumpBlockAsm(playerPhysics)}
.apply_gravity:
    ; Sub-pixel gravity: accumulate the fractional strength (Player Config
    ; gravityStrength88 low byte, default 64 = 0.25 px/frame^2) and only nudge
    ; player_vy by 1 px when it carries. Matches SCREEN 4's gradual arc instead
    ; of the old fixed 1 px/frame^2 integer nudge. Clobbers AF.
    ld a, (player_vy)
    cp ${playerPhysics.terminalPx}              ; terminal fall speed px/frame (Player Config maxFallSpeed)
    jp z, .after_gravity_tick                   ; already terminal: keep frac frozen
    ld a, (player_vy_frac)
    add a, ${playerPhysics.gravityFrac}              ; gravityStrength88 low byte (0.25 px/frame^2 default)
    ld (player_vy_frac), a
    jp nc, .after_gravity_tick                  ; fraction did not carry -> vy unchanged this frame
    ld a, (player_vy)                           ; carry: nudge vy 1 px towards terminal
    inc a
    ld (player_vy), a
.after_gravity_tick:
${skillHooks.gravityHookAsm || ''}
.apply_vertical_velocity:
    ld a, (player_vy)
    or a
    jp z, .movement_done
    bit 7, a
    jp z, .falling
    neg
    ld b, a
    ld c, #FF
    jp .vertical_step_loop
.falling:
    ld a, (player_flags)
    and #FE
    ld (player_flags), a
${skillHooks.leaveGroundAsm || ''}
    ld a, (player_vy)
    ld b, a
    ld c, #01
.vertical_step_loop:
    ld a, c
    push bc
    call bitmap_try_move_y
    pop bc
    jp c, .vertical_blocked
    djnz .vertical_step_loop
    jp .movement_done
.vertical_blocked:
    xor a
    ld (player_vy), a
    bit 7, c
    jp nz, .movement_done
    ld a, (player_flags)
    or #01
    ld (player_flags), a
${skillHooks.landClearAsm || ''}
.movement_done:
    ; North/South edge: walk (or fall) into a vertical neighbour room if one exists.
    ld a, (player_y)
    cp 2
    jp nc, .check_south_edge
    ld a, 2                 ; direction north
    call start_room_transition
    ret
.check_south_edge:
    ld a, (player_y)
    cp ${southEdgeThreshold}
    ret c                   ; not at the bottom edge
    ld a, 3                 ; direction south
    call start_room_transition
    ret

${playerAnimationAsm}
${playerColorsAsm}
bitmap_try_move_x:
    ; A = signed dx. Commits player_x when the leading edge of the configured body
    ; collision box is not solid. Hitbox: x=${playerHitbox.x}, y=${playerHitbox.y},
    ; w=${playerHitbox.w}, h=${playerHitbox.h}. Probes Y rows ${probeRowOffsets.join('/')}
    ; (every <=16px so a tall body cannot tunnel a cell). Large ice-slide dx is
    ; clamped at the room edges before probing so unsigned player_x never wraps
    ; from x=2 to x=250 (or past the east edge) during room transitions.
    ; Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_x)
    bit 7, b
    jp z, .check_right_bounds
    add a, b                ; negative dx: carry means no unsigned underflow
    jp c, .x_check_left_min
.x_clamp_left:
    ld a, 2
    jp .x_candidate_ready
.x_check_left_min:
    cp 2
    jp c, .x_clamp_left
    jp .x_candidate_ready
.check_right_bounds:
    add a, b                ; A = candidate X (sprite top-left)
.x_check_right_max:
    cp 238
    jp c, .x_candidate_ready
    ld a, 238
.x_candidate_ready:
    push af                 ; save candidate across the probes
    bit 7, b
    jp nz, .x_left_edge
${addAImmediate(hbRight)}    jp .x_have_edge
.x_left_edge:
${addAImmediate(hbLeft)}.x_have_edge:
    ld b, a                 ; B = probe X (hitbox leading edge; preserved by probe_solid)
${probeRowOffsets.map(row => `    ld a, (player_y)
${addAImmediate(row)}    ld c, a                 ; C = probe Y (+${row})
    call bitmap_probe_solid
    jp nz, .x_blocked
`).join('')}    pop af                  ; A = candidate X
    ld (player_x), a
    ret
.x_blocked:
    pop af
    ret

bitmap_try_move_y:
    ; A = signed single-pixel dy (#01 down, #FF up). Commits player_y when the
    ; leading edge of the configured body collision box is not solid. Carry set on
    ; blocked. Probes X cols ${probeColOffsets.join('/')}. Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_y)
    add a, b                ; A = candidate Y (sprite top-left)
    push af
    bit 7, b
    jp nz, .y_up_edge
${addAImmediate(hbBottom)}    jp .y_have_edge
.y_up_edge:
${addAImmediate(hbTop)}.y_have_edge:
    ld c, a                 ; C = probe Y (hitbox leading edge; preserved by probe_solid)
${probeColOffsets.map(col => `    ld a, (player_x)
${addAImmediate(col)}    ld b, a                 ; B = probe X (+${col})
    call bitmap_probe_solid
    jp nz, .y_blocked
`).join('')}    pop af                  ; A = candidate Y
    ld (player_y), a
    or a                    ; clear carry
    ret
.y_blocked:
    pop af
    scf
    ret

bitmap_probe_solid:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when passable (cell empty OR deadly-only). Index = (Y & #F0) + (X >> 4)
    ; into the 16x12 grid. Because a cell is 16 px, (Y >> 4) * 16 == (Y & #F0).
    ; The Deadly bit (0x40) is masked out so a deadly-only tile (e.g. floor
    ; spikes) does NOT block movement; Solid+Deadly (0x50) still blocks because
    ; the Solid bit (0x10) survives the mask. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .probe_y_visible
    ld a, 1                 ; outside visible Y range is solid
    or a
    ret
.probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)              ; A = cell value (returned intact to honour the contract)
    ld e, a                 ; E = copy of cell value
    and #BF                 ; mask out Deadly bit (#BF = ~#40); Z when empty or deadly-only
    ld a, e                 ; restore A = original cell value
    ret

bitmap_probe_deadly:
    ; B = pixel X, C = pixel Y. Returns A = collision cell value with Z set
    ; when the cell does NOT have the Deadly bit (0x40), NZ when it does.
    ; Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .deadly_probe_y_visible
    xor a
    ret
.deadly_probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_collision_map
    add hl, de
    ld a, (hl)              ; A = cell value (returned intact)
    bit 6, a                ; test Deadly bit without altering A
    ret

bitmap_probe_behavior:
    ; B = pixel X, C = pixel Y. Returns A = behavior cell value with Z set
    ; when empty. Indexing matches bitmap_probe_solid. Clobbers AF/DE/HL; keeps BC.
    ld a, c
    cp 192
    jp c, .behavior_probe_y_visible
    xor a
    ret
.behavior_probe_y_visible:
    ld a, c
    and #F0
    ld l, a
    ld a, b
    rrca
    rrca
    rrca
    rrca
    and #0F
    add a, l
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_map
    add hl, de
    ld a, (hl)
    or a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_sprite_sat
; ------------------------------------------------------------
; PURPOSE:
;   Write player SAT bytes, converting logical game Y to visual SCREEN 5 Y.
;
; INPUT:
;   player_y = logical game Y coordinate, 0..191.
;   player_x = visual/logical X coordinate.
;   player_pat = base hardware sprite pattern index for the current frame.
;   player_ec = early-clock byte.
;
; OUTPUT:
;   None.
;
; DESTROYS:
;   AF, DE
;
; PRESERVES:
;   BC, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes ${playerAnimation.layerCount} player SAT entr${playerAnimation.layerCount === 1 ? 'y' : 'ies'} plus a terminator to
;   VRAM ${playerSatBaseWord} through VDP ports #99/#98.
;
; NOTES:
;   Background pixels are shifted down by ${BITMAP_ROOM_GAME_Y_OFFSET}px to
;   reserve the top HUD band, but collision/movement keep logical coordinates.
;   Multi-color sprites are exported as overlapped V9938 mode-2 sprite layers.
; ------------------------------------------------------------
bitmap_update_sprite_sat:
    ld de, ${playerSatBaseWord}
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
${enableBlink ? `    ; Blink i-frames feedback: while invulnerable (player_invuln != 0), hide the
    ; player every other phase so hits/respawns read as a flicker. blink_hide is
    ; computed here (SAT upload always runs, even mid-transition) and read by
    ; each layer's Y write below. 8-frame cycle: visible phases 0..3, hidden 4..7.
    ld a, (player_invuln)
    or a
    jr z, .blink_hide_off
    ld a, (blink_phase)
    inc a
    and #07
    ld (blink_phase), a
    cp #04
    jr c, .blink_hide_off
    ld a, 1
    ld (blink_hide), a
    jr .blink_hide_done
.blink_hide_off:
    xor a
    ld (blink_hide), a
.blink_hide_done:
` : ''}${playerAnimation.spriteOffsets.map((offset, slotIndex) => {
  const yWriteNormal = `    ld a, (player_y)
    add a, ${BITMAP_ROOM_GAME_Y_OFFSET}${offset.y ? `\n    add a, ${offset.y}                   ; cell row +${offset.y}px` : ''}
    out (${VDP_DATA_PORT}), a`;
  const yWriteHidden = `    ld a, #D8
    out (${VDP_DATA_PORT}), a`;
  const xPatEc = `    ld a, (player_x)${offset.x ? `\n    add a, ${offset.x}                   ; cell col +${offset.x}px` : ''}
    out (${VDP_DATA_PORT}), a
    ld a, (player_pat)
${slotIndex ? `    add a, ${slotIndex * 4}\n` : ''}    out (${VDP_DATA_PORT}), a
    ld a, (player_ec)
    out (${VDP_DATA_PORT}), a`;
  if (enableBlink) {
    return `    ld a, (blink_hide)
    or a
    jr nz, .slot_${slotIndex}_hide_y
${yWriteNormal}
    jr .slot_${slotIndex}_after_y
.slot_${slotIndex}_hide_y:
${yWriteHidden}
.slot_${slotIndex}_after_y:
${xPatEc}
`;
  }
  return `${yWriteNormal}
${xPatEc}
`;
}).join('')}    ld a, #D8
    out (${VDP_DATA_PORT}), a
    xor a
    out (${VDP_DATA_PORT}), a
    out (${VDP_DATA_PORT}), a
    out (${VDP_DATA_PORT}), a
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    ret
`;
}

// Placeholder blob sprite (a diamond) used only when no configured player
// sprite can be resolved from the project.
const PLACEHOLDER_SPRITE_COLORS = Array.from({ length: 16 }, () => 0x01);
const PLACEHOLDER_SPRITE_PATTERNS = [
  0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x18, 0x3C, 0x7E, 0xFF, 0xFF, 0x7E, 0x3C, 0x18,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

const BITMAP_ROOM_DEFAULT_SPRITE_COLOR = 15;
const BITMAP_ROOM_MAX_PLAYER_SPRITE_LAYERS = 8;

// Resolve the configured player's 16x16 render sprite for the bitmap room.
// Resolve the msx2player definition linked to the room (same priority as the sprite
// resolver): room.playerEntries[].playerId -> that player asset; else the first player asset.
function resolveBitmapRoomPlayer(analysis: ProjectAnalysis, room: Msx2Screen5BitmapRoom): Partial<Msx2PlayerDefinition> | undefined {
  const playerRecords = getMsx2PlayerAssetRecords(analysis);
  const referenceIds = new Set<string>();
  for (const entry of room.playerEntries || []) {
    const playerId = String((entry as any)?.playerId || '').trim();
    if (playerId) referenceIds.add(playerId);
  }
  if (referenceIds.size) {
    const referenced = playerRecords.find(record =>
      referenceIds.has(record.assetId) || referenceIds.has(record.playerId) || referenceIds.has(record.name)
    );
    if (referenced?.player) return referenced.player;
  }
  return playerRecords[0]?.player;
}

interface BitmapPlayerPhysics {
  jumpImpulseByte: number; // signed -jumpPx as a byte (e.g. -6 -> #FA)
  jumpPx: number;
  terminalPx: number;
  doubleJumpEnabled: boolean;
  maxJumps: number;
  airJumpImpulseByte: number;
  airJumpPx: number;
  /** Coyote time in frames (0 = disabled). From skillParameters.jump (see msx2PlatformPhysics). */
  coyoteTime: number;
  /** Jump buffer in frames (0 = disabled). From skillParameters.jump. */
  jumpBuffer: number;
  /** Keyboard binding for the logical jump control in the bitmap runtime. */
  jumpKeyboard?: {
    label: string;
    row: number;
    mask: number;
  } | null;
  /**
   * Gravity strength as the low byte of the 8.8 value from the Player Config
   * (gravityStrength88, default #40 = 0.25 px/frame^2). The bitmap runtime accumulates
   * this into player_vy_frac and only increments player_vy when it carries, giving a
   * gradual arc that matches SCREEN 4 instead of the old fixed 1 px/frame^2 nudge.
   */
  gravityFrac: number;
}

interface BitmapPlayerHitbox { x: number; y: number; w: number; h: number; }

// Player body collision box from the Player Config (Msx2PlayerEditor "Collision Box":
// Left/Top/Width/Height -> hitboxes.body {x,y,w,h}). Defaults to the full sprite size
// so a 16x32 sprite without an explicit box still collides over its whole height.
// Insets are clamped to a non-negative 0..31 px range (the box lives inside the sprite).
function getBitmapPlayerBodyHitbox(
  player: Partial<Msx2PlayerDefinition> | undefined,
  spriteSize?: { width?: number; height?: number },
): BitmapPlayerHitbox {
  const body: any = (player as any)?.hitboxes?.body || (player as any)?.components?.msx2_collision || (player as any)?.params || {};
  const inset = (value: unknown, fallback: number) => Math.max(0, Math.min(31, Math.floor(Number(value) || fallback)));
  const span = (value: unknown, fallback: number) => Math.max(1, Math.min(32, Math.floor(Number(value) || fallback)));
  const defW = span(spriteSize?.width, 16);
  const defH = span(spriteSize?.height, 16);
  return {
    x: inset(body.x ?? body.offsetX ?? body.hitboxX ?? body.left, 0),
    y: inset(body.y ?? body.offsetY ?? body.hitboxY ?? body.top, 0),
    w: span(body.w ?? body.width ?? body.hitboxW, defW),
    h: span(body.h ?? body.height ?? body.hitboxH, defH),
  };
}

// Map the Player Config jump/fall physics to the bitmap engine's whole-pixel velocities.
// The bitmap runtime uses integer px/frame (player_vy is a signed byte) for the committed
// position, but keeps a sub-pixel fraction (player_vy_frac) so gravity can accelerate
// gradually like SCREEN 4's 8.8 accumulator (default 0.25 px/frame^2 instead of a fixed
// 1 px/frame^2). jumpImpulse88/terminalVelocity88 are rounded to px for the integer part;
// gravityStrength88 is kept as the fractional accumulator so the arc feels smooth.
// coyoteTime / jumpBuffer are only honoured when skillParameters.jump is present.
function resolveBitmapPlayerPhysics(player: Partial<Msx2PlayerDefinition> | undefined): BitmapPlayerPhysics {
  const physics = getMsx2PlatformPhysicsFromPlayerEntity(player);
  const toSigned16 = (value: number) => ((value & 0x8000) ? value - 0x10000 : value);
  const jumpPx = Math.max(2, Math.min(15, Math.round(Math.abs(toSigned16(physics.jumpImpulse88)) / 256)));
  const terminalPx = Math.max(1, Math.min(15, Math.round(physics.terminalVelocity88 / 256)));
  const airJumpPx = Math.max(2, Math.min(15, Math.round(Math.abs(toSigned16(physics.airJumpImpulse88)) / 256)));
  return {
    jumpImpulseByte: (256 - jumpPx) & 0xff,
    jumpPx,
    terminalPx,
    doubleJumpEnabled: Boolean(physics.doubleJumpEnabled),
    maxJumps: Math.max(1, Math.min(4, Math.floor(physics.maxJumps) || 1)),
    airJumpImpulseByte: (256 - airJumpPx) & 0xff,
    airJumpPx,
    coyoteTime: Math.max(0, Math.min(16, Math.floor(physics.coyoteTime) || 0)),
    jumpBuffer: Math.max(0, Math.min(16, Math.floor(physics.jumpBuffer) || 0)),
    jumpKeyboard: player?.inputEnabled?.jump === false ? null : (resolveMsx2BitmapKeyboardBinding(player, 'jump') ?? null),
    gravityFrac: Math.max(16, Math.min(128, Math.floor(physics.gravityStrength88) || 0x40)) & 0xff,
  };
}

// Player vitals from the Player Config (Msx2PlayerEditor "General" tab:
// Initial Health / Initial Lives / I-Time). The bitmap runtime consumes them
// as the Deadly-tile damage system: each deadly contact decrements health,
// invuln counts down i-frames, and reaching 0 health costs 1 life + respawn at
// the current room's spawn point (read from bitmap_room_spawn_x/y_table).
interface BitmapPlayerVitals {
  /** Initial/current health (Player Config health.maxHealth, default 5). 1..255. */
  maxHealth: number;
  /** Initial/current lives (Player Config health.lives, default 3). 1..255. */
  lives: number;
  /** Invulnerability frames after a hit (health.invulnerabilityFrames, default 60). 0..255. */
  invulnFrames: number;
  /**
   * Deadly-tile behaviour (health.deadlyInstantRespawn, default true).
   * true  = deadly contact -> -1 life + immediate respawn + blink i-frames.
   * false = deadly contact -> -1 health + blink i-frames; respawn only at 0 health.
   */
  deadlyInstantRespawn: boolean;
}
function resolveBitmapPlayerVitals(player: Partial<Msx2PlayerDefinition> | undefined): BitmapPlayerVitals {
  const health = (player as any)?.health || {};
  const clampByte01 = (value: unknown, fallback: number) => Math.max(1, Math.min(255, Math.floor(Number(value) || fallback)));
  return {
    maxHealth: clampByte01(health.maxHealth, 5),
    lives: clampByte01(health.lives, 3),
    invulnFrames: clampByte01(health.invulnerabilityFrames, 60),
    // Default true (platformer-style instant respawn). `!== false` keeps undefined as true.
    deadlyInstantRespawn: health.deadlyInstantRespawn !== false,
  };
}

// Build the SCREEN 5 bitmap Deadly-tile damage system: EQUs, init snippet,
// main-loop call and the runtime routine. Probes the body's lower band
// (left/center/right) so a passable deadly floor tile (Deadly bit 0x40, not
// Solid) is detected when the player stands on it; decrements health, arms
// i-frames, and respawns at the current room's spawn point on 0 health.
function buildBitmapDeadlySystemAsm(vitals: BitmapPlayerVitals, hitbox: BitmapPlayerHitbox): {
  equates: string;
  initAsm: string;
  mainLoopCall: string;
  routineAsm: string;
} {
  const hbLeft = hitbox.x;
  const hbRight = hitbox.x + hitbox.w - 1;
  const hbBottom = hitbox.y + hitbox.h - 1;
  const hbCenter = Math.floor((hbLeft + hbRight) / 2);
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');
  const hexB = (n: number) => `#${(n & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
  const maxHealthByte = hexB(vitals.maxHealth);
  const livesByte = hexB(vitals.lives);
  const invulnByte = hexB(vitals.invulnFrames);
  // EQUs: 3 fixed bytes in the safe gap between the optional state-anim block
  // (#C1F0-#C1F5) and bitmap_room_behavior_map (#C200). This region is always
  // free regardless of which optional skills are active (the skill chain lives
  // far below, starting at player_vy_frac #C0D9). check_skill_params_contract.cjs
  // asserts these addresses stay unique and clear of 16-bit pointers.
  // blink_timer is an alias for player_invuln: the i-frame countdown IS the
  // blink countdown (in_blink == blink_timer != 0). blink_ended pulses 1 for a
  // single frame when the countdown reaches 0, so callers can react to the
  // exact frame blink finishes. blink_phase/blink_hide drive the SAT flicker.
  const equates = `; Deadly-tile damage + blink i-frames system (SCREEN 5 bitmap). Fixed bytes in
; the safe gap between player_anim_state (#C1F0-#C1F5) and bitmap_room_behavior_map (#C200).
blink_phase   EQU #C1F9
blink_ended   EQU #C1FA
blink_hide    EQU #C1FB
player_health EQU #C1FD
player_lives  EQU #C1FE
player_invuln EQU #C1FF
blink_timer   EQU player_invuln   ; alias: i-frame countdown == blink countdown. in_blink = (blink_timer != 0)
`;
  const initAsm = `    ; Initialise player vitals from the Player Config (health.maxHealth / lives)
    ; and clear blink state (blink_timer/player_invuln is cleared below).
    ld a, ${maxHealthByte}
    ld (player_health), a
    ld a, ${livesByte}
    ld (player_lives), a
    xor a
    ld (player_invuln), a
    ld (blink_phase), a
    ld (blink_ended), a
    ld (blink_hide), a
`;
  const mainLoopCall = `    call bitmap_check_deadly_contact    ; deadly-tile damage + respawn (SCREEN 5 bitmap)\n`;
  // Revised deadly model: a deadly contact ALWAYS costs 1 health (so the hearts
  // HUD moves) + arms blink i-frames. deadlyInstantRespawn only controls whether
  // the player is also repositioned to the spawn on each touch:
  //   true  -> reposition every touch (no health reset; hearts keep dropping).
  //   false -> stay in place.
  // At 0 health -> -1 life + full respawn (reposition + health reset + blink).
  const takeDamageAsm = vitals.deadlyInstantRespawn
    ? `    ; Instant-respawn mode (health.deadlyInstantRespawn = true): each deadly
    ; touch costs 1 health + blink AND repositions the player to the spawn.
.deadly_take_damage:
    ld hl, player_health
    dec (hl)
    ld a, (hl)
    or a
    jr z, .deadly_dead
    ld a, ${invulnByte}
    ld (player_invuln), a
    jp .deadly_reposition       ; reposition (blink armed), health NOT reset
.deadly_dead:
    ld hl, player_lives
    dec (hl)
    jp .deadly_respawn          ; health 0 -> -1 life + full respawn
`
    : `    ; Action mode (health.deadlyInstantRespawn = false): each deadly touch
    ; costs 1 health + blink; the player stays in place. Full respawn at 0 hp.
.deadly_take_damage:
    ld hl, player_health
    dec (hl)
    ld a, (hl)
    or a
    jr z, .deadly_dead
    ld a, ${invulnByte}
    ld (player_invuln), a       ; arm blink i-frames, stay in place
    ret
.deadly_dead:
    ld hl, player_lives
    dec (hl)
    jp .deadly_respawn          ; health 0 -> -1 life + full respawn
`;
  const routineAsm = `; ------------------------------------------------------------
; FUNCTION: bitmap_check_deadly_contact
; ------------------------------------------------------------
; PURPOSE:
;   Apply deadly-tile damage + blink i-frames for the bitmap room backend.
;   Each frame (after movement) the body's lower band is probed for the Deadly
;   bit (0x40). On contact ALWAYS: -1 player_health + arm blink. The hearts HUD
;   follows player_health so every touch drops a heart. deadlyInstantRespawn
;   only decides whether the player is also repositioned to the spawn (true) or
;   stays (false). At 0 health -> -1 life + full respawn (health reset + blink).
;   While blinking (blink_timer/player_invuln != 0) the player is immune to all
;   damage. blink_ended pulses 1 the exact frame blink finishes (1 -> 0).
;
; INPUT:
;   RAM state: player_x, player_y, player_health, player_lives, player_invuln,
;              blink_phase, blink_ended, bitmap_composition_state,
;              current_screen_index.
;
; OUTPUT:
;   player_health / player_lives / player_invuln / blink_ended updated; on
;   respawn/reposition also player_x, player_y, player_vy, player_vy_frac.
;
; DESTROYS:
;   AF, DE, HL
;
; PRESERVES:
;   BC (so the main loop can call it next to skills without register spills)
;
; CALLS:
;   bitmap_probe_deadly
;
; SIDE EFFECTS:
;   Reads bitmap_room_collision_map (probe) and bitmap_room_spawn_x/y_table
;   (respawn/reposition). Never fires while bitmap_composition_state != 0.
; ------------------------------------------------------------
bitmap_check_deadly_contact:
    ld a, (bitmap_composition_state)
    or a
    ret nz                     ; skip during room transition/composition

    ; --- blink i-frames countdown ---
    xor a
    ld (blink_ended), a        ; default: blink not ending this frame
    ld a, (player_invuln)
    or a
    jr z, .deadly_invuln_done  ; already 0: not blinking
    dec a
    ld (player_invuln), a      ; count down blink/i-frames
    or a
    jr nz, .deadly_invuln_done ; still blinking
    ld a, 1
    ld (blink_ended), a        ; just reached 0 -> blink ended this frame
.deadly_invuln_done:
    ld a, (player_invuln)
    or a
    ret nz                     ; in_blink -> immune to all damage this frame

    ; Probe the body's lower band (left / center / right) for a deadly cell.
    ld a, (player_y)
${addA(hbBottom)}    ld c, a                    ; C = probe Y (lower body edge); bitmap_probe_deadly keeps BC

    ld a, (player_x)
${addA(hbLeft)}    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
${addA(hbCenter)}    ld b, a
    call bitmap_probe_deadly
    jp nz, .deadly_take_damage
    ld a, (player_x)
${addA(hbRight)}    ld b, a
    call bitmap_probe_deadly
    jp z, .deadly_no_contact   ; no deadly contact in any sample -> exit
${takeDamageAsm}.deadly_respawn:
    ; FULL respawn (health reached 0): reset health, arm blink, zero velocity.
    ld a, ${maxHealthByte}
    ld (player_health), a
    ld a, ${invulnByte}
    ld (player_invuln), a
    xor a
    ld (player_vy), a
    ld (player_vy_frac), a
    ; fall through to .deadly_reposition (move player to the room spawn)
.deadly_reposition:
    ; Move the player to the current room's spawn point (no health reset).
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_x_table
    add hl, de
    ld a, (hl)
    ld (player_x), a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_spawn_y_table
    add hl, de
    ld a, (hl)
    ld (player_y), a
    ret
.deadly_no_contact:
    ret
`;
  return { equates, initAsm, mainLoopCall, routineAsm };
}

interface BitmapKeyPickupRecord {
  roomIndex: number;
  x: number;
  y: number;
  keyMask: number;
  flagOffset: number;
}

interface BitmapKeyDoorRecord {
  roomIndex: number;
  x: number;
  y: number;
  requiredMask: number;
  targetRoomIndex: number;
  targetX: number;
  targetY: number;
  flags: number;
  openOffset: number;
}

interface BitmapDoorVisualRecord {
  roomIndex: number;
  openOffset: number;
  flags: number;
  closedCommand: number[];
  openCommand: number[];
}

const KEY_DOOR_FLAG_CONSUME = 0x01;
const KEY_DOOR_FLAG_OPEN_ONCE = 0x02;
const KEY_DOOR_VISUAL_CLOSED = 0x01;
const KEY_DOOR_VISUAL_OPEN = 0x02;

function normalizeDoorConfig(value: unknown): {
  enabled: boolean;
  requiredKeyId: string;
  consumeKey: boolean;
  openOnce: boolean;
  targetRoomId: string;
  targetEntryId: string;
  closedAtlasEntryId: string;
  openAtlasEntryId: string;
} {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    enabled: Boolean(raw.enabled),
    requiredKeyId: typeof raw.requiredKeyId === 'string' ? raw.requiredKeyId : '',
    consumeKey: Boolean(raw.consumeKey),
    openOnce: raw.openOnce !== false,
    targetRoomId: typeof raw.targetRoomId === 'string' ? raw.targetRoomId : '',
    targetEntryId: typeof raw.targetEntryId === 'string' ? raw.targetEntryId : '',
    closedAtlasEntryId: typeof raw.closedAtlasEntryId === 'string' ? raw.closedAtlasEntryId : '',
    openAtlasEntryId: typeof raw.openAtlasEntryId === 'string' ? raw.openAtlasEntryId : '',
  };
}

function resolveDoorTargetEntry(room: Msx2Screen5BitmapRoom, entryId: string): { x: number; y: number } {
  const entries = Array.isArray(room.playerEntries) ? room.playerEntries : [];
  const entry = entryId ? entries.find(item => item?.id === entryId) : undefined;
  if (entry) {
    return {
      x: clampByte(entry.x, 2) & 0xff,
      y: clampByte(entry.y, 2) & 0xff,
    };
  }
  const spawn = resolvePlayerSpawnPixels(room);
  return { x: clampByte(spawn.x, 2) & 0xff, y: clampByte(spawn.y, 2) & 0xff };
}

function buildDoorVisualCommand(room: Msx2Screen5BitmapRoom, atlasEntryId: string, dx: number, dy: number): number[] | null {
  const entry = atlasEntryId ? (room.atlas?.entries || []).find(item => item.id === atlasEntryId) : undefined;
  if (!entry) return null;
  const sx = clampInt(entry.sx, 0, 255, 0);
  const sy = BITMAP_ROOM_ATLAS_BASE_Y + clampInt(entry.sy, 0, BITMAP_ROOM_ATLAS_MAX_HEIGHT - 1, 0);
  const w = clampInt(entry.w, 1, 256, TILE_GRID_SIZE);
  const h = clampInt(entry.h, 1, SCREEN_HEIGHT_DEFAULT, TILE_GRID_SIZE);
  const nx = Math.max(1, Math.min(w, SCREEN_WIDTH - dx));
  const ny = Math.max(1, Math.min(h, SCREEN_HEIGHT_DEFAULT - dy));
  const destY = BITMAP_ROOM_GAME_Y_OFFSET + dy;
  return [
    sx & 0xff, (sx >> 8) & 0xff,
    sy & 0xff, (sy >> 8) & 0xff,
    dx & 0xff, (dx >> 8) & 0xff,
    destY & 0xff, 0,
    nx & 0xff, (nx >> 8) & 0xff,
    ny & 0xff, (ny >> 8) & 0xff,
    0, 0, CMD_COPY_16,
  ];
}

function collectBitmapKeyDoorRecords(rooms: Msx2Screen5BitmapRoom[]): {
  pickups: BitmapKeyPickupRecord[];
  doors: BitmapKeyDoorRecord[];
  visuals: BitmapDoorVisualRecord[];
} {
  const keyBits = new Map<string, number>();
  for (const room of rooms) {
    for (const item of room.keyItems || []) {
      if (!item?.id || keyBits.has(item.id)) continue;
      keyBits.set(item.id, clampInt(item.bitIndex, 0, 7, 0));
    }
  }
  const roomIndexById = new Map(rooms.map((room, index) => [room.id, index]));
  const pickups: BitmapKeyPickupRecord[] = [];
  const doors: BitmapKeyDoorRecord[] = [];
  const visuals: BitmapDoorVisualRecord[] = [];
  for (const [roomIndex, room] of rooms.entries()) {
    for (const entity of room.entities || []) {
      const x = clampByte((entity.position?.x ?? 0) * TILE_GRID_SIZE, 0) & 0xff;
      const y = clampByte((entity.position?.y ?? 0) * TILE_GRID_SIZE, 0) & 0xff;
      if (entity.kind === 'collectible') {
        const keyId = typeof entity.params?.keyPickupId === 'string' ? entity.params.keyPickupId : '';
        const bit = keyBits.get(keyId);
        if (bit === undefined) continue;
        pickups.push({ roomIndex, x, y, keyMask: 1 << bit, flagOffset: pickups.length });
        continue;
      }
      if (entity.kind !== 'door') continue;
      const door = normalizeDoorConfig(entity.params?.lockedDoor);
      if (!door.enabled || !door.targetRoomId) continue;
      const targetRoomIndex = roomIndexById.get(door.targetRoomId);
      if (targetRoomIndex === undefined) continue;
      const requiredBit = keyBits.get(door.requiredKeyId);
      const requiredMask = requiredBit === undefined ? 0 : (1 << requiredBit);
      const targetEntry = resolveDoorTargetEntry(rooms[targetRoomIndex], door.targetEntryId);
      const flags = (door.consumeKey ? KEY_DOOR_FLAG_CONSUME : 0) | (door.openOnce ? KEY_DOOR_FLAG_OPEN_ONCE : 0);
      const openOffset = doors.length;
      const closedCommand = buildDoorVisualCommand(room, door.closedAtlasEntryId, x, y);
      const openCommand = buildDoorVisualCommand(room, door.openAtlasEntryId, x, y);
      if (closedCommand || openCommand) {
        visuals.push({
          roomIndex,
          openOffset,
          flags: (closedCommand ? KEY_DOOR_VISUAL_CLOSED : 0) | (openCommand ? KEY_DOOR_VISUAL_OPEN : 0),
          closedCommand: closedCommand || new Array(15).fill(0),
          openCommand: openCommand || new Array(15).fill(0),
        });
      }
      doors.push({
        roomIndex,
        x,
        y,
        requiredMask,
        targetRoomIndex,
        targetX: targetEntry.x,
        targetY: targetEntry.y,
        flags,
        openOffset,
      });
    }
  }
  return { pickups, doors, visuals };
}

function buildBitmapKeyDoorSystemAsm(
  rooms: Msx2Screen5BitmapRoom[],
  hitbox: BitmapPlayerHitbox,
  ramBase: number,
  bankedRoomData: boolean,
): {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  mainLoopCall: string;
  initialDrawCall: string;
  pendingPageDrawCall: string;
  routinesAsm: string;
  dataAsm: string;
} {
  const { pickups, doors, visuals } = collectBitmapKeyDoorRecords(rooms);
  if (pickups.length === 0 && doors.length === 0) {
    return { enabled: false, ramBytes: 0, equates: '', initAsm: '', mainLoopCall: '', initialDrawCall: '', pendingPageDrawCall: '', routinesAsm: '', dataAsm: '' };
  }

  const inventoryAddress = ramBase;
  const pendingXAddress = ramBase + 1;
  const pendingYAddress = ramBase + 2;
  const workMaskAddress = ramBase + 3;
  const workOffsetAddress = ramBase + 4;
  const targetPageAddress = ramBase + 5;
  const pickupFlagsAddress = ramBase + 6;
  const doorOpenFlagsAddress = pickupFlagsAddress + pickups.length;
  const ramBytes = 6 + pickups.length + doors.length;
  const hbLeft = hitbox.x;
  const hbRight = hitbox.x + hitbox.w - 1;
  const hbTop = hitbox.y;
  const hbBottom = hitbox.y + hitbox.h - 1;
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  const pickupTables = rooms.map((_room, roomIndex) => pickups.filter(item => item.roomIndex === roomIndex));
  const doorTables = rooms.map((_room, roomIndex) => doors.filter(item => item.roomIndex === roomIndex));
  const visualTables = rooms.map((_room, roomIndex) => visuals.filter(item => item.roomIndex === roomIndex));
  const pickupDataAsm = pickupTables.map((items, roomIndex) =>
    formatBytes(`bitmap_key_pickups_room_${roomIndex}`, items.flatMap(item => [item.x, item.y, item.keyMask, item.flagOffset]), `Room ${roomIndex} key pickup records: x,y,keyMask,pickupFlagOffset`)
  ).join('');
  const doorDataAsm = doorTables.map((items, roomIndex) =>
    formatBytes(`bitmap_key_doors_room_${roomIndex}`, items.flatMap(item => [item.x, item.y, item.requiredMask, item.targetRoomIndex, item.targetX, item.targetY, item.flags, item.openOffset]), `Room ${roomIndex} locked door records: x,y,requiredMask,targetRoom,targetX,targetY,flags,doorOpenOffset`)
  ).join('');
  const visualDataAsm = visualTables.map((items, roomIndex) =>
    formatBytes(`bitmap_key_door_visuals_room_${roomIndex}`, items.flatMap(item => [item.openOffset, item.flags, ...item.closedCommand, ...item.openCommand]), `Room ${roomIndex} door visual records: openFlagOffset,flags,closedHMMM(15),openHMMM(15)`)
  ).join('');
  const dataAsm = `${pickupDataAsm}${doorDataAsm}${visualDataAsm}` +
    `bitmap_key_pickup_ptr_table:\n${pickupTables.map((_items, i) => `    DW bitmap_key_pickups_room_${i}`).join('\n')}\n` +
    `bitmap_key_pickup_count_table:\n    DB ${pickupTables.map(items => items.length).join(',')}\n` +
    `bitmap_key_door_ptr_table:\n${doorTables.map((_items, i) => `    DW bitmap_key_doors_room_${i}`).join('\n')}\n` +
    `bitmap_key_door_count_table:\n    DB ${doorTables.map(items => items.length).join(',')}\n` +
    `bitmap_key_door_visual_ptr_table:\n${visualTables.map((_items, i) => `    DW bitmap_key_door_visuals_room_${i}`).join('\n')}\n` +
    `bitmap_key_door_visual_count_table:\n    DB ${visualTables.map(items => items.length).join(',')}\n`;
  const clearFlagBytes = [
    ...Array.from({ length: pickups.length }, (_unused, i) => `    ld (bitmap_key_pickup_flags + ${i}), a`),
    ...Array.from({ length: doors.length }, (_unused, i) => `    ld (bitmap_key_door_open_flags + ${i}), a`),
  ].join('\n');
  const equates = `; Key/items + locked doors system (SCREEN 5 bitmap). RAM follows skills/HUD chain.
bitmap_key_inventory       EQU ${hexWord(inventoryAddress)}
bitmap_key_pending_entry_x EQU ${hexWord(pendingXAddress)}
bitmap_key_pending_entry_y EQU ${hexWord(pendingYAddress)}
bitmap_key_work_mask       EQU ${hexWord(workMaskAddress)}
bitmap_key_work_offset     EQU ${hexWord(workOffsetAddress)}
bitmap_key_target_page     EQU ${hexWord(targetPageAddress)}
bitmap_key_pickup_flags    EQU ${hexWord(pickupFlagsAddress)}
bitmap_key_door_open_flags EQU ${hexWord(doorOpenFlagsAddress)}
bitmap_key_cmd_block       EQU #C2C0
`;
  const initAsm = `    ; Clear key inventory and per-pickup/per-door one-shot flags.
    xor a
    ld (bitmap_key_inventory), a
    ld (bitmap_key_pending_entry_x), a
    ld (bitmap_key_pending_entry_y), a
    ld (bitmap_key_work_mask), a
    ld (bitmap_key_work_offset), a
    ld (bitmap_key_target_page), a
${clearFlagBytes ? `${clearFlagBytes}\n` : ''}`;
  const mainLoopCall = `    call bitmap_update_key_doors    ; key pickups + locked-door transitions\n`;
  const initialDrawCall = visuals.length ? `    call bitmap_apply_door_state_visible    ; draw closed/open door metatiles on current page\n` : '';
  const pendingPageDrawCall = visuals.length ? `    call bitmap_apply_door_state_pending_page    ; overlay open/closed door metatiles on hidden page before flip\n` : '';
  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: bitmap_player_overlaps_16
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 entity box.
;
; INPUT:
;   D = entity X in pixels, E = entity Y in pixels.
;
; OUTPUT:
;   A = 1 and NZ when overlapping; A = 0 and Z when separated.
;
; DESTROYS:
;   AF, B
;
; PRESERVES:
;   C, DE, HL, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   None.
; ------------------------------------------------------------
bitmap_player_overlaps_16:
    ld a, (player_x)
${addA(hbRight)}    cp d
    jp c, .key_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
${addA(hbLeft)}    cp b
    jp z, .key_overlap_x_ok
    jp nc, .key_overlap_no
.key_overlap_x_ok:
    ld a, (player_y)
${addA(hbBottom)}    cp e
    jp c, .key_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
${addA(hbTop)}    cp b
    jp z, .key_overlap_yes
    jp nc, .key_overlap_no
.key_overlap_yes:
    ld a, 1
    or a
    ret
.key_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_update_key_doors
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame key/item entity system. Collectible entities with keyPickupId set a
;   bit in bitmap_key_inventory once. Door entities with lockedDoor metadata test
;   the required bit, optionally consume it, optionally remember that the door was
;   opened once, and queue a SCREEN 5 room transition to the configured target
;   room/player entry.
;
; INPUT:
;   RAM state: current_screen_index, bitmap_composition_state, player_x/player_y,
;              bitmap_key_inventory and per-entity flag bytes.
;
; OUTPUT:
;   Inventory/flags updated; door contact may set bitmap_pending_room and start a
;   room composition transition. Carry is not a public result.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_check_key_pickups, bitmap_check_locked_doors.
;
; SIDE EFFECTS:
;   Writes bitmap_key_* RAM and may queue a page-flipped room transition.
; ------------------------------------------------------------
bitmap_update_key_doors:
    ld a, (bitmap_composition_state)
    or a
    ret nz
    call bitmap_check_key_pickups
    jp bitmap_check_locked_doors

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_visible
; ------------------------------------------------------------
; PURPOSE:
;   Draw authored door metatiles (closed/open) for the current room onto the
;   currently visible SCREEN 5 page. Used after the synchronous boot load_room.
;
; INPUT:
;   current_screen_index, bitmap_displayed_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door visual HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_apply_door_state_for_current_room.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_door_state_visible:
    ld a, (bitmap_displayed_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_door_state_for_current_room

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_pending_page
; ------------------------------------------------------------
; PURPOSE:
;   Draw authored door metatiles (closed/open) for the current room onto the
;   pending hidden page before commit_room_flip publishes it.
;
; INPUT:
;   current_screen_index, bitmap_pending_display_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door visual HMMM commands applied to the hidden page.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_apply_door_state_for_current_room.
;
; SIDE EFFECTS:
;   Writes bitmap_key_target_page and uses the V9938 command engine.
; ------------------------------------------------------------
bitmap_apply_door_state_pending_page:
    ld a, (bitmap_pending_display_page)
    ld (bitmap_key_target_page), a
    jp bitmap_apply_door_state_for_current_room

; ------------------------------------------------------------
; FUNCTION: bitmap_apply_door_state_for_current_room
; ------------------------------------------------------------
; PURPOSE:
;   Scan the current room's visual-door records and copy either the closed or
;   open metatile from the shared atlas to the selected page. If a door has no
;   selected metatile for its current state, it is left as rendered by the room.
;
; INPUT:
;   current_screen_index, bitmap_key_target_page, bitmap_key_door_open_flags.
;
; OUTPUT:
;   Door metatile HMMM commands applied to VRAM.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_copy_key_door_command_to_block, bitmap_launch_key_door_cmd,
;   vdp_write_register.
;
; SIDE EFFECTS:
;   Uses bitmap_key_cmd_block scratch (#C2C0) and restores VDP R#15 to S#0 at
;   the end of each launched command.
; ------------------------------------------------------------
bitmap_apply_door_state_for_current_room:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_visual_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_visual_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_door_visual_loop:
    push bc
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a       ; visual flags: bit0 closed, bit1 open
    push hl                            ; recordStart = closed command template
    xor a
    ld (bitmap_key_work_mask), a       ; selection: 0 none, 1 closed, 2 open
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld a, (hl)
    or a
    jp z, .key_door_visual_choose_closed
    pop hl
    push hl
    dec hl
    ld a, (hl)                         ; original visual flags byte
    bit 1, a
    jp z, .key_door_visual_have_selection
    ld a, 2
    ld (bitmap_key_work_mask), a
    jp .key_door_visual_have_selection
.key_door_visual_choose_closed:
    pop hl
    push hl
    dec hl
    ld a, (hl)                         ; original visual flags byte
    bit 0, a
    jp z, .key_door_visual_have_selection
    ld a, 1
    ld (bitmap_key_work_mask), a
.key_door_visual_have_selection:
    ld a, (bitmap_key_work_mask)
    pop de                             ; DE = recordStart
    push de
    or a
    jp z, .key_door_visual_advance
    ld h, d
    ld l, e
    cp 2
    jp nz, .key_door_visual_copy
    ld de, 15
    add hl, de                         ; open command template
.key_door_visual_copy:
    call bitmap_copy_key_door_command_to_block
    call bitmap_launch_key_door_cmd
.key_door_visual_advance:
    pop hl                             ; HL = recordStart
    ld de, 30
    add hl, de                         ; next visual record
    pop bc
    djnz .key_door_visual_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_copy_key_door_command_to_block
; ------------------------------------------------------------
; PURPOSE:
;   Copy one 15-byte HMMM template to bitmap_key_cmd_block and patch DY high byte
;   for page 0/page 1.
;
; INPUT:
;   HL = pointer to 15-byte command template. bitmap_key_target_page = 0 or 1.
;
; OUTPUT:
;   bitmap_key_cmd_block contains the patched command.
;
; DESTROYS:
;   AF, B, DE, HL
;
; PRESERVES:
;   C, IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_key_cmd_block.
; ------------------------------------------------------------
bitmap_copy_key_door_command_to_block:
    ld de, bitmap_key_cmd_block
    ld b, 15
.key_copy_cmd_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz .key_copy_cmd_loop
    ld a, (bitmap_key_target_page)
    or a
    ret z
    ld a, 1
    ld (bitmap_key_cmd_block + 7), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_launch_key_door_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launch the 15-byte V9938 command currently stored in bitmap_key_cmd_block.
;
; INPUT:
;   bitmap_key_cmd_block = complete HMMM command.
;
; OUTPUT:
;   Command submitted to the V9938.
;
; DESTROYS:
;   AF, B, E, HL
;
; PRESERVES:
;   C, D, IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, vdp_write_register.
;
; SIDE EFFECTS:
;   Writes VDP command registers through #9B. Restores R#15 to S#0 before return
;   because vdp_wait_cmd_ready leaves it selecting S#2.
; ------------------------------------------------------------
bitmap_launch_key_door_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_key_cmd_block
    ld b, 15
.key_launch_cmd_loop:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .key_launch_cmd_loop
    ld a, #0F
    ld e, #00
    jp vdp_write_register

; ------------------------------------------------------------
; FUNCTION: bitmap_check_key_pickups
; ------------------------------------------------------------
; PURPOSE:
;   Scan active-room key pickup records and set their inventory bit on overlap.
;
; INPUT:
;   current_screen_index, player_x/player_y, bitmap_key_pickup_* tables.
;
; OUTPUT:
;   bitmap_key_inventory and bitmap_key_pickup_flags updated.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_player_overlaps_16.
;
; SIDE EFFECTS:
;   One byte per pickup is set to 1 after collection; graphics are not erased.
; ------------------------------------------------------------
bitmap_check_key_pickups:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_pickup_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_pickup_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_key_pickup_flags
    add hl, bc
    ld a, (hl)
    or a
    jp nz, .key_pickup_next
    call bitmap_player_overlaps_16
    or a
    jp z, .key_pickup_next
    ld a, (bitmap_key_inventory)
    ld b, a
    ld a, (bitmap_key_work_mask)
    or b
    ld (bitmap_key_inventory), a
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld bc, bitmap_key_pickup_flags
    add hl, bc
    ld (hl), 1
.key_pickup_next:
    pop hl
    pop bc
    djnz .key_pickup_loop
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_check_locked_doors
; ------------------------------------------------------------
; PURPOSE:
;   Scan active-room door records and queue a direct room transition on overlap
;   when the required key bit is present or the open-once flag was already set.
;
; INPUT:
;   current_screen_index, player_x/player_y, bitmap_key_door_* tables.
;
; OUTPUT:
;   May update bitmap_key_inventory, bitmap_key_door_open_flags,
;   bitmap_pending_room, bitmap_key_pending_entry_x/y and composition state.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   bitmap_player_overlaps_16, start_key_door_transition.
;
; SIDE EFFECTS:
;   Starts asynchronous SCREEN 5 room composition; if consumeKey is set the key
;   bit is cleared before transition.
; ------------------------------------------------------------
bitmap_check_locked_doors:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_count_table
    add hl, de
    ld b, (hl)
    ld a, b
    or a
    ret z
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_key_door_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.key_door_loop:
    push bc
    ld a, (hl)
    inc hl
    ld d, a
    ld a, (hl)
    inc hl
    ld e, a
    call bitmap_player_overlaps_16
    or a
    jp z, .key_door_skip_rest
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_mask), a
    ld a, (hl)
    inc hl
    ld (bitmap_pending_room), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_pending_entry_x), a
    ld a, (hl)
    inc hl
    ld (bitmap_key_pending_entry_y), a
    ld a, (hl)
    inc hl
    ld c, a                    ; C = flags
    ld a, (hl)
    inc hl
    ld (bitmap_key_work_offset), a
    bit 1, c
    jp z, .key_door_check_key
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld a, (hl)
    pop hl
    or a
    jp nz, .key_door_open
.key_door_check_key:
    ld a, (bitmap_key_work_mask)
    or a
    jp z, .key_door_open
    ld b, a
    ld a, (bitmap_key_inventory)
    and b
    jp z, .key_door_done
    bit 0, c
    jp z, .key_door_mark_open
    ld a, b
    cpl
    ld b, a
    ld a, (bitmap_key_inventory)
    and b
    ld (bitmap_key_inventory), a
.key_door_mark_open:
    bit 1, c
    jp z, .key_door_open
    push hl
    ld a, (bitmap_key_work_offset)
    ld l, a
    ld h, 0
    ld de, bitmap_key_door_open_flags
    add hl, de
    ld (hl), 1
    pop hl
.key_door_open:
    call start_key_door_transition
    pop bc
    ret
.key_door_skip_rest:
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
.key_door_done:
    pop bc
    djnz .key_door_loop
    ret

; ------------------------------------------------------------
; FUNCTION: start_key_door_transition
; ------------------------------------------------------------
; PURPOSE:
;   Queue a direct transition to bitmap_pending_room using the target entry pixel
;   already stored in bitmap_key_pending_entry_x/y.
;
; INPUT:
;   bitmap_pending_room = destination room index.
;   bitmap_key_pending_entry_x/y = destination player coordinates.
;
; OUTPUT:
;   Carry SET when the transition is queued or already composing.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   None.
;
; SIDE EFFECTS:
;   Writes bitmap_composition_state, bitmap_transition_dir,
;   bitmap_pending_display_page, bitmap_composition_block_ptr and
;   bitmap_composition_blocks_left. Direction #04 tells commit_room_flip to use
;   bitmap_key_pending_entry_x/y instead of an edge spawn.
; ------------------------------------------------------------
start_key_door_transition:
    ld a, (bitmap_composition_state)
    or a
    jp nz, .key_door_already_composing
    ld a, 4
    ld (bitmap_transition_dir), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .key_door_compose_page1
    xor a
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p0
${bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p0
` : ''}    jp .key_door_select_render_program
.key_door_compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
${bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p1
` : ''}.key_door_select_render_program:
    ld a, (bitmap_pending_room)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${bankedRoomData ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_block_bank), a
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}    ld (bitmap_composition_block_ptr), hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld a, (hl)
    ld (bitmap_composition_blocks_left), a
    inc hl
    ld a, (hl)
    ld (bitmap_composition_blocks_left + 1), a
    ld a, 1
    ld (bitmap_composition_state), a
${bankedRoomData ? `    call bitmap_room_restore_resident_banks
` : ''}
.key_door_already_composing:
    scf
    ret
`;
  return { enabled: true, ramBytes, equates, initAsm, mainLoopCall, initialDrawCall, pendingPageDrawCall, routinesAsm, dataAsm };
}

// ============================================================================
// SCREEN 5 bitmap NPC dialogue system.
//
// A pixel-based re-implementation of the MSX1 Screen 2 dialogue runtime
// (componentsGenerator.ts generateAutoControlDialogueSystem), designed for the
// bitmap-room backend and fully independent from it:
//   - Trigger: 'npc' entities placed in a room; the player overlaps the NPC's
//     16x16 cell and presses the talk key (UP or SPACE) -> the dialogue opens
//     and the player update is paused (carry gate in .main_loop).
//   - Box: V9938 HMMV fills on the DISPLAYED page (2px border + interior).
//   - Typewriter: text glyphs are baked at build time into a 4bpp glyph strip
//     (32 glyphs per 256px row) stored in offscreen VRAM below the shared
//     atlas region; each typed character is ONE 8x8 HMMM blit, exactly the
//     mechanism proven by the linked-HUD counters.
//   - Talking head: each portrait is a pair of 4bpp frames (mouth closed at
//     SX=0, mouth open at SX=width) in the same offscreen blob; the mouth
//     toggles every N typed characters with one HMMM, and closes on line end.
//   - Improvements over the Screen 2 system: per-line portraits, fast-forward
//     (pressing the talk key while typing completes the line instantly), and
//     auto-advance lines (waitForInput=false).
//   - Close: the current room's render program is replayed synchronously on
//     the displayed page (same command blocks used by load_room), so the box
//     disappears and any NPC visual baked into the program is restored.
// ============================================================================

interface BitmapDialogueNpcRecord {
  roomIndex: number;
  x: number;
  y: number;
  dialogueIndex: number;
  keyMask: number; // PPI row-8 pressed mask: UP=#20, SPACE=#01
}

interface BitmapDialogueStripBuild {
  key: string;
  font: Msx2HudFontAsset | undefined;
  textColor: number;
  bgColor: number;
  chars: string[];
  charIndex: Map<string, number>;
  /** Row offset inside the dialogue VRAM blob (filled during packing). */
  blobRow: number;
}

interface BitmapDialoguePortraitBuild {
  width: number;
  height: number;
  closedPixels: number[][];
  openPixels: number[][];
  blobRow: number;
}

interface BitmapDialogueLineBuild {
  encoded: number[]; // glyph indices, #FE = newline, #FF = end
  waitForInput: boolean;
  portraitIndex: number; // global portrait index or 0xFF
}

interface BitmapDialogueConfigBuild {
  label: string;
  boxX: number;
  boxY: number; // page-local (game Y + HUD offset)
  boxW: number;
  boxH: number;
  borderClr: number;
  bgClr: number;
  charDelay: number;
  mouthInterval: number;
  textX: number;
  textY: number;
  textW: number;
  textH: number;
  stripIndex: number;
  porX: number;
  porY: number;
  porMaxW: number;
  porMaxH: number;
  lineBase: number;
  lineCount: number;
}

interface BitmapDialogueBuildData {
  npcs: BitmapDialogueNpcRecord[];
  strips: BitmapDialogueStripBuild[];
  portraits: BitmapDialoguePortraitBuild[];
  lines: BitmapDialogueLineBuild[];
  configs: BitmapDialogueConfigBuild[];
  /** Total blob rows (before base-row relocation), multiple of 8. */
  blobRows: number;
}

const BITMAP_DLG_TALK_KEY_MASKS: Record<string, number> = { up: 0x20, space: 0x01 };
const BITMAP_DLG_NEWLINE = 0xfe;
const BITMAP_DLG_END = 0xff;
const BITMAP_DLG_CFG_BYTES = 20;

function evenFloor(value: number): number {
  return value & ~1;
}

/** Chars renderable by a HUD font (bitmap glyphs, 1bpp patterns or defaults). */
function bitmapDialogueSupportedChars(font: Msx2HudFontAsset | undefined): Set<string> {
  const supported = new Set<string>(Object.keys(DEFAULT_HUD_PATTERNS));
  for (const key of Object.keys(font?.patterns || {})) supported.add(key);
  for (const key of Object.keys((font as any)?.bitmapPatterns || {})) supported.add(key);
  supported.add(' ');
  return supported;
}

/** 8x8 palette-slot glyph for one char: font bitmap glyph or 1bpp pattern. */
function buildBitmapDialogueGlyph(
  font: Msx2HudFontAsset | undefined,
  char: string,
  textColor: number,
  bgColor: number
): number[][] {
  const bitmapGlyph = normalizeScreen5HudFontGlyph(font, char, textColor, bgColor);
  if (bitmapGlyph) {
    const fontBg = clampByte(font?.screen5BackgroundSlot, bgColor) & 0x0f;
    return bitmapGlyph.map(row => row.map(slot => (slot === fontBg ? bgColor : slot)));
  }
  const pattern = font?.patterns?.[char] || DEFAULT_HUD_PATTERNS[char] || DEFAULT_HUD_PATTERNS[' '];
  return Array.from({ length: 8 }, (_unused, y) =>
    Array.from({ length: 8 }, (_unused2, x) =>
      ((Number(pattern[y]) || 0) & (0x80 >> x)) ? (textColor & 0x0f) : (bgColor & 0x0f)
    )
  );
}

/** Word-wrap normalized dialogue text into at most maxRows rows of maxCols chars. */
function wrapBitmapDialogueText(text: string, maxCols: number, maxRows: number): string[] {
  const rows: string[] = [];
  for (const paragraph of String(text || '').split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ')) {
      if (!word && current.length < maxCols) {
        continue;
      }
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCols) {
        current = candidate;
        continue;
      }
      if (current) rows.push(current);
      let chunk = word;
      while (chunk.length > maxCols) {
        rows.push(chunk.slice(0, maxCols));
        chunk = chunk.slice(maxCols);
      }
      current = chunk;
    }
    rows.push(current);
  }
  while (rows.length && rows[rows.length - 1] === '') rows.pop();
  return rows.slice(0, Math.max(1, maxRows));
}

/**
 * Collects every dialogue reachable from an 'npc' entity in the world's rooms
 * and precomputes ROM records, glyph strips, portrait frames and the packed
 * VRAM blob layout. Returns null when no room has a talking NPC (the ROM stays
 * byte-identical to exports without dialogues).
 */
function collectBitmapDialogueData(
  analysis: ProjectAnalysis,
  rooms: Msx2Screen5BitmapRoom[],
  fallbackFont: Msx2HudFontAsset | undefined
): BitmapDialogueBuildData | null {
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  const dialogueById = new Map<string, any>();
  for (const asset of assets) {
    if (asset.type === 'msx2dialogue' && asset.id && asset.data) dialogueById.set(asset.id, asset.data);
  }

  const npcs: BitmapDialogueNpcRecord[] = [];
  const dialogueIndexById = new Map<string, number>();
  const usedDialogues: any[] = [];
  for (const [roomIndex, room] of rooms.entries()) {
    for (const entity of room.entities || []) {
      if (entity.kind !== 'npc') continue;
      const npcParams = entity.params?.npcDialogue as { dialogueAssetId?: string; talkKey?: string } | undefined;
      const dialogue = npcParams?.dialogueAssetId ? dialogueById.get(npcParams.dialogueAssetId) : undefined;
      if (!dialogue || !Array.isArray(dialogue.lines) || dialogue.lines.length === 0) continue;
      let dialogueIndex = dialogueIndexById.get(npcParams!.dialogueAssetId!);
      if (dialogueIndex === undefined) {
        dialogueIndex = usedDialogues.length;
        dialogueIndexById.set(npcParams!.dialogueAssetId!, dialogueIndex);
        usedDialogues.push(dialogue);
      }
      npcs.push({
        roomIndex,
        x: clampByte((entity.position?.x ?? 0) * TILE_GRID_SIZE, 0) & 0xff,
        y: clampByte((entity.position?.y ?? 0) * TILE_GRID_SIZE, 0) & 0xff,
        dialogueIndex,
        keyMask: BITMAP_DLG_TALK_KEY_MASKS[npcParams?.talkKey || 'up'] ?? BITMAP_DLG_TALK_KEY_MASKS.up,
      });
    }
  }
  if (npcs.length === 0) return null;
  if (usedDialogues.length > 255) {
    throw new Error(`MSX2 bitmap dialogue system supports at most 255 dialogues per world (got ${usedDialogues.length}).`);
  }

  const strips: BitmapDialogueStripBuild[] = [];
  const stripByKey = new Map<string, number>();
  const portraits: BitmapDialoguePortraitBuild[] = [];
  const lines: BitmapDialogueLineBuild[] = [];
  const configs: BitmapDialogueConfigBuild[] = [];

  usedDialogues.forEach((dialogue, dialogueIndex) => {
    const box = dialogue.box || {};
    const fontAsset = findBitmapHudFontAsset(assets, dialogue.fontAssetId) || fallbackFont;
    const textColor = clampByte(box.textColor, 15) & 0x0f;
    const bgColor = clampByte(box.backgroundColor, 1) & 0x0f;
    const borderColor = clampByte(box.borderColor, 15) & 0x0f;

    // --- Portraits: normalize dims to multiples of 8 (max 48x48). ---
    const assetPortraits = (Array.isArray(dialogue.portraits) ? dialogue.portraits : []) as any[];
    const portraitIndexById = new Map<string, number>();
    let porMaxW = 0;
    let porMaxH = 0;
    for (const portrait of assetPortraits) {
      if (!portrait?.id) continue;
      const width = Math.max(8, Math.min(48, Math.round((Number(portrait.width) || 32) / 8) * 8));
      const height = Math.max(8, Math.min(48, Math.round((Number(portrait.height) || 32) / 8) * 8));
      const normalizeFrame = (pixels: any): number[][] =>
        Array.from({ length: height }, (_unused, y) =>
          Array.from({ length: width }, (_unused2, x) => clampByte(pixels?.[y]?.[x], bgColor) & 0x0f)
        );
      portraitIndexById.set(String(portrait.id), portraits.length);
      portraits.push({
        width,
        height,
        closedPixels: normalizeFrame(portrait.closedPixels),
        openPixels: normalizeFrame(portrait.openPixels),
        blobRow: 0,
      });
      porMaxW = Math.max(porMaxW, width);
      porMaxH = Math.max(porMaxH, height);
    }
    const resolvePortraitIndex = (portraitId: string | undefined): number => {
      const id = portraitId || dialogue.defaultPortraitId;
      const index = id ? portraitIndexById.get(String(id)) : undefined;
      return index === undefined ? 0xff : index;
    };
    const anyPortrait = (Array.isArray(dialogue.lines) ? dialogue.lines : [])
      .some((line: any) => resolvePortraitIndex(line?.portraitId) !== 0xff);
    if (!anyPortrait) {
      porMaxW = 0;
      porMaxH = 0;
    }

    // --- Box layout. HMMV/HMMM are byte-based: X coords and widths stay even. ---
    const boxW = Math.max(48, Math.min(254, evenFloor(clampInt(box.width, 16, 254, 240))));
    const boxH = Math.max(24, Math.min(SCREEN_HEIGHT_DEFAULT, clampInt(box.height, 24, SCREEN_HEIGHT_DEFAULT, 64)));
    const boxX = evenFloor(clampInt(box.x, 0, SCREEN_WIDTH - boxW, 8));
    const boxGameY = clampInt(box.y, 0, SCREEN_HEIGHT_DEFAULT - boxH, Math.max(0, SCREEN_HEIGHT_DEFAULT - boxH - 8));
    const padding = evenFloor(clampInt(box.padding, 0, 8, 4));
    const side = box.portraitSide === 'right' ? 'right' : 'left';
    const interiorX = boxX + 2;
    const interiorY = boxGameY + 2;
    const interiorW = boxW - 4;
    const interiorH = boxH - 4;
    const porX = porMaxW === 0
      ? 0
      : (side === 'left' ? interiorX + padding : evenFloor(interiorX + interiorW - padding - porMaxW));
    const porY = porMaxH === 0 ? 0 : interiorY + padding;
    const textX = porMaxW === 0 || side === 'right'
      ? interiorX + padding
      : porX + porMaxW + padding;
    const textAvailW = side === 'right'
      ? (porMaxW === 0 ? interiorW - 2 * padding : porX - padding - textX)
      : interiorX + interiorW - padding - textX;
    const textCols = Math.floor(textAvailW / 8);
    const textRows = Math.floor((interiorH - 2 * padding) / 8);
    if (textCols < 4 || textRows < 1) {
      throw new Error(`MSX2 dialogue "${dialogue.name || dialogueIndex}": the box is too small for its portrait/padding (text area = ${textCols} cols x ${textRows} rows). Enlarge the box or shrink the portrait.`);
    }

    // --- Glyph strip (deduped by font+colors). ---
    const fontKey = String(dialogue.fontAssetId || (fontAsset ? 'room-font' : 'default'));
    const stripKey = `${fontKey}|${textColor}|${bgColor}`;
    let stripIndex = stripByKey.get(stripKey);
    if (stripIndex === undefined) {
      stripIndex = strips.length;
      stripByKey.set(stripKey, stripIndex);
      strips.push({ key: stripKey, font: fontAsset, textColor, bgColor, chars: [' '], charIndex: new Map([[' ', 0]]), blobRow: 0 });
    }
    const strip = strips[stripIndex];
    const supported = bitmapDialogueSupportedChars(strip.font);
    const stripUnsupported = dialogue.exportOptions?.stripUnsupportedChars !== false;

    // --- Lines: prefix speaker, normalize, wrap, encode. ---
    const lineBase = lines.length;
    const dialogueLines = (Array.isArray(dialogue.lines) ? dialogue.lines : []) as any[];
    for (const line of dialogueLines) {
      const speakerPrefix = line?.speaker ? `${String(line.speaker)}: ` : '';
      const rawText = `${speakerPrefix}${String(line?.text || '')}`.toUpperCase();
      const normalized = Array.from(rawText)
        .map(char => (char === '\n' || supported.has(char) ? char : (stripUnsupported ? ' ' : char)))
        .map(char => (char === '\n' || supported.has(char) ? char : ' '))
        .join('');
      const rows = wrapBitmapDialogueText(normalized, textCols, textRows);
      const encoded: number[] = [];
      rows.forEach((row, rowIndex) => {
        if (rowIndex > 0) encoded.push(BITMAP_DLG_NEWLINE);
        for (const char of Array.from(row)) {
          let glyphIndex = strip.charIndex.get(char);
          if (glyphIndex === undefined) {
            glyphIndex = strip.chars.length;
            if (glyphIndex >= BITMAP_DLG_NEWLINE) {
              throw new Error(`MSX2 dialogue glyph strip overflow: more than ${BITMAP_DLG_NEWLINE - 1} distinct characters share the same font/colors. Split dialogues across styles or reduce the charset.`);
            }
            strip.chars.push(char);
            strip.charIndex.set(char, glyphIndex);
          }
          encoded.push(glyphIndex);
        }
      });
      encoded.push(BITMAP_DLG_END);
      lines.push({
        encoded,
        waitForInput: line?.waitForInput !== false,
        portraitIndex: anyPortrait ? resolvePortraitIndex(line?.portraitId) : 0xff,
      });
    }
    if (lines.length > 255) {
      throw new Error(`MSX2 bitmap dialogue system supports at most 255 lines across all dialogues (got ${lines.length}).`);
    }

    configs.push({
      label: `bitmap_dlg_cfg_${dialogueIndex}`,
      boxX,
      boxY: boxGameY + BITMAP_ROOM_GAME_Y_OFFSET,
      boxW,
      boxH,
      borderClr: (borderColor << 4) | borderColor,
      bgClr: (bgColor << 4) | bgColor,
      charDelay: clampByte(dialogue.exportOptions?.charDelayFrames, 3),
      mouthInterval: clampByte(dialogue.exportOptions?.mouthToggleEveryChars, 2),
      textX,
      textY: interiorY + padding + BITMAP_ROOM_GAME_Y_OFFSET,
      textW: textCols * 8,
      textH: textRows * 8,
      stripIndex,
      porX,
      porY: porY + (porMaxH === 0 ? 0 : BITMAP_ROOM_GAME_Y_OFFSET),
      porMaxW,
      porMaxH,
      lineBase,
      lineCount: dialogueLines.length,
    });
  });

  // --- Pack the VRAM blob: strips first, then portrait frame pairs. ---
  let blobRow = 0;
  for (const strip of strips) {
    strip.blobRow = blobRow;
    blobRow += Math.ceil(strip.chars.length / 32) * 8;
  }
  for (const portrait of portraits) {
    if (portrait.width * 2 > SCREEN_WIDTH) {
      throw new Error(`MSX2 dialogue portrait too wide: both mouth frames must fit one 256px VRAM row (width <= 128px).`);
    }
    portrait.blobRow = blobRow;
    blobRow += portrait.height;
  }
  return { npcs, strips, portraits, lines, configs, blobRows: Math.ceil(blobRow / 8) * 8 };
}

/** Renders the dialogue VRAM blob (glyph strips + portrait frame pairs) as pixel rows. */
function buildBitmapDialogueBlobPixels(data: BitmapDialogueBuildData): number[][] {
  const rows: number[][] = Array.from({ length: data.blobRows }, () => Array.from({ length: SCREEN_WIDTH }, () => 0));
  for (const strip of data.strips) {
    strip.chars.forEach((char, index) => {
      const glyph = buildBitmapDialogueGlyph(strip.font, char, strip.textColor, strip.bgColor);
      const gx = (index % 32) * 8;
      const gy = strip.blobRow + Math.floor(index / 32) * 8;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) rows[gy + y][gx + x] = glyph[y][x] & 0x0f;
      }
    });
  }
  for (const portrait of data.portraits) {
    for (let y = 0; y < portrait.height; y++) {
      for (let x = 0; x < portrait.width; x++) {
        rows[portrait.blobRow + y][x] = portrait.closedPixels[y][x] & 0x0f;
        rows[portrait.blobRow + y][portrait.width + x] = portrait.openPixels[y][x] & 0x0f;
      }
    }
  }
  return rows;
}

function buildBitmapDialogueSystemAsm(
  data: BitmapDialogueBuildData | null,
  rooms: Msx2Screen5BitmapRoom[],
  hitbox: BitmapPlayerHitbox,
  ramBase: number,
  vramBaseRow: number,
  uploadAsm: string,
  keyDoorVisibleDrawCall: string,
  bankedRoomData: boolean
): {
  enabled: boolean;
  ramBytes: number;
  equates: string;
  initAsm: string;
  uploadCallAsm: string;
  mainLoopGateAsm: string;
  routinesAsm: string;
  dataAsm: string;
} {
  if (!data) {
    return { enabled: false, ramBytes: 0, equates: '', initAsm: '', uploadCallAsm: '', mainLoopGateAsm: '', routinesAsm: '', dataAsm: '' };
  }

  // RAM layout: 20-byte config mirror (LDIR'd from the ROM record on open) +
  // runtime state. Chained after the skills/HUD/key-door RAM like every other
  // optional system (ceiling #C1F0 checked by the caller).
  const cfg = ramBase;
  const state = cfg + BITMAP_DLG_CFG_BYTES;
  const ramBytes = BITMAP_DLG_CFG_BYTES + 15;
  const equates = `; SCREEN 5 bitmap NPC dialogue system. Config mirror (20B, LDIR'd on open) + state.
bitmap_dlg_cfg             EQU ${hexWord(cfg)}
bitmap_dlg_cfg_box_x       EQU ${hexWord(cfg + 0)}
bitmap_dlg_cfg_box_y       EQU ${hexWord(cfg + 1)}
bitmap_dlg_cfg_box_w       EQU ${hexWord(cfg + 2)}
bitmap_dlg_cfg_box_h       EQU ${hexWord(cfg + 3)}
bitmap_dlg_cfg_border_clr  EQU ${hexWord(cfg + 4)}
bitmap_dlg_cfg_bg_clr      EQU ${hexWord(cfg + 5)}
bitmap_dlg_cfg_delay       EQU ${hexWord(cfg + 6)}
bitmap_dlg_cfg_mouth_int   EQU ${hexWord(cfg + 7)}
bitmap_dlg_cfg_text_x      EQU ${hexWord(cfg + 8)}
bitmap_dlg_cfg_text_y      EQU ${hexWord(cfg + 9)}
bitmap_dlg_cfg_text_w      EQU ${hexWord(cfg + 10)}
bitmap_dlg_cfg_text_h      EQU ${hexWord(cfg + 11)}
bitmap_dlg_cfg_strip_sy    EQU ${hexWord(cfg + 12)}
bitmap_dlg_cfg_por_x       EQU ${hexWord(cfg + 14)}
bitmap_dlg_cfg_por_y       EQU ${hexWord(cfg + 15)}
bitmap_dlg_cfg_por_max_w   EQU ${hexWord(cfg + 16)}
bitmap_dlg_cfg_por_max_h   EQU ${hexWord(cfg + 17)}
bitmap_dlg_cfg_line_base   EQU ${hexWord(cfg + 18)}
bitmap_dlg_cfg_line_count  EQU ${hexWord(cfg + 19)}
bitmap_dlg_state           EQU ${hexWord(state + 0)}
bitmap_dlg_lock            EQU ${hexWord(state + 1)}
bitmap_dlg_line            EQU ${hexWord(state + 2)}
bitmap_dlg_lines_left      EQU ${hexWord(state + 3)}
bitmap_dlg_text_ptr        EQU ${hexWord(state + 4)}
bitmap_dlg_delay           EQU ${hexWord(state + 6)}
bitmap_dlg_mouth_count     EQU ${hexWord(state + 7)}
bitmap_dlg_mouth_state     EQU ${hexWord(state + 8)}
bitmap_dlg_portrait        EQU ${hexWord(state + 9)}
bitmap_dlg_cursor_x        EQU ${hexWord(state + 10)}
bitmap_dlg_cursor_y        EQU ${hexWord(state + 11)}
bitmap_dlg_key_mask        EQU ${hexWord(state + 12)}
bitmap_dlg_wait_flags      EQU ${hexWord(state + 13)}
bitmap_dlg_scratch_idx     EQU ${hexWord(state + 14)}
bitmap_dlg_cmd_block       EQU #C2C0
`;

  const initAsm = `    ; NPC dialogue system: start idle with the talk key unlatched.
    xor a
    ld (bitmap_dlg_state), a
    ld (bitmap_dlg_lock), a
    ld (bitmap_dlg_mouth_state), a
    ld (bitmap_dlg_mouth_count), a
`;

  const uploadCallAsm = `    call upload_bitmap_dialogue_gfx\n`;
  const mainLoopGateAsm = `    call bitmap_dialogue_frame      ; NPC talk: open/advance dialogue; carry = player paused
    jp c, .skip_player_movement
`;

  const hbLeft = hitbox.x;
  const hbRight = hitbox.x + hitbox.w - 1;
  const hbTop = hitbox.y;
  const hbBottom = hitbox.y + hitbox.h - 1;
  const addA = (n: number) => (n > 0 ? `    add a, ${n}\n` : '');

  const routinesAsm = `
; ------------------------------------------------------------
; FUNCTION: upload_bitmap_dialogue_gfx
; ------------------------------------------------------------
; PURPOSE:
;   Upload the dialogue glyph strips + portrait frame pairs (packed 4bpp RLE)
;   to offscreen VRAM rows ${vramBaseRow}..${vramBaseRow + data.blobRows - 1}, once at boot after the atlas.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
upload_bitmap_dialogue_gfx:
${uploadAsm}

; ------------------------------------------------------------
; FUNCTION: bitmap_dialogue_frame
; ------------------------------------------------------------
; PURPOSE:
;   Per-frame NPC dialogue driver, called before update_player_movement.
;   Idle: scans the current room's NPC records; player-overlap + talk key
;   opens the dialogue. Active: runs the typewriter (state 1) or the
;   line-advance wait (state 2). All VDP work targets the DISPLAYED page.
;
; OUTPUT:
;   Carry SET while a dialogue owns the frame (player update paused);
;   carry CLEAR when the game runs normally.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; SIDE EFFECTS:
;   Uses bitmap_dlg_cmd_block scratch (#C2C0, shared serialized scratch) and
;   restores VDP R#15 to S#0 before returning from any active state.
; ------------------------------------------------------------
bitmap_dialogue_frame:
    call bitmap_dlg_read_keys
    ld c, a
    ; Release the talk latch only when BOTH talk keys (UP + SPACE) are up, so
    ; a held key cannot re-trigger, skip a line or leak a jump on close.
    ld a, (bitmap_dlg_lock)
    or a
    jp z, .dlg_lock_ok
    ld a, c
    and #21
    jp nz, .dlg_lock_ok
    xor a
    ld (bitmap_dlg_lock), a
.dlg_lock_ok:
    ld a, (bitmap_dlg_state)
    or a
    jp z, .dlg_idle
    cp 1
    jp z, .dlg_typing
    jp .dlg_wait_advance

.dlg_idle:
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_idle_no
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_dlg_npc_count_table
    add hl, de
    ld a, (hl)
    or a
    jp z, .dlg_idle_no
    ld b, a
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_dlg_npc_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
.dlg_scan_loop:
    push bc
    ld d, (hl)
    inc hl
    ld e, (hl)
    inc hl
    ld a, (hl)
    inc hl
    ld (bitmap_dlg_scratch_idx), a
    ld a, (hl)
    inc hl
    ld (bitmap_dlg_key_mask), a
    and c
    jp z, .dlg_scan_next
    push hl
    call bitmap_dlg_overlaps
    pop hl
    or a
    jp z, .dlg_scan_next
    pop bc
    ld a, 1
    ld (bitmap_dlg_lock), a
    ld a, (bitmap_dlg_scratch_idx)
    call bitmap_dlg_open
    jp .dlg_consume
.dlg_scan_next:
    pop bc
    djnz .dlg_scan_loop
.dlg_idle_no:
    or a
    ret

.dlg_typing:
    ; Fast-forward: a fresh talk-key press while typing completes the line now.
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_no_ff
    ld a, (bitmap_dlg_key_mask)
    and c
    jp z, .dlg_no_ff
    ld a, 1
    ld (bitmap_dlg_lock), a
.dlg_ff_loop:
    call bitmap_dlg_emit_char
    jp nc, .dlg_ff_loop
    jp .dlg_line_finished
.dlg_no_ff:
    ld a, (bitmap_dlg_delay)
    or a
    jp z, .dlg_tick
    dec a
    ld (bitmap_dlg_delay), a
    jp .dlg_consume
.dlg_tick:
    call bitmap_dlg_emit_char
    jp c, .dlg_line_finished
    ld a, (bitmap_dlg_cfg_delay)
    ld (bitmap_dlg_delay), a
    jp .dlg_consume
.dlg_line_finished:
    ; Always finish a line with the mouth closed.
    ld a, (bitmap_dlg_mouth_state)
    or a
    jp z, .dlg_mouth_closed
    xor a
    ld (bitmap_dlg_mouth_state), a
    call bitmap_dlg_draw_portrait_frame
.dlg_mouth_closed:
    ld a, 2
    ld (bitmap_dlg_state), a
    jp .dlg_consume

.dlg_wait_advance:
    ld a, (bitmap_dlg_wait_flags)
    bit 0, a
    jp z, .dlg_do_advance       ; waitForInput=false: auto-advance
    ld a, (bitmap_dlg_lock)
    or a
    jp nz, .dlg_consume
    ld a, (bitmap_dlg_key_mask)
    and c
    jp z, .dlg_consume
    ld a, 1
    ld (bitmap_dlg_lock), a
.dlg_do_advance:
    ld a, (bitmap_dlg_lines_left)
    dec a
    ld (bitmap_dlg_lines_left), a
    or a
    jp z, .dlg_close
    ld a, (bitmap_dlg_line)
    inc a
    call bitmap_dlg_start_line
    jp .dlg_consume
.dlg_close:
    call bitmap_dlg_close_box
.dlg_consume:
    ; Command-engine polls left R#15 at S#2; the main loop's vblank wait
    ; assumes S#0 (same contract as load_room).
    ld a, #0F
    ld e, #00
    call vdp_write_register
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_read_keys
; ------------------------------------------------------------
; PURPOSE: Read PPI keyboard row 8. A = pressed mask (UP=#20, SPACE=#01).
; DESTROYS: AF
; ------------------------------------------------------------
bitmap_dlg_read_keys:
    in a, (PPI_C)
    and #F0
    or 8
    out (PPI_C), a
    in a, (PPI_B)
    cpl
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_overlaps
; ------------------------------------------------------------
; PURPOSE:
;   Test the configured player body hitbox against a 16x16 NPC cell.
;   Self-contained copy of the key/door overlap test (that routine is only
;   emitted when pickups/doors exist).
; INPUT:  D = NPC X in pixels, E = NPC Y in pixels.
; OUTPUT: A = 1 and NZ when overlapping; A = 0 and Z when separated.
; DESTROYS: AF, B
; PRESERVES: C, DE, HL, IX, IY
; ------------------------------------------------------------
bitmap_dlg_overlaps:
    ld a, (player_x)
${addA(hbRight)}    cp d
    jp c, .dlg_overlap_no
    ld a, d
    add a, 15
    ld b, a
    ld a, (player_x)
${addA(hbLeft)}    cp b
    jp z, .dlg_overlap_x_ok
    jp nc, .dlg_overlap_no
.dlg_overlap_x_ok:
    ld a, (player_y)
${addA(hbBottom)}    cp e
    jp c, .dlg_overlap_no
    ld a, e
    add a, 15
    ld b, a
    ld a, (player_y)
${addA(hbTop)}    cp b
    jp z, .dlg_overlap_yes
    jp nc, .dlg_overlap_no
.dlg_overlap_yes:
    ld a, 1
    or a
    ret
.dlg_overlap_no:
    xor a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_open
; ------------------------------------------------------------
; PURPOSE:
;   Open dialogue A: LDIR its 20-byte config record into RAM, draw the box
;   (border + interior HMMV fills) and start its first line.
; INPUT: A = dialogue index.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_open:
    ld l, a
    ld h, 0
    add hl, hl
    ld de, bitmap_dlg_cfg_ptr_table
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_dlg_cfg
    ld bc, ${BITMAP_DLG_CFG_BYTES}
    ldir
    call bitmap_dlg_draw_box
    ld a, (bitmap_dlg_cfg_line_count)
    ld (bitmap_dlg_lines_left), a
    ld a, (bitmap_dlg_cfg_line_base)
    jp bitmap_dlg_start_line

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_start_line
; ------------------------------------------------------------
; PURPOSE:
;   Begin global line A: load its record (text pointer, flags, portrait),
;   clear the text area, redraw the portrait mouth-closed, reset the cursor
;   and switch to the typing state.
; INPUT: A = global line index.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_start_line:
    ld (bitmap_dlg_line), a
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, bitmap_dlg_line_records
    add hl, de
    ld a, (hl)
    ld (bitmap_dlg_text_ptr), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_text_ptr + 1), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_wait_flags), a
    inc hl
    ld a, (hl)
    ld (bitmap_dlg_portrait), a
    ; Clear the text area to the box background.
    ld a, (bitmap_dlg_cfg_text_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_text_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_text_w)
    ld c, a
    ld a, (bitmap_dlg_cfg_text_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    call bitmap_dlg_fill_rect
    ; Portrait: clear its max area, then draw this line's closed frame.
    ld a, (bitmap_dlg_portrait)
    cp #FF
    jp z, .dlg_start_no_portrait
    ld a, (bitmap_dlg_cfg_por_max_w)
    or a
    jp z, .dlg_start_no_portrait
    ld c, a
    ld a, (bitmap_dlg_cfg_por_max_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_por_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_por_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    call bitmap_dlg_fill_rect
    xor a
    ld (bitmap_dlg_mouth_state), a
    call bitmap_dlg_draw_portrait_frame
.dlg_start_no_portrait:
    ld a, (bitmap_dlg_cfg_text_x)
    ld (bitmap_dlg_cursor_x), a
    ld a, (bitmap_dlg_cfg_text_y)
    ld (bitmap_dlg_cursor_y), a
    xor a
    ld (bitmap_dlg_mouth_count), a
    ld (bitmap_dlg_delay), a
    ld a, 1
    ld (bitmap_dlg_state), a
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_emit_char
; ------------------------------------------------------------
; PURPOSE:
;   Typewriter step: read the next text byte. Glyph -> one 8x8 HMMM from the
;   glyph strip to the cursor (+ mouth cadence); #FE -> newline; #FF -> end.
; OUTPUT: carry SET when the line just ended, carry CLEAR otherwise.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_emit_char:
    ld hl, (bitmap_dlg_text_ptr)
    ld a, (hl)
    cp ${BITMAP_DLG_END}
    jp z, .dlg_char_end
    inc hl
    ld (bitmap_dlg_text_ptr), hl
    cp ${BITMAP_DLG_NEWLINE}
    jp z, .dlg_char_newline
    ld c, a                       ; C = glyph index
    ; SX = (idx & 31) * 8
    and #1F
    add a, a
    add a, a
    add a, a
    ld (bitmap_dlg_cmd_block + 0), a
    xor a
    ld (bitmap_dlg_cmd_block + 1), a
    ; SY = strip base + ((idx >> 5) * 8) = strip base + ((idx & #E0) >> 2)
    ld a, c
    and #E0
    rrca
    rrca
    ld e, a
    ld d, 0
    ld hl, (bitmap_dlg_cfg_strip_sy)
    add hl, de
    ld a, l
    ld (bitmap_dlg_cmd_block + 2), a
    ld a, h
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, (bitmap_dlg_cursor_x)
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, (bitmap_dlg_cursor_y)
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, 8
    ld (bitmap_dlg_cmd_block + 8), a
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 12), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #D0                     ; HMMM
    ld (bitmap_dlg_cmd_block + 14), a
    call bitmap_dlg_launch_cmd
    ld a, (bitmap_dlg_cursor_x)
    add a, 8
    ld (bitmap_dlg_cursor_x), a
    ; Mouth cadence: toggle every cfg_mouth_int typed characters.
    ld a, (bitmap_dlg_cfg_mouth_int)
    or a
    jp z, .dlg_char_done
    ld a, (bitmap_dlg_mouth_count)
    inc a
    ld (bitmap_dlg_mouth_count), a
    ld hl, bitmap_dlg_cfg_mouth_int
    cp (hl)
    jp c, .dlg_char_done
    xor a
    ld (bitmap_dlg_mouth_count), a
    ld a, (bitmap_dlg_portrait)
    cp #FF
    jp z, .dlg_char_done
    ld a, (bitmap_dlg_mouth_state)
    xor 1
    ld (bitmap_dlg_mouth_state), a
    call bitmap_dlg_draw_portrait_frame
.dlg_char_done:
    or a
    ret
.dlg_char_newline:
    ld a, (bitmap_dlg_cfg_text_x)
    ld (bitmap_dlg_cursor_x), a
    ld a, (bitmap_dlg_cursor_y)
    add a, 8
    ld (bitmap_dlg_cursor_y), a
    or a
    ret
.dlg_char_end:
    scf
    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_draw_portrait_frame
; ------------------------------------------------------------
; PURPOSE:
;   HMMM the current portrait's frame (bitmap_dlg_mouth_state: 0 = closed at
;   SX=0, 1 = open at SX=width) to the box's portrait slot on the displayed page.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_draw_portrait_frame:
    ld a, (bitmap_dlg_portrait)
    cp #FF
    ret z
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, bitmap_dlg_portrait_records
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld c, (hl)                    ; C = width
    inc hl
    ld b, (hl)                    ; B = height
    ld a, (bitmap_dlg_mouth_state)
    or a
    jp z, .dlg_por_closed
    ld a, c                       ; open frame lives at SX = width
    jp .dlg_por_have_sx
.dlg_por_closed:
    xor a
.dlg_por_have_sx:
    ld (bitmap_dlg_cmd_block + 0), a
    xor a
    ld (bitmap_dlg_cmd_block + 1), a
    ld a, e
    ld (bitmap_dlg_cmd_block + 2), a
    ld a, d
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, (bitmap_dlg_cfg_por_x)
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, (bitmap_dlg_cfg_por_y)
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, c
    ld (bitmap_dlg_cmd_block + 8), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld a, b
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 12), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #D0                     ; HMMM
    ld (bitmap_dlg_cmd_block + 14), a
    jp bitmap_dlg_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_fill_rect
; ------------------------------------------------------------
; PURPOSE: HMMV fill on the displayed page.
; INPUT: D = x, E = y (page-local), C = width, B = height, A = colour byte.
; DESTROYS: AF, HL (BC/DE preserved)
; ------------------------------------------------------------
bitmap_dlg_fill_rect:
    ld (bitmap_dlg_cmd_block + 12), a
    xor a
    ld (bitmap_dlg_cmd_block + 0), a
    ld (bitmap_dlg_cmd_block + 1), a
    ld (bitmap_dlg_cmd_block + 2), a
    ld (bitmap_dlg_cmd_block + 3), a
    ld a, d
    ld (bitmap_dlg_cmd_block + 4), a
    xor a
    ld (bitmap_dlg_cmd_block + 5), a
    ld a, e
    ld (bitmap_dlg_cmd_block + 6), a
    ld a, (bitmap_displayed_page)
    ld (bitmap_dlg_cmd_block + 7), a
    ld a, c
    ld (bitmap_dlg_cmd_block + 8), a
    xor a
    ld (bitmap_dlg_cmd_block + 9), a
    ld a, b
    ld (bitmap_dlg_cmd_block + 10), a
    xor a
    ld (bitmap_dlg_cmd_block + 11), a
    ld (bitmap_dlg_cmd_block + 13), a
    ld a, #C0                     ; HMMV
    ld (bitmap_dlg_cmd_block + 14), a
    jp bitmap_dlg_launch_cmd

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_draw_box
; ------------------------------------------------------------
; PURPOSE: Border fill + interior fill (2px frame) from the config mirror.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_draw_box:
    ld a, (bitmap_dlg_cfg_box_x)
    ld d, a
    ld a, (bitmap_dlg_cfg_box_y)
    ld e, a
    ld a, (bitmap_dlg_cfg_box_w)
    ld c, a
    ld a, (bitmap_dlg_cfg_box_h)
    ld b, a
    ld a, (bitmap_dlg_cfg_border_clr)
    call bitmap_dlg_fill_rect
    ld a, (bitmap_dlg_cfg_box_x)
    add a, 2
    ld d, a
    ld a, (bitmap_dlg_cfg_box_y)
    add a, 2
    ld e, a
    ld a, (bitmap_dlg_cfg_box_w)
    sub 4
    ld c, a
    ld a, (bitmap_dlg_cfg_box_h)
    sub 4
    ld b, a
    ld a, (bitmap_dlg_cfg_bg_clr)
    jp bitmap_dlg_fill_rect

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_close_box
; ------------------------------------------------------------
; PURPOSE:
;   Close the dialogue: replay the current room's render program on the
;   DISPLAYED page (same blocks load_room uses), restoring the background
;   under the box${keyDoorVisibleDrawCall ? ' and re-applying door state visuals' : ''}. The talk latch stays set so the
;   held key must be released before it can jump or reopen the dialogue.
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
bitmap_dlg_close_box:
    xor a
    ld (bitmap_dlg_state), a
    ld a, (bitmap_displayed_page)
    or a
    jp z, .dlg_close_p0
    ld hl, bitmap_room_render_ptr_table_p1
${bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p1
` : ''}    jp .dlg_close_have_table
.dlg_close_p0:
    ld hl, bitmap_room_render_ptr_table_p0
${bankedRoomData ? `    ld bc, bitmap_room_render_bank_table_p0
` : ''}
.dlg_close_have_table:
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
${bankedRoomData ? `    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    call bitmap_room_select_data_bank_a
    pop hl
` : ''}
    push hl
    ld hl, bitmap_room_blockcount_table
    add hl, de
    add hl, de
    ld c, (hl)
    inc hl
    ld b, (hl)
    pop hl
    call replay_room_commands
${bankedRoomData ? `    call bitmap_room_restore_resident_banks
` : ''}${keyDoorVisibleDrawCall}    ret

; ------------------------------------------------------------
; FUNCTION: bitmap_dlg_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Submit the 15-byte V9938 command in bitmap_dlg_cmd_block: wait for the
;   previous command, point indirect writes at R#32 and stream the block.
; DESTROYS: AF, (uses HL' none) - preserves BC, DE, HL via push/pop.
; ------------------------------------------------------------
bitmap_dlg_launch_cmd:
    push bc
    push de
    push hl
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, bitmap_dlg_cmd_block
    ld b, ${VDP_CMD_BLOCK_SIZE}
.dlg_launch_write:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .dlg_launch_write
    pop hl
    pop de
    pop bc
    ret
`;

  // --- ROM tables. All resident (read every frame; never bank-switched). ---
  const npcTables = rooms.map((_room, roomIndex) => data.npcs.filter(npc => npc.roomIndex === roomIndex));
  const npcDataAsm = npcTables.map((items, roomIndex) =>
    items.length
      ? formatBytes(`bitmap_dlg_npcs_room_${roomIndex}`, items.flatMap(npc => [npc.x, npc.y, npc.dialogueIndex, npc.keyMask]), `Room ${roomIndex} NPC records: x,y,dialogueIndex,talkKeyMask`)
      : `bitmap_dlg_npcs_room_${roomIndex}:\n`
  ).join('');
  const configDataAsm = data.configs.map(config =>
    formatBytes(config.label, [
      config.boxX, config.boxY, config.boxW, config.boxH,
      config.borderClr, config.bgClr,
      config.charDelay, config.mouthInterval,
      config.textX, config.textY, config.textW, config.textH,
      (vramBaseRow + data.strips[config.stripIndex].blobRow) & 0xff,
      ((vramBaseRow + data.strips[config.stripIndex].blobRow) >> 8) & 0xff,
      config.porX, config.porY, config.porMaxW, config.porMaxH,
      config.lineBase, config.lineCount,
    ], `Dialogue config: boxX,boxY,boxW,boxH,borderClr,bgClr,delay,mouthInt,textX,textY,textW,textH,stripSY(w),porX,porY,porMaxW,porMaxH,lineBase,lineCount`)
  ).join('');
  const lineTextDataAsm = data.lines.map((line, index) =>
    formatBytes(`bitmap_dlg_text_${index}`, line.encoded, `Dialogue line ${index} glyph indices (#FE newline, #FF end)`)
  ).join('');
  const lineRecordsAsm = `; 4 bytes/line: text ptr (word), flags (bit0 = waitForInput), portrait index (#FF none)
bitmap_dlg_line_records:\n${data.lines.map((line, index) =>
    `    DW bitmap_dlg_text_${index}\n    DB ${line.waitForInput ? 1 : 0}, ${hexByte(line.portraitIndex)}`
  ).join('\n')}\n`;
  const portraitRecordsAsm = data.portraits.length
    ? formatBytes('bitmap_dlg_portrait_records', data.portraits.flatMap(portrait => [
        (vramBaseRow + portrait.blobRow) & 0xff,
        ((vramBaseRow + portrait.blobRow) >> 8) & 0xff,
        portrait.width,
        portrait.height,
      ]), 'Portrait records: frameSY(word), width, height (closed at SX=0, open at SX=width)')
    : 'bitmap_dlg_portrait_records:\n';
  const dataAsm = `${npcDataAsm}bitmap_dlg_npc_ptr_table:
${npcTables.map((_items, roomIndex) => `    DW bitmap_dlg_npcs_room_${roomIndex}`).join('\n')}
bitmap_dlg_npc_count_table:
    DB ${npcTables.map(items => items.length).join(',')}
bitmap_dlg_cfg_ptr_table:
${data.configs.map(config => `    DW ${config.label}`).join('\n')}
${configDataAsm}${lineRecordsAsm}${lineTextDataAsm}${portraitRecordsAsm}`;

  return { enabled: true, ramBytes, equates, initAsm, uploadCallAsm, mainLoopGateAsm, routinesAsm, dataAsm };
}

// Build the SCREEN 5 bitmap hearts HUD: one heart per point of player_health,
// drawn into the top-left of the 20px HUD band. Heart tiles (full + empty
// outline) are baked at build time and uploaded once to a fixed page-0 offscreen
// slot (VRAM #7000, Y=224); update_hud_hearts copies them via HMMM to the VISIBLE
// page only, on a dirty-flag (redraws when player_health changes).
//
// v1 limits: maxHealth is clamped to BITMAP_HUD_HEART_MAX_SLOTS (12) hearts; the
// 8x8 overflow path for >12 is a documented follow-up.
function buildBitmapHeartsHudAsm(maxHealthRaw: number, heartUploadAsm: string): {
  equates: string;
  routinesAsm: string;
  initAsm: string;
  mainLoopCall: string;
} {
  const slotCount = Math.max(0, Math.min(BITMAP_HUD_HEART_MAX_SLOTS, Math.floor(maxHealthRaw) || 0));
  if (slotCount === 0) {
    // No hearts to draw (maxHealth <= 0 after clamp): emit nothing, keep the ROM clean.
    return { equates: '', routinesAsm: '', initAsm: '', mainLoopCall: '' };
  }
  const heartTileYByte = `#${(BITMAP_HUD_HEART_TILE_Y & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
  const nxByte = `#${(BITMAP_HUD_HEART_NX & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
  const emptySx = BITMAP_HUD_HEART_EMPTY_SX;
  const firstX = BITMAP_HUD_HEART_FIRST_X;
  const destY = BITMAP_HUD_HEART_DEST_Y;
  // EQUs: 1 byte dirty-flag (#C1FC, the last free gap before player_health) +
  // 15-byte command scratch (#C2C0, right after the 192-byte behavior map).
  const equates = `; Hearts HUD (SCREEN 5 bitmap). Dirty-flag + 15-byte V9938 command scratch.
hud_hearts_drawn EQU #C1FC
hud_cmd_block    EQU #C2C0
`;
  const initAsm = `    ; Upload heart tiles (full + empty) to the page-0 offscreen slot and force
    ; a redraw on frame 1 by seeding the dirty flag with an impossible value.
    call upload_hud_hearts
    ld a, #FF
    ld (hud_hearts_drawn), a
`;
  const mainLoopCall = `    call update_hud_hearts    ; redraw hearts HUD when player_health changes\n`;
  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: upload_hud_hearts
; ------------------------------------------------------------
; PURPOSE:
;   Upload the baked heart tiles (16x16 full + 16x16 empty, side by side = a
;   32x16 4bpp blob) to the fixed page-0 offscreen slot at VRAM #7000 (Y=224).
;   Called once at boot. The tiles are the HMMM source for update_hud_hearts.
; ------------------------------------------------------------
upload_hud_hearts:
${heartUploadAsm}
; ------------------------------------------------------------
; FUNCTION: update_hud_hearts
; ------------------------------------------------------------
; PURPOSE:
;   Redraw the hearts row in the HUD band when player_health changes (dirty-flag).
;   Draws ${slotCount} slot(s) at x=${firstX}.. +${BITMAP_HUD_HEART_SPACING}, y=${destY}: a full
;   heart (source sx=0) for each slot index < player_health, an empty outline
;   (source sx=${emptySx}) for each lost one. Only the VISIBLE page is updated
;   (bitmap_displayed_page). Uses HMMM from the heart tile slot at Y=${BITMAP_HUD_HEART_TILE_Y}.
;
; INPUT:
;   player_health, bitmap_displayed_page, hud_hearts_drawn (dirty flag).
;
; OUTPUT:
;   HUD band hearts refreshed on the visible page; hud_hearts_drawn latched.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, vdp_write_register
;
; SIDE EFFECTS:
;   V9938 command engine runs ${slotCount} HMMM block(s). R#15 is left at S#2 by
;   vdp_wait_cmd_ready, so R#15 is restored to S#0 before returning (else the
;   bitmap_wait_vblank poll would read the wrong status register).
; ------------------------------------------------------------
update_hud_hearts:
    ld a, (player_health)
    ld hl, hud_hearts_drawn
    cp (hl)
    ret z                       ; unchanged -> nothing to redraw
    ld (hl), a                  ; latch new health

    ; Copy the ROM command template into the 15-byte scratch, then patch the
    ; per-frame fields (DY from the visible page; SX/DX per slot in the loop).
    ld hl, hud_heart_cmd_template
    ld de, hud_cmd_block
    ld bc, ${VDP_CMD_BLOCK_SIZE}
    ldir
    ld a, ${destY}
    ld (hud_cmd_block + 6), a   ; DY lo (HUD band offset)
    xor a
    ld (hud_cmd_block + 7), a   ; page 0
    call .hud_draw_heart_page
    ld a, 1
    ld (hud_cmd_block + 7), a   ; page 1
    call .hud_draw_heart_page

    call bitmap_restore_hud_separator
    ret

.hud_draw_heart_page:
    ld b, ${slotCount}          ; slot count (compile-time constant)
    ld c, 0                     ; C = current slot index
.hud_slot_loop:
    ; Source X (full vs empty): full (0) when slot < health, else empty (${emptySx}).
    ld a, c
    push hl
    ld hl, player_health
    cp (hl)                     ; carry set when slot < health
    pop hl
    jr c, .hud_full_heart
    ld a, ${emptySx}
    jr .hud_set_sx
.hud_full_heart:
    xor a
.hud_set_sx:
    ld (hud_cmd_block + 0), a   ; SX lo
    ; Destination X = ${firstX} + slot * ${BITMAP_HUD_HEART_SPACING}
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, ${firstX}
    ld (hud_cmd_block + 4), a   ; DX lo
    call hud_launch_heart_cmd
    inc c
    djnz .hud_slot_loop
    ret

hud_launch_heart_cmd:
    ; Launch the 15-byte V9938 command currently in hud_cmd_block. Clobbers
    ; AF, HL; keeps BC (the slot index in C survives across the OUT loop).
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    push bc
    ld hl, hud_cmd_block
    ld b, ${VDP_CMD_BLOCK_SIZE}
.hud_write_block:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .hud_write_block
    pop bc
    ret

; HMMM command template: source = heart tile at Y=${BITMAP_HUD_HEART_TILE_Y}, size
; ${BITMAP_HUD_HEART_NX}x${BITMAP_HUD_HEART_NY}. SX/DX/DY are patched at runtime.
hud_heart_cmd_template:
    DB 0,0, ${heartTileYByte},0, 0,0, 0,0, ${nxByte},0, ${nxByte},0, 0,0, #D0
`;
  return { equates, routinesAsm, initAsm, mainLoopCall };
}

function buildBitmapHudSeparatorRestoreAsm(enabled: boolean): { mainLoopCall: string; routinesAsm: string } {
  if (!enabled) return { mainLoopCall: '', routinesAsm: '' };
  return {
    mainLoopCall: '',
    routinesAsm: `; ------------------------------------------------------------
; FUNCTION: bitmap_restore_hud_separator
; ------------------------------------------------------------
; PURPOSE:
;   Repaints the last HUD row (y=${BITMAP_ROOM_HUD_HEIGHT - 1}) after a dynamic HUD
;   widgets. SCREEN 5 HMMM/HMMV widgets are opaque 4bpp copies/fills; if a
;   heart/bar/counter touches the separator row, it can overwrite the white line
;   seeded by init_bitmap_hud_band. This tiny HMMV restores visual parity with
;   the editor preview, where the separator is drawn last.
;
; INPUT:
;   hud_cmd_block scratch.
;
; OUTPUT:
;   A 256x1 color-15 separator is restored on BOTH page 0 and page 1. This keeps
;   the HUD band page-flip safe; transitions do not need to redraw or invalidate it.
;
; DESTROYS:
;   AF, BC, DE, HL
;
; PRESERVES:
;   IX, IY
;
; CALLS:
;   vdp_wait_cmd_ready, vdp_reinit_cmd_pointer, vdp_write_register
;
; SIDE EFFECTS:
;   V9938 command engine runs one HMMV fill. R#15 is restored to S#0 before return.
; ------------------------------------------------------------
bitmap_restore_hud_separator:
    ld hl, bitmap_hud_separator_cmd_template
    ld de, hud_cmd_block
    ld bc, ${VDP_CMD_BLOCK_SIZE}
    ldir
    xor a
    ld (hud_cmd_block + 7), a   ; page 0
    call .hud_separator_draw_page
    ld a, 1
    ld (hud_cmd_block + 7), a   ; page 1
.hud_separator_draw_page:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    ld hl, hud_cmd_block
    ld b, ${VDP_CMD_BLOCK_SIZE}
.hud_separator_write_block:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .hud_separator_write_block
    xor a
    ld e, a
    ld a, #0F
    call vdp_write_register
    ret

bitmap_hud_separator_cmd_template:
    DB 0,0, 0,0, 0,0, ${hexByte(BITMAP_ROOM_HUD_HEIGHT - 1)},0, 0,1, 1,0, #0F,0, #C0
`,
  };
}

// ------------------------------------------------------------------------
// Linked MSX2 HUD asset (Msx2HudAsset, authored in the standalone Mideas HUD
// Editor and referenced by room.runtime.hudAssetId): generalizes the hearts
// HUD pattern above (dirty-flag + HMMM + restore R#15) to arbitrary 'iconRow'
// and 'counter' / 'iconCounter'
// (numeric text) elements. Only used when a HUD asset is linked; the classic
// buildBitmapHeartsHudAsm above stays completely untouched and is the only
// path taken when no HUD asset is linked (byte-identical ROM, zero regression
// risk for existing projects).
// ------------------------------------------------------------------------

interface HudDynamicSource {
  kind: 'iconRow' | 'counter' | 'bar';
  element: Msx2HudElement;
}

/** Elements whose visual state changes at runtime (everything else is baked once into the HUD seed). */
function collectLinkedHudDynamicSources(hudAsset: Msx2HudAsset): HudDynamicSource[] {
  const sources: HudDynamicSource[] = [];
  // Match buildBitmapHudSeedPixels and the editor preview: top-of-list layers are
  // visually in front, so runtime-dynamic widgets must draw back-to-front too.
  for (const layer of [...(hudAsset.layers || [])].reverse()) {
    if (layer.kind !== 'widget' || !layer.visible || !layer.element.visible) continue;
    const kind = layer.element.kind;
    if (kind === 'iconRow') sources.push({ kind: 'iconRow', element: layer.element });
    else if (kind === 'counter' || kind === 'iconCounter') sources.push({ kind: 'counter', element: layer.element });
    else if (kind === 'bar') sources.push({ kind: 'bar', element: layer.element });
  }
  return sources;
}

/**
 * Maps an element's variable binding to the RAM byte the runtime routine reads.
 * Only `playerEnergy` (player_health) and `lives` (player_lives) have a real game
 * mechanic behind them today. Every other binding (`score`/`bossEnergy`/`air`/
 * `collectibles`/`custom`) gets its OWN persistent RAM byte instead — this is NOT a
 * scoring/timer mechanic, just a widget-owned counter seeded from `initialValue`
 * that a future system (skills, tile interactions) can write to. Documented as
 * such so the generated ROM never pretends to have gameplay that does not exist.
 */
function resolveHudElementBindingRamLabel(element: Msx2HudElement, instanceIndex: number): string {
  if (element.binding === 'playerEnergy') return 'player_health';
  if (element.binding === 'lives') return 'player_lives';
  if (element.binding === 'air') return 'air_timer';
  if (element.binding === 'experience') return 'player_xp';
  if (element.binding === 'level') return 'player_level';
  if (element.binding === 'skillPoints') return 'player_skill_points';
  return `hud_linked_${instanceIndex}_value`;
}

function resolveHudElementMaxValue(element: Msx2HudElement, fallback: number, playerVitals?: BitmapPlayerVitals): number {
  if (element.binding === 'playerEnergy' && playerVitals) {
    return playerVitals.maxHealth;
  }
  return Math.max(1, clampByte(element.maxValue, fallback));
}

function resolveHudElementInitialValue(element: Msx2HudElement, maxValue: number, playerVitals?: BitmapPlayerVitals): number {
  if (element.binding === 'playerEnergy' && playerVitals) {
    return Math.min(maxValue, playerVitals.maxHealth);
  }
  return Math.min(maxValue, clampByte(element.initialValue, maxValue));
}

/**
 * Builds the 16x32 (full+empty side by side) tile pixels for an iconRow
 * element, sourced from the linked HUD asset's own icon mini-atlas
 * (`Msx2HudAsset.icons`, element.atlasEntryId/emptyAtlasEntryId). Falls back to
 * the hand-authored heart mask ONLY for playerEnergy-bound elements without an
 * icon assigned (keeps the "Apply Hearts HUD" editor preset working out of the
 * box); any other unconfigured icon falls back to a plain colour placeholder
 * rect so a munition/lives pip never surprises the author with a heart shape.
 */
function buildIconRowTilePixels(hudAsset: Msx2HudAsset, element: Msx2HudElement): number[][] {
  const icons = hudAsset.icons || [];
  const fullIcon = icons.find(item => item.id === element.atlasEntryId);
  const emptyIcon = icons.find(item => item.id === element.emptyAtlasEntryId);
  if (!fullIcon && !emptyIcon && element.binding === 'playerEnergy') {
    return buildBitmapHeartTilePixels();
  }
  const bg = BITMAP_HUD_HEART_COLOR_BG;
  const grid: number[][] = Array.from({ length: 16 }, () => Array.from({ length: 32 }, () => bg));
  const paintIcon = (icon: Msx2HudIconEntry | undefined, colOffset: number, fallbackColor: number) => {
    if (icon) {
      for (let y = 0; y < 16 && y < icon.height; y++) {
        for (let x = 0; x < 16 && x < icon.width; x++) {
          const color = icon.pixels[y]?.[x];
          if (color !== undefined && color >= 0) grid[y][colOffset + x] = color & 0x0f;
        }
      }
    } else {
      for (let y = 4; y < 12; y++) {
        for (let x = 4; x < 12; x++) grid[y][colOffset + x] = fallbackColor & 0x0f;
      }
    }
  };
  paintIcon(fullIcon, 0, element.colors.primary ?? 10);
  paintIcon(emptyIcon, 16, element.colors.secondary ?? 14);
  return grid;
}

/** Builds an 8-row x 80-col (10 digits x 8px) glyph strip for a counter element's digits 0-9. */
function buildCounterGlyphPixels(font: Msx2HudFontAsset | undefined, color: number): number[][] {
  const patterns = font?.patterns || DEFAULT_HUD_PATTERNS;
  const bg = BITMAP_HUD_HEART_COLOR_BG;
  const grid: number[][] = Array.from({ length: 8 }, () => Array.from({ length: 80 }, () => bg));
  for (let digit = 0; digit <= 9; digit++) {
    const bitmapGlyph = normalizeScreen5HudFontGlyph(font, String(digit), color, bg);
    if (bitmapGlyph) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          grid[row][(digit * 8) + col] = bitmapGlyph[row][col] & 0x0f;
        }
      }
      continue;
    }
    const pattern = patterns[String(digit)] || DEFAULT_HUD_PATTERNS[String(digit)];
    for (let row = 0; row < 8; row++) {
      const bits = Number(pattern[row]) || 0;
      for (let col = 0; col < 8; col++) {
        if (bits & (0x80 >> col)) grid[row][(digit * 8) + col] = color & 0x0f;
      }
    }
  }
  return grid;
}

/** Shared decimal conversion (A: 0-255 -> hud_dec3_buffer: hundreds,tens,units ASCII). Emitted once. */
const HUD_BYTE_TO_DEC3_ROUTINE_ASM = `; ------------------------------------------------------------
; FUNCTION: hud_byte_to_dec3
; ------------------------------------------------------------
; PURPOSE:
;   Converts A (0-255) to 3 ASCII decimal digits in hud_dec3_buffer (hundreds,
;   tens, units), shared by every linked HUD counter/iconCounter widget.
; DESTROYS: AF, BC
; ------------------------------------------------------------
hud_byte_to_dec3:
    ld c, a
    ld b, 0
.hud_dec3_hundreds:
    ld a, c
    cp 100
    jr c, .hud_dec3_tens_start
    sub 100
    ld c, a
    inc b
    jr .hud_dec3_hundreds
.hud_dec3_tens_start:
    ld a, b
    add a, '0'
    ld (hud_dec3_buffer), a
    ld b, 0
.hud_dec3_tens:
    ld a, c
    cp 10
    jr c, .hud_dec3_units_start
    sub 10
    ld c, a
    inc b
    jr .hud_dec3_tens
.hud_dec3_units_start:
    ld a, b
    add a, '0'
    ld (hud_dec3_buffer + 1), a
    ld a, c
    add a, '0'
    ld (hud_dec3_buffer + 2), a
    ret
`;

/** Shared 16-bit decimal conversion for wide (digits 4-5) linked HUD counters. Emitted once. */
const HUD_WORD_TO_DEC5_ROUTINE_ASM = `; ------------------------------------------------------------
; FUNCTION: hud_word_to_dec5
; ------------------------------------------------------------
; PURPOSE:
;   Converts HL (0-65535) to 5 ASCII decimal digits in hud_dec5_buffer, shared by
;   every wide (16-bit) linked HUD counter widget. No division: repeated 16-bit
;   subtraction of 10000/1000/100/10 (max ~33 iterations total), remainder = units.
; INPUT:
;   HL = value (0-65535)
; OUTPUT:
;   hud_dec5_buffer[0..4] = '0'-'9' (ten-thousands .. units)
; DESTROYS: AF, BC, DE, HL
; ------------------------------------------------------------
hud_word_to_dec5:
    ld de, hud_dec5_buffer
    ld bc, #2710          ; 10000
    call hud_dec5_digit
    ld bc, #03E8          ; 1000
    call hud_dec5_digit
    ld bc, #0064          ; 100
    call hud_dec5_digit
    ld bc, #000A          ; 10
    call hud_dec5_digit
    ld a, l               ; remainder = units
    add a, '0'
    ld (de), a
    ret
hud_dec5_digit:
    xor a                 ; digit count = 0
.hud_dec5_sub:
    or a                  ; clear carry for sbc (A = count, preserved)
    sbc hl, bc
    jr c, hud_dec5_done
    inc a
    jr .hud_dec5_sub
hud_dec5_done:
    add hl, bc            ; restore (over-subtracted by one)
    add a, '0'
    ld (de), a
    inc de
    ret
`;

/**
 * Resolves a linked HUD counter element's display width. Narrow (1-3 digits) uses
 * the 8-bit dec3 path (byte value, unchanged). Wide (4-5 digits) uses the 16-bit
 * dec5 path (2-byte value). Counters bound to a byte game-state (playerEnergy/lives)
 * are forced narrow regardless of `digits`, since those bindings have no high byte.
 * 6-7 requested digits clamp to 5 (24-bit/BCD would need much more RAM; future work).
 */
function linkedCounterSpec(element: Msx2HudElement): { digits: number; wide: boolean } {
  const requested = Math.max(1, Math.min(7, Math.floor(element.format?.digits || 3)));
  const byteBinding = element.binding === 'playerEnergy'
    || element.binding === 'lives'
    || element.binding === 'air'
    || element.binding === 'experience'
    || element.binding === 'level'
    || element.binding === 'skillPoints';
  if (requested >= 4 && !byteBinding) {
    return { digits: Math.min(5, requested), wide: true };
  }
  return { digits: Math.min(3, requested), wide: false };
}

/** Shared 15-byte command launcher for every linked HUD dynamic widget. Emitted once. */
const HUD_LINKED_LAUNCH_CMD_ROUTINE_ASM = `; ------------------------------------------------------------
; FUNCTION: hud_linked_launch_cmd
; ------------------------------------------------------------
; PURPOSE:
;   Launches the 15-byte V9938 command currently in hud_cmd_block. Shared by
;   every linked HUD dynamic widget (they run sequentially from the main loop,
;   never concurrently, so the scratch block is safe to reuse).
; DESTROYS: AF, HL
; PRESERVES: BC
; ------------------------------------------------------------
hud_linked_launch_cmd:
    call vdp_wait_cmd_ready
    call vdp_reinit_cmd_pointer
    push bc
    ld hl, hud_cmd_block
    ld b, ${VDP_CMD_BLOCK_SIZE}
.hud_linked_launch_write:
    ld a, (hl)
    out (${VDP_CMD_PORT}), a
    inc hl
    djnz .hud_linked_launch_write
    pop bc
    ret
`;

/**
 * Generalizes buildBitmapHeartsHudAsm to an arbitrary linked-asset iconRow
 * element: repeated slots that fill/empty by comparing a slot index against the
 * bound RAM byte. Same dirty-flag + HMMM + R#15-restore
 * pattern, parametrized by position/slot-count/tile source instead of hardcoded.
 * v1 keeps the 16px fixed slot spacing (same as the classic hearts HUD); the
 * element's `spacing` field is authored for the editor preview only for now.
 */
function buildBitmapHudLinkedIconRowAsm(
  source: HudDynamicSource,
  tileVramY: number,
  ram: { dirtyFlagAddress: number; valueAddress?: number },
  bindingRamLabel: string,
  uploadAsm: string,
  instanceIndex: number,
  playerVitals?: BitmapPlayerVitals
): { equates: string; initAsm: string; mainLoopCall: string; routinesAsm: string } {
  const element = source.element;
  const isToggle = element.kind === 'icon';
  // Clip against the right edge: HMMM DX is written as a low byte only and
  // SCREEN 5 has no x >= 256, so an overflowing 16px slot would WRAP to x=0 and
  // stamp over the left side of the HUD. The editor preview clips the same way.
  const firstX = clampInt(element.x, 0, SCREEN_WIDTH - 16, 8);
  const slotsThatFit = Math.max(1, Math.floor((SCREEN_WIDTH - firstX) / 16));
  const slotCount = isToggle ? 1 : Math.max(1, Math.min(Math.min(BITMAP_HUD_HEART_MAX_SLOTS, slotsThatFit), resolveHudElementMaxValue(element, 5, playerVitals)));
  const destY = clampInt(element.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 2);
  const emptySx = 16;
  const dirtyLabel = `hud_linked_${instanceIndex}_drawn`;
  const uploadLabel = `upload_hud_linked_${instanceIndex}`;
  const updateLabel = `update_hud_linked_${instanceIndex}`;
  const tmplLabel = `hud_linked_${instanceIndex}_cmd_template`;
  const loopLabel = `.hud_linked_${instanceIndex}_loop`;
  const drawPageLabel = `.hud_linked_${instanceIndex}_draw_page`;
  const fullLabel = `.hud_linked_${instanceIndex}_full`;
  const setSxLabel = `.hud_linked_${instanceIndex}_set_sx`;

  const equates = `; Linked HUD ${isToggle ? 'icon toggle' : 'icon row'} #${instanceIndex} (${element.id}), bound to "${element.binding}".
${dirtyLabel} EQU ${hexWord(ram.dirtyFlagAddress)}
${ram.valueAddress !== undefined ? `${bindingRamLabel} EQU ${hexWord(ram.valueAddress)}\n` : ''}`;

  const initAsm = `    call ${uploadLabel}
    ld a, #FF
    ld (${dirtyLabel}), a
${ram.valueAddress !== undefined ? `    ld a, ${hexByte(clampByte(element.initialValue, 0))}\n    ld (${bindingRamLabel}), a\n` : ''}`;

  const mainLoopCall = `    call ${updateLabel}    ; redraw linked HUD ${isToggle ? 'icon' : 'icon row'} #${instanceIndex} (${element.id})\n`;

  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: ${uploadLabel} / ${updateLabel}
; ------------------------------------------------------------
; PURPOSE:
;   Generalized icon-row/icon-toggle widget for linked HUD element "${element.id}".
;   Same dirty-flag + HMMM pattern as update_hud_hearts: redraws ${slotCount}
;   slot(s) at x=${firstX}..+16, y=${destY} on BOTH display pages only when
;   ${bindingRamLabel} changes. Keeping page 0 and page 1 identical prevents HUD
;   redraw/flicker during room transitions; only the game band is page-flipped.
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
${uploadLabel}:
${uploadAsm}
${updateLabel}:
    ld a, (${bindingRamLabel})
    ld hl, ${dirtyLabel}
    cp (hl)
    ret z
    ld (hl), a

    ld hl, ${tmplLabel}
    ld de, hud_cmd_block
    ld bc, ${VDP_CMD_BLOCK_SIZE}
    ldir
    ld a, ${destY}
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call ${drawPageLabel}
    ld a, 1
    ld (hud_cmd_block + 7), a
    call ${drawPageLabel}

    call bitmap_restore_hud_separator
    ret

${drawPageLabel}:
    ld b, ${slotCount}
    ld c, 0
${loopLabel}:
${isToggle
    ? `    ; Single icon widget (kind:'icon'): always draws the assigned icon
    ; (SX=0, the "full" half). Unlike an iconRow slot, a standalone icon has
    ; no editor UI to author an "empty" state, so it must not depend on
    ; ${bindingRamLabel} — otherwise the default initialValue=0 would always
    ; pick the empty/fallback half and the user's icon would never appear,
    ; breaking editor<->ROM parity.
    jr ${fullLabel}`
    : `    ld a, c
    push hl
    ld hl, ${bindingRamLabel}
    cp (hl)
    pop hl
    jr c, ${fullLabel}
    ld a, ${emptySx}
    jr ${setSxLabel}`}
${fullLabel}:
    xor a
${setSxLabel}:
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, a
    add a, ${firstX}
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    inc c
    djnz ${loopLabel}
    ret

${tmplLabel}:
    ; SY is a full 10-bit word: tile sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, ${hexByte(tileVramY & 0xff)},${hexByte((tileVramY >> 8) & 0xff)}, 0,0, 0,0, #10,0, #10,0, 0,0, #D0
`;
  return { equates, initAsm, mainLoopCall, routinesAsm };
}

/**
 * Numeric counter widget for a linked HUD element ('counter' or the digits of
 * an 'iconCounter'). Converts the bound byte (0-255) to up to 3 zero-padded
 * decimal digits (hud_byte_to_dec3, shared) and blits each glyph via HMMM,
 * using the same dirty-flag + command-scratch pattern as the icon-row widget.
 */
function buildBitmapHudLinkedCounterAsm(
  source: HudDynamicSource,
  glyphVramY: number,
  ram: { dirtyFlagAddress: number; valueAddress?: number },
  bindingRamLabel: string,
  uploadAsm: string,
  instanceIndex: number
): { equates: string; initAsm: string; mainLoopCall: string; routinesAsm: string } {
  const element = source.element;
  const { digits, wide } = linkedCounterSpec(element);
  const iconOffset = element.kind === 'iconCounter' ? 16 : 0;
  const destX = clampInt(element.x, 0, SCREEN_WIDTH - 1, 8) + iconOffset;
  // Clip digits that would cross the right edge: HMMM DX is written as a low
  // byte only and SCREEN 5 has no x >= 256, so an overflowing glyph would WRAP
  // to x=0 and stamp digits over the left side of the HUD (seen as a stray "0"
  // on top of the first heart). The editor preview clips the same way, so only
  // the digits that actually fit are drawn.
  const digitsThatFit = Math.floor((SCREEN_WIDTH - destX) / 8);
  const visibleDigits = Math.max(0, Math.min(digits, digitsThatFit));
  const destY = clampInt(element.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 2);
  const dirtyLabel = `hud_linked_${instanceIndex}_drawn`;
  const uploadLabel = `upload_hud_linked_${instanceIndex}`;
  const updateLabel = `update_hud_linked_${instanceIndex}`;
  const tmplLabel = `hud_linked_${instanceIndex}_cmd_template`;
  const loopLabel = `.hud_linked_${instanceIndex}_digit_loop`;
  const changedLabel = `.hud_linked_${instanceIndex}_changed`;
  const drawPageLabel = `.hud_linked_${instanceIndex}_draw_page`;
  const bufferLabel = wide ? 'hud_dec5_buffer' : 'hud_dec3_buffer';
  const digitBufferOffset = (wide ? 5 : 3) - digits;
  const convertCall = wide ? 'hud_word_to_dec5' : 'hud_byte_to_dec3';

  const equates = `; Linked HUD counter #${instanceIndex} (${element.id}), bound to "${element.binding}" [${wide ? `16-bit, ${digits} digits` : `8-bit, ${digits} digits`}].
${dirtyLabel} EQU ${hexWord(ram.dirtyFlagAddress)}
${ram.valueAddress !== undefined ? `${bindingRamLabel} EQU ${hexWord(ram.valueAddress)}\n` : ''}`;

  const initAsm = wide
    ? `    call ${uploadLabel}
    ld hl, #FFFF
    ld (${dirtyLabel}), hl
${ram.valueAddress !== undefined ? `    ld hl, ${hexWord(Math.max(0, Math.min(65535, Math.floor(element.initialValue || 0))))}\n    ld (${bindingRamLabel}), hl\n` : ''}`
    : `    call ${uploadLabel}
    ld a, #FF
    ld (${dirtyLabel}), a
${ram.valueAddress !== undefined ? `    ld a, ${hexByte(clampByte(element.initialValue, 0))}\n    ld (${bindingRamLabel}), a\n` : ''}`;

  const mainLoopCall = `    call ${updateLabel}    ; redraw linked HUD counter #${instanceIndex} (${element.id})\n`;

  // Shared digit-blit loop: reads ASCII digits from bufferLabel+digitBufferOffset,
  // maps each to its 8px glyph (SX = digit*8) and HMMMs NX=NY=8 to destX + i*8.
  // The glyphs are redrawn on BOTH page 0 and page 1 when the value changes, so
  // room page flips never need to invalidate/redraw the HUD band.
  const blitLoop = visibleDigits === 0 ? `    ; All ${digits} digit(s) of this counter start past the right edge (x=${destX});
    ; nothing can be drawn without wrapping to x=0, so the widget stays static.
    ret
` : `    ld hl, ${tmplLabel}
    ld de, hud_cmd_block
    ld bc, ${VDP_CMD_BLOCK_SIZE}
    ldir
    ld a, ${destY}
    ld (hud_cmd_block + 6), a
    xor a
    ld (hud_cmd_block + 7), a
    call ${drawPageLabel}
    ld a, 1
    ld (hud_cmd_block + 7), a
    call ${drawPageLabel}

    call bitmap_restore_hud_separator
    ret

${drawPageLabel}:
    ld b, ${visibleDigits}
    ld c, 0
${loopLabel}:
    push bc
    ld a, c
    ld e, a
    ld d, 0
    ld hl, ${bufferLabel} + ${digitBufferOffset}
    add hl, de
    ld a, (hl)
    sub '0'
    add a, a
    add a, a
    add a, a
    ld (hud_cmd_block + 0), a
    ld a, c
    add a, a
    add a, a
    add a, a
    add a, ${destX}
    ld (hud_cmd_block + 4), a
    call hud_linked_launch_cmd
    pop bc
    inc c
    djnz ${loopLabel}
    ret
`;

  const dirtyCheckAndConvert = wide
    ? `${updateLabel}:
    ld hl, (${bindingRamLabel})
    ld de, (${dirtyLabel})
    or a
    sbc hl, de
    jr nz, ${changedLabel}
    ret
${changedLabel}:
    ld hl, (${bindingRamLabel})
    ld (${dirtyLabel}), hl
    call ${convertCall}

${blitLoop}`
    : `${updateLabel}:
    ld a, (${bindingRamLabel})
    ld hl, ${dirtyLabel}
    cp (hl)
    ret z
    ld (hl), a
    call ${convertCall}

${blitLoop}`;

  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: ${uploadLabel} / ${updateLabel}
; ------------------------------------------------------------
; PURPOSE:
;   Numeric counter widget for linked HUD element "${element.id}": ${digits}
;   zero-padded decimal digit(s) at x=${destX}, y=${destY}, redrawn only when
;   ${bindingRamLabel} changes (dirty-flag). ${wide ? `16-bit value via ${convertCall}.` : `8-bit value via ${convertCall}.`}
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: ${convertCall}, hud_linked_launch_cmd, vdp_write_register
; ------------------------------------------------------------
${uploadLabel}:
${uploadAsm}
${dirtyCheckAndConvert}
${tmplLabel}:
    ; SY is a full 10-bit word: glyph sources may live past VRAM row 255
    ; (page-1 offscreen band or after the shared atlas).
    DB 0,0, ${hexByte(glyphVramY & 0xff)},${hexByte((glyphVramY >> 8) & 0xff)}, 0,0, 0,0, 8,0, 8,0, 0,0, #D0
`;
  return { equates, initAsm, mainLoopCall, routinesAsm };
}

/**
 * Air/time countdown timer for SCREEN 5 bitmap rooms. A room-level byte
 * `air_timer` (seeded from room.runtime.initialAir) that 'air'-bound HUD counters
 * read — same pattern as playerEnergy→player_health. Decrements once per second
 * (frame divider = 60, assuming the 60Hz vblank-synced main loop). When `ticking`
 * is false (initialAir==0 or disableAirTimer) the byte is still allocated + seeded
 * so an air-bound counter always has a valid symbol to read (it just stays static).
 * Stops at 0 (no death/event wired here — that is future game logic).
 */
function buildBitmapAirTimerAsm(opts: {
  airTimerAddress: number;
  airFrameDividerAddress: number;
  initialAir: number;
  framesPerTick: number;
  ticking: boolean;
}): { equates: string; initAsm: string; mainLoopCall: string; routinesAsm: string } {
  const { airTimerAddress, airFrameDividerAddress, initialAir, framesPerTick, ticking } = opts;
  const equates = `air_timer EQU ${hexWord(airTimerAddress)}        ; room air/time countdown (read by 'air'-bound HUD counters)
air_frame_divider EQU ${hexWord(airFrameDividerAddress)}
`;
  const initAsm = `    ld a, ${hexByte(initialAir)}
    ld (air_timer), a
    xor a
    ld (air_frame_divider), a
`;
  if (!ticking) {
    return { equates, initAsm, mainLoopCall: '', routinesAsm: '' };
  }
  const mainLoopCall = `    call update_air_timer    ; air/time countdown (-1 each ~${framesPerTick} frames)\n`;
  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: update_air_timer
; ------------------------------------------------------------
; PURPOSE:
;   Decrements the room air/time countdown (air_timer) by 1 every ${framesPerTick}
;   frames (~1s at 60Hz). Stops at 0. 'air'-bound HUD counters display air_timer.
; DESTROYS: AF, HL
; PRESERVES: BC, DE, IX, IY
; ------------------------------------------------------------
update_air_timer:
    ld hl, air_frame_divider
    inc (hl)
    ld a, (hl)
    cp ${framesPerTick}
    ret nz                  ; not a full tick yet
    xor a
    ld (hl), a              ; reset divider
    ld a, (air_timer)
    or a
    ret z                   ; already at 0
    dec a
    ld (air_timer), a
    ret
`;
  return { equates, initAsm, mainLoopCall, routinesAsm };
}

const sanitizeAsmHookLabel = (value: unknown): string | null => {
  const label = String(value || '').trim();
  return /^[A-Za-z_.$?@][A-Za-z0-9_.$?@]*$/.test(label) ? label : null;
};

function buildBitmapExperienceSystemAsm(opts: {
  xpAddress: number;
  xpMaxAddress: number;
  levelAddress: number;
  skillPointsAddress: number;
  initialXp: number;
  xpMax: number;
  maxHealth: number;
  reward?: Msx2HudElement['xpReward'];
}): { equates: string; initAsm: string; routinesAsm: string } {
  const reward = opts.reward;
  const enabled = reward?.enabled !== false;
  const carryOverflow = reward?.carryOverflow !== false;
  const actions = Array.isArray(reward?.actions) ? reward!.actions : [];
  const rewardAsm = enabled
    ? actions.map(action => {
        const amount = clampByte(action.amount, 1);
        if (action.type === 'incrementLevel') {
          return `    ld hl, player_level
    ld a, (hl)
    add a, ${hexByte(amount)}
    ld (hl), a
`;
        }
        if (action.type === 'incrementSkillPoints') {
          return `    ld hl, player_skill_points
    ld a, (hl)
    add a, ${hexByte(amount)}
    ld (hl), a
`;
        }
        if (action.type === 'restoreHealth') {
          return `    ld a, ${hexByte(opts.maxHealth)}
    ld (player_health), a
`;
        }
        if (action.type === 'callAsmHook') {
          const hook = sanitizeAsmHookLabel(action.hookLabel);
          return hook ? `    call ${hook}\n` : '';
        }
        return '';
      }).join('')
    : '';
  const equates = `player_xp EQU ${hexWord(opts.xpAddress)}
player_xp_max EQU ${hexWord(opts.xpMaxAddress)}
player_level EQU ${hexWord(opts.levelAddress)}
player_skill_points EQU ${hexWord(opts.skillPointsAddress)}
`;
  const initAsm = `    ld a, ${hexByte(opts.initialXp)}
    ld (player_xp), a
    ld a, ${hexByte(opts.xpMax)}
    ld (player_xp_max), a
    ld a, 1
    ld (player_level), a
    xor a
    ld (player_skill_points), a
`;
  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: add_player_xp
; ------------------------------------------------------------
; PURPOSE:
;   Add XP to player_xp. When player_xp reaches player_xp_max, reset/wrap the
;   bar and run the authored XP reward program from the HUD XP Bar.
; INPUT: A = XP amount to add.
; DESTROYS: AF, HL
; ------------------------------------------------------------
add_player_xp:
    ld hl, player_xp
    add a, (hl)
    ld (hl), a
    ld hl, player_xp_max
    cp (hl)
    ret c
${carryOverflow ? `    sub (hl)
    ld (player_xp), a
` : `    xor a
    ld (player_xp), a
`}${rewardAsm || '    ; No XP reward actions authored.\n'}    ret
`;
  return { equates, initAsm, routinesAsm };
}

/**
 * Dynamic bar meter for a linked HUD 'bar' element. Unlike iconRow/counter this
 * widget needs NO offscreen source tile: the track + fill are drawn directly with
 * V9938 HMMV fills (CMD_FILL, high-speed fill). fillW = clamp(value,0,max) * barW
 * / max. The region is forced EVEN-aligned because SCREEN 5 packs 2px/byte and
 * HMMV requires byte-aligned DX/NX; consequently a 1px frame cannot be preserved
 * by the fill, so the bar has NO border (the seed baker matches this — see
 * buildBitmapHudSeedPixels). Same dirty-flag + R#15-restore contract as the other
 * linked widgets.
 */
function buildBitmapHudLinkedBarAsm(
  source: HudDynamicSource,
  ram: { dirtyFlagAddress: number; valueAddress?: number },
  bindingRamLabel: string,
  instanceIndex: number,
  playerVitals?: BitmapPlayerVitals
): { equates: string; initAsm: string; mainLoopCall: string; routinesAsm: string } {
  const element = source.element;
  const max = resolveHudElementMaxValue(element, 16, playerVitals);
  // Even-aligned dynamic region (SCREEN 5 HMMV: byte-aligned DX/NX).
  const barX = clampInt(element.x, 0, SCREEN_WIDTH - 2, 8) & ~1;
  const barW = Math.min(254, Math.max(2, clampInt(element.width, 2, SCREEN_WIDTH - barX, 64) & ~1));
  const barY = clampInt(element.y, 0, BITMAP_ROOM_HUD_HEIGHT - 1, 2);
  const barH = Math.max(1, clampInt(element.height, 1, BITMAP_ROOM_HUD_HEIGHT - barY, 6));
  const emptyColor = (element.colors.empty ?? 4) & 0x0f;
  const primaryColor = (element.colors.primary ?? 10) & 0x0f;
  const dirtyLabel = `hud_linked_${instanceIndex}_drawn`;
  const updateLabel = `update_hud_linked_${instanceIndex}`;
  const tmplLabel = `hud_linked_${instanceIndex}_cmd_template`;
  const drawPageLabel = `.b${instanceIndex}_draw_page`;
  const clampNeeded = max < 255;

  const equates = `; Linked HUD bar #${instanceIndex} (${element.id}), bound to "${element.binding}".
${dirtyLabel} EQU ${hexWord(ram.dirtyFlagAddress)}
${ram.valueAddress !== undefined ? `${bindingRamLabel} EQU ${hexWord(ram.valueAddress)}\n` : ''}`;

  const initAsm = `    ld a, #FF
    ld (${dirtyLabel}), a
${ram.valueAddress !== undefined ? `    ld a, ${hexByte(clampByte(element.initialValue, 0))}\n    ld (${bindingRamLabel}), a\n` : ''}`;

  const mainLoopCall = `    call ${updateLabel}    ; redraw linked HUD bar #${instanceIndex} (${element.id})\n`;

  const routinesAsm = `; ------------------------------------------------------------
; FUNCTION: ${updateLabel}
; ------------------------------------------------------------
; PURPOSE:
;   Dynamic bar meter for linked HUD element "${element.id}": redraws the even-
;   aligned box x=${barX}, y=${barY}, w=${barW}, h=${barH} (empty track + primary
;   fill, fillW = clamp(value,0,${max}) * ${barW} / ${max}) on BOTH display pages
;   only when ${bindingRamLabel} changes. Uses V9938 HMMV fills (CMD_FILL =
;   ${hexByte(CMD_FILL)}); NO offscreen tile. Keeping page 0 and page 1 identical
;   prevents HUD redraw/flicker during room transitions.
; INPUT:
;   ${bindingRamLabel} = current value (0..${max})
; DESTROYS: AF, BC, DE, HL
; PRESERVES: IX, IY
; CALLS: hud_linked_launch_cmd, vdp_write_register
; SIDE EFFECTS: writes VRAM via the V9938 command engine; restores R#15=0 at the
;   end (hud_linked_launch_cmd leaves it at S#2) so vblank polling (S#0) survives.
; ------------------------------------------------------------
${updateLabel}:
    ld a, (${bindingRamLabel})
    ld hl, ${dirtyLabel}
    cp (hl)
    ret z
    ld (hl), a
${clampNeeded ? `    cp ${max + 1}
    jr c, .b${instanceIndex}_clamped
    ld a, ${hexByte(max)}
.b${instanceIndex}_clamped:` : ''}
    ; --- fillW (A) = value * ${barW} / ${max}, floored even (byte alignment) ---
    or a
    jr z, .b${instanceIndex}_zero
    ld b, a
    ld de, ${hexWord(barW)}
    ld hl, 0
.b${instanceIndex}_mul:
    add hl, de
    djnz .b${instanceIndex}_mul
    ld bc, ${hexWord(max)}
    xor a
.b${instanceIndex}_div:
    or a
    sbc hl, bc
    jr c, .b${instanceIndex}_div_done
    inc a
    jr .b${instanceIndex}_div
.b${instanceIndex}_div_done:
    and #FE
    jr .b${instanceIndex}_have
.b${instanceIndex}_zero:
    xor a
.b${instanceIndex}_have:
    push af                       ; A = fillW (preserved across ldir)

    ld hl, ${tmplLabel}
    ld de, hud_cmd_block
    ld bc, ${VDP_CMD_BLOCK_SIZE}
    ldir
    ld a, ${hexByte(barY)}
    ld (hud_cmd_block + 6), a     ; DY lo
    pop af
    ld c, a                       ; C = fillW, preserved by hud_linked_launch_cmd
    xor a
    ld (hud_cmd_block + 7), a     ; page 0
    call ${drawPageLabel}
    ld a, 1
    ld (hud_cmd_block + 7), a     ; page 1
    call ${drawPageLabel}

    call bitmap_restore_hud_separator
    ret

${drawPageLabel}:
    ; HMMV #1: empty track over the full box (COL = empty, NX = barW from template).
    ld a, ${hexByte(barW & 0xff)}
    ld (hud_cmd_block + 8), a
    ld a, ${hexByte(emptyColor)}
    ld (hud_cmd_block + 12), a
    call hud_linked_launch_cmd

    ld a, c                       ; A = fillW
    or a
    jr z, .b${instanceIndex}_done
    ld (hud_cmd_block + 8), a     ; NX lo = fillW
    ld a, ${hexByte(primaryColor)}
    ld (hud_cmd_block + 12), a    ; COL = primary
    call hud_linked_launch_cmd

.b${instanceIndex}_done:
    ret

${tmplLabel}:
    DB ${hexByte(barX & 0xFF)},0, 0,0, ${hexByte(barX & 0xFF)},0, ${hexByte(barY & 0xFF)},0, ${hexByte(barW & 0xFF)},0, ${hexByte(barH & 0xFF)},0, ${hexByte(emptyColor)},0, ${hexByte(CMD_FILL)}
`;
  return { equates, initAsm, mainLoopCall, routinesAsm };
}

// Priority: room.playerEntries[].playerId -> msx2player asset -> render.spriteAssetId;
// else first msx2player asset's render sprite; else first referenced msx2sprite.
function resolveBitmapRoomPlayerSprite(analysis: ProjectAnalysis, room: Msx2Screen5BitmapRoom): Msx2Sprite | undefined {
  const playerRecords = getMsx2PlayerAssetRecords(analysis);

  const referenceIds = new Set<string>();
  for (const entry of room.playerEntries || []) {
    const playerId = String((entry as any)?.playerId || '').trim();
    if (playerId) referenceIds.add(playerId);
  }

  const resolveFromPlayer = (player: Partial<Msx2PlayerDefinition> | undefined): Msx2Sprite | undefined => {
    const spriteAssetId = String(player?.render?.spriteAssetId || '').trim();
    return spriteAssetId ? resolveMsx2SpriteById(analysis, spriteAssetId) : undefined;
  };

  // 1) Explicit playerId reference from the room.
  if (referenceIds.size) {
    const referenced = playerRecords.find(record =>
      referenceIds.has(record.assetId) || referenceIds.has(record.playerId) || referenceIds.has(record.name)
    );
    const sprite = resolveFromPlayer(referenced?.player);
    if (sprite) return sprite;
  }

  // 2) First msx2player asset's render sprite.
  for (const record of playerRecords) {
    const sprite = resolveFromPlayer(record.player);
    if (sprite) return sprite;
  }

  // 3) Any referenced msx2sprite in the project.
  return getFirstReferencedMsx2Sprite(analysis);
}

/**
 * Resolves the bullet sprite for the shoot skill from the player definition.
 *
 * Priority: the first weapon with type 'projectile' and a projectileAssetId;
 * the resolved sprite's frame-0 layer-0 pattern/colour (32 + 16 bytes) are
 * returned. Falls back to undefined (the generator emits a placeholder dot).
 */
function resolveBitmapBulletSprite(
  analysis: ProjectAnalysis,
  player: Partial<Msx2PlayerDefinition> | undefined,
): BitmapShootSpriteData | undefined {
  const weapons = player?.weapons;
  if (Array.isArray(weapons)) {
    for (const weapon of weapons) {
      const assetId = String(weapon?.projectileAssetId || '').trim();
      if (!assetId) continue;
      const sprite = resolveMsx2SpriteById(analysis, assetId);
      if (!sprite) continue;
      const layers = buildHardwareSpriteLayersForFrame(sprite, BITMAP_ROOM_DEFAULT_SPRITE_COLOR, 0)
        .filter(layer => Array.isArray(layer.pattern) && layer.pattern.length === 32);
      const primary = layers[0];
      if (primary && Array.isArray(primary.pattern) && primary.pattern.length === 32) {
        const colors = (primary.colors || []).slice(0, 16);
        while (colors.length < 16) colors.push(BITMAP_ROOM_DEFAULT_SPRITE_COLOR);
        return {
          patternBytes: primary.pattern.map(v => v & 0xff),
          colorBytes: colors.map(v => v & 0xff),
        };
      }
    }
  }
  return undefined;
}

function getBitmapRoomSpriteFrameIndices(sprite: Msx2Sprite | undefined): number[] {
  if (!sprite?.frames?.length) return [0];
  const indices = sprite.frames
    .map((_frame, index) => index)
    .filter(index => Array.isArray(sprite.frames?.[index]?.data) && sprite.frames[index].data.length > 0);
  return (indices.length ? indices : [0]).slice(0, 8);
}

function getBitmapRoomSpriteAnimationDelayFrames(sprite: Msx2Sprite | undefined): number {
  const speedMs = Number(sprite?.animationSpeedMs);
  if (!Number.isFinite(speedMs) || speedMs <= 0) return 8;
  return Math.max(1, Math.min(255, Math.round(speedMs / (1000 / 60))));
}

function reverseSpritePatternByte(value: number): number {
  let result = 0;
  for (let bit = 0; bit < 8; bit++) {
    if (value & (1 << bit)) result |= 0x80 >> bit;
  }
  return result;
}

function mirrorHardwareSpritePatternHorizontally(pattern: number[]): number[] {
  const topLeft = pattern.slice(0, 8);
  const bottomLeft = pattern.slice(8, 16);
  const topRight = pattern.slice(16, 24);
  const bottomRight = pattern.slice(24, 32);
  return [
    ...topRight.map(reverseSpritePatternByte),
    ...bottomRight.map(reverseSpritePatternByte),
    ...topLeft.map(reverseSpritePatternByte),
    ...bottomLeft.map(reverseSpritePatternByte),
  ];
}

interface BitmapSpriteSlotOffset { x: number; y: number; }

function buildSpriteTables(sprite: Msx2Sprite | undefined): { colors: number[]; attrs: number[]; patterns: number[]; usedConfigured: boolean; frameCount: number; delayFrames: number; mirror: boolean; authoredFacing?: 'left' | 'right'; layerCount: number; spriteOffsets: BitmapSpriteSlotOffset[]; cells: BitmapSpriteSlotOffset[]; colorLayerCount: number; basePatternsNoMirror: number[]; basePatternsMirror: number[] } {
  // The SAT template Y/X are placeholders (the runtime rewrites every slot each
  // frame); the cell offsets are still baked so the initial frame is correct.
  const attrsForOffsets = (offsets: BitmapSpriteSlotOffset[]): number[] => [
    ...offsets.map((off, slotIndex) => [clampByte(0x60 + off.y), clampByte(0x80 + off.x), slotIndex * 4, 0x00]).flat(),
    0xD8, 0x00, 0x00, 0x00,
  ];

  if (sprite) {
    // V9938 sprite mode 2: 32-byte pattern (four 8x8 quadrants) + 16 line colors.
    // Reuse the SCREEN 4 converter; emit every authored frame and every color
    // layer so CC/OR rows authored in the UI survive the SCREEN 5 bitmap-room export.
    // Sprites taller/wider than 16px decompose into 16x16 CELLS (xOffset/yOffset);
    // each cell is its own hardware sprite stacked at player_y+yOffset/player_x+xOffset.
    const frameIndices = getBitmapRoomSpriteFrameIndices(sprite);
    const rawFrameLayerSets = frameIndices
      .map(frameIndex => buildHardwareSpriteLayersForFrame(sprite, BITMAP_ROOM_DEFAULT_SPRITE_COLOR, frameIndex)
        .filter(layer => Array.isArray(layer.pattern) && layer.pattern.length === 32));
    const authoredFacing = sprite.facingDirection === 'left' || sprite.facingDirection === 'right'
      ? sprite.facingDirection
      : undefined;
    const frameCount = Math.max(1, rawFrameLayerSets.length);

    // Distinct 16x16 cells across all frames, in row-major (top-to-bottom,
    // left-to-right) order so a 16x32 sprite yields cell 0 = top, cell 1 = bottom.
    const cellKey = (layer: { xOffset: number; yOffset: number }) => `${layer.yOffset}:${layer.xOffset}`;
    const cellMap = new Map<string, BitmapSpriteSlotOffset>();
    for (const layers of rawFrameLayerSets) {
      for (const layer of layers) {
        if (!cellMap.has(cellKey(layer))) cellMap.set(cellKey(layer), { x: layer.xOffset, y: layer.yOffset });
      }
    }
    const cells = Array.from(cellMap.values()).sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const cellCount = Math.max(1, cells.length);

    const layersForCell = (layers: typeof rawFrameLayerSets[number], cell: BitmapSpriteSlotOffset) =>
      layers.filter(layer => layer.xOffset === cell.x && layer.yOffset === cell.y);

    // Color layers PER CELL (OR/CC multicolor), the max authored across frames and
    // cells, clamped to the per-cell layer cap and the V9938 pattern budget. Every
    // cell uses the same color-layer count so a single sprite-slot grid (cell x
    // layer) stays stable across frames — the SAT writer can then bake offsets.
    const mirrorFactor = authoredFacing ? 2 : 1;
    const maxAuthoredColorLayers = Math.max(1, ...rawFrameLayerSets.flatMap(layers =>
      cells.map(cell => layersForCell(layers, cell).length || 1)));
    const maxColorLayersByBudget = Math.max(1, Math.floor(64 / (frameCount * cellCount * mirrorFactor)));
    const colorLayerCount = Math.max(1, Math.min(
      BITMAP_ROOM_MAX_PLAYER_SPRITE_LAYERS,
      maxAuthoredColorLayers,
      maxColorLayersByBudget,
    ));
    // Sprite slot s = cellIndex * colorLayerCount + colorLayerIndex. Offsets are
    // frame-invariant (the cell grid is fixed), so they can be emitted as immediates.
    const spriteOffsets: BitmapSpriteSlotOffset[] = cells.flatMap(cell =>
      Array.from({ length: colorLayerCount }, () => ({ x: cell.x, y: cell.y })));
    const spritesPerFrame = spriteOffsets.length; // cellCount * colorLayerCount

    if (rawFrameLayerSets.some(layers => layers.length)) {
      const emptyPattern = Array(32).fill(0);
      // Per frame: cell-major, then color-layer-inner — matching spriteOffsets and
      // the SAT writer's pattern increment (player_pat + slot*4).
      const patternSetForFrame = (layers: typeof rawFrameLayerSets[number], transform: (pattern: number[]) => number[]) =>
        cells.flatMap(cell => {
          const cellLayers = layersForCell(layers, cell);
          return Array.from({ length: colorLayerCount }, (_unused, layerIndex) => cellLayers[layerIndex]?.pattern || emptyPattern)
            .flatMap(pattern => transform(pattern).map(value => value & 0xff));
        });
      const basePatterns = rawFrameLayerSets.flatMap(layers => patternSetForFrame(layers, pattern => pattern));
      const mirrorPatterns = authoredFacing
        ? rawFrameLayerSets.flatMap(layers => patternSetForFrame(layers, mirrorHardwareSpritePatternHorizontally))
        : [];
      // One colour table PER FRAME (spritesPerFrame x 16 lines), matching the
      // per-frame pattern layout. CC/OR multi-colour rows differ between frames,
      // so the runtime re-uploads the current frame's colours (see
      // bitmap_upload_player_frame_colors); emitting only frame 0 here left
      // frames > 0 with frame 0's colours (white/garbage lines).
      const colors = rawFrameLayerSets.flatMap(layers =>
        cells.flatMap(cell => {
          const cellLayers = layersForCell(layers, cell);
          return Array.from({ length: colorLayerCount }, (_unused, layerIndex) => {
            const layerColors = (cellLayers[layerIndex]?.colors || []).slice(0, 16);
            while (layerColors.length < 16) layerColors.push(BITMAP_ROOM_DEFAULT_SPRITE_COLOR);
            return layerColors;
          }).flat();
        })
      );
      return {
        colors: colors.map(value => value & 0xff),
        attrs: attrsForOffsets(spriteOffsets),
        patterns: [...basePatterns, ...mirrorPatterns],
        usedConfigured: true,
        frameCount,
        delayFrames: getBitmapRoomSpriteAnimationDelayFrames(sprite),
        mirror: Boolean(authoredFacing),
        authoredFacing,
        layerCount: spritesPerFrame,
        spriteOffsets,
        cells,
        colorLayerCount,
        basePatternsNoMirror: basePatterns,
        basePatternsMirror: mirrorPatterns,
      };
    }
  }

  // Fallback: the original placeholder blob (single 16x16 sprite).
  return {
    colors: PLACEHOLDER_SPRITE_COLORS.slice(),
    attrs: attrsForOffsets([{ x: 0, y: 0 }]),
    patterns: PLACEHOLDER_SPRITE_PATTERNS.slice(),
    usedConfigured: false,
    frameCount: 1,
    delayFrames: 8,
    mirror: false,
    layerCount: 1,
    spriteOffsets: [{ x: 0, y: 0 }],
    cells: [{ x: 0, y: 0 }],
    colorLayerCount: 1,
    basePatternsNoMirror: PLACEHOLDER_SPRITE_PATTERNS.slice(),
    basePatternsMirror: [],
  };
}

/**
 * A per-state animation clip: a separate sprite whose frames are rendered using
 * the SAME cell grid / colour-layer count as the base player sprite (v1 "same
 * dimension" constraint). Its frames are appended after the base frames so a
 * single combined pattern/colour bank serves every state.
 */
interface BitmapStateAnimation {
  state: string;          // animation-state name (a skill's addsStates entry)
  animId: number;         // runtime id written to player_anim_state (1..K; 0 = base)
  frameBase: number;      // first frame index within the combined non-mirror bank
  frameCount: number;     // frames in this clip
  delayFrames: number;    // per-frame delay (8.33ms units, like the base)
  patternsNoMirror: number[];
  patternsMirror: number[];
  colors: number[];
}

/**
 * Extracts a state sprite's frames forced onto the base player's cell grid and
 * colour-layer count. Returns ok=false when the sprite has no usable frames so
 * the caller can skip the mapping (and the base walk/idle stays the fallback).
 *
 * This duplicates the base extraction math in buildSpriteTables on purpose: the
 * base path stays byte-for-byte untouched, and state sprites reuse the exact
 * same per-frame cell-major / colour-layer-inner layout so player_pat indexing
 * is uniform across every clip.
 */
function extractStateSpriteBank(
  sprite: Msx2Sprite,
  cells: BitmapSpriteSlotOffset[],
  colorLayerCount: number,
  authoredFacing: 'left' | 'right' | undefined,
): { ok: boolean; frameCount: number; delayFrames: number; patternsNoMirror: number[]; patternsMirror: number[]; colors: number[] } {
  const empty = { ok: false, frameCount: 0, delayFrames: 8, patternsNoMirror: [], patternsMirror: [], colors: [] };
  const frameIndices = getBitmapRoomSpriteFrameIndices(sprite);
  const rawFrameLayerSets = frameIndices
    .map(frameIndex => buildHardwareSpriteLayersForFrame(sprite, BITMAP_ROOM_DEFAULT_SPRITE_COLOR, frameIndex)
      .filter(layer => Array.isArray(layer.pattern) && layer.pattern.length === 32));
  if (!rawFrameLayerSets.some(layers => layers.length)) return empty;

  const emptyPattern = Array(32).fill(0);
  const layersForCell = (layers: typeof rawFrameLayerSets[number], cell: BitmapSpriteSlotOffset) =>
    layers.filter(layer => layer.xOffset === cell.x && layer.yOffset === cell.y);
  const patternSetForFrame = (layers: typeof rawFrameLayerSets[number], transform: (pattern: number[]) => number[]) =>
    cells.flatMap(cell => {
      const cellLayers = layersForCell(layers, cell);
      return Array.from({ length: colorLayerCount }, (_unused, layerIndex) => cellLayers[layerIndex]?.pattern || emptyPattern)
        .flatMap(pattern => transform(pattern).map(value => value & 0xff));
    });
  const patternsNoMirror = rawFrameLayerSets.flatMap(layers => patternSetForFrame(layers, pattern => pattern));
  const patternsMirror = authoredFacing
    ? rawFrameLayerSets.flatMap(layers => patternSetForFrame(layers, mirrorHardwareSpritePatternHorizontally))
    : [];
  const colors = rawFrameLayerSets.flatMap(layers =>
    cells.flatMap(cell => {
      const cellLayers = layersForCell(layers, cell);
      return Array.from({ length: colorLayerCount }, (_unused, layerIndex) => {
        const layerColors = (cellLayers[layerIndex]?.colors || []).slice(0, 16);
        while (layerColors.length < 16) layerColors.push(BITMAP_ROOM_DEFAULT_SPRITE_COLOR);
        return layerColors;
      }).flat();
    })
  ).map(value => value & 0xff);
  return {
    ok: true,
    frameCount: rawFrameLayerSets.length,
    delayFrames: getBitmapRoomSpriteAnimationDelayFrames(sprite),
    patternsNoMirror,
    patternsMirror,
    colors,
  };
}

// Animation-state names that already map to the base sprite (clip id 0); a
// state-linked animation table row using one of these is ignored as a clip.
const BITMAP_BASE_ANIM_STATES = new Set(['', 'idle', 'walk', 'walking', 'run', 'running', 'grounded', 'default', 'stand', 'standing']);

/**
 * Resolves the player's per-state animation sprites into appended frame banks.
 *
 * Two authoring sources, merged (state name -> sprite asset id):
 *   1. The player Animations table (`player.animations[*]`): each row that links
 *      a `spriteAssetId` to a `stateMachineState` (the existing Player editor UI;
 *      the field comment "does not drive runtime ASM yet" is now satisfied for
 *      SCREEN 5). Base walk/idle states are skipped (they ARE clip 0).
 *   2. `player.render.stateSprites: { <state>: <spriteAssetId> }` — an explicit
 *      override map (wins over the table) for projects authored as raw JSON.
 *
 * Each mapped sprite must resolve and have usable frames; banks get sequential
 * animIds and frameBase offsets continuing after the base sprite's frames.
 */
function resolveBitmapRoomStateAnimations(
  analysis: ProjectAnalysis,
  room: Msx2Screen5BitmapRoom,
  base: { frameCount: number; cells: BitmapSpriteSlotOffset[]; colorLayerCount: number; authoredFacing?: 'left' | 'right' },
): BitmapStateAnimation[] {
  const player = resolveBitmapRoomPlayer(analysis, room);

  // state -> spriteAssetId, insertion-ordered (animations first, then overrides).
  const mapping = new Map<string, string>();
  const animations = (player as any)?.animations as Record<string, any> | undefined;
  if (animations && typeof animations === 'object') {
    const order: string[] = Array.isArray((player as any)?.animationOrder) && (player as any).animationOrder.length
      ? (player as any).animationOrder
      : Object.keys(animations);
    for (const key of order) {
      const anim = animations[key];
      const state = String(anim?.stateMachineState || '').trim();
      const spriteAssetId = String(anim?.spriteAssetId || '').trim();
      if (!state || !spriteAssetId) continue;
      if (BITMAP_BASE_ANIM_STATES.has(state.toLowerCase())) continue;
      if (!mapping.has(state)) mapping.set(state, spriteAssetId);
    }
  }
  const stateSprites = (player?.render as any)?.stateSprites as Record<string, unknown> | undefined;
  if (stateSprites && typeof stateSprites === 'object') {
    for (const [state, rawSpriteId] of Object.entries(stateSprites)) {
      const trimmedState = String(state || '').trim();
      const spriteAssetId = String(rawSpriteId || '').trim();
      if (!trimmedState || !spriteAssetId) continue;
      mapping.set(trimmedState, spriteAssetId); // explicit override wins
    }
  }
  if (!mapping.size) return [];

  const banks: BitmapStateAnimation[] = [];
  let frameCursor = base.frameCount;
  let animId = 1;
  for (const [state, spriteAssetId] of mapping) {
    const sprite = resolveMsx2SpriteById(analysis, spriteAssetId);
    if (!sprite) continue;
    const bank = extractStateSpriteBank(sprite, base.cells, base.colorLayerCount, base.authoredFacing);
    if (!bank.ok) continue;
    banks.push({
      state,
      animId,
      frameBase: frameCursor,
      frameCount: bank.frameCount,
      delayFrames: bank.delayFrames,
      patternsNoMirror: bank.patternsNoMirror,
      patternsMirror: bank.patternsMirror,
      colors: bank.colors,
    });
    frameCursor += bank.frameCount;
    animId += 1;
  }
  return banks;
}

const COLLISION_COLS = 16;
const COLLISION_ROWS = 12;

function buildCollisionTableBytes(room: Msx2Screen5BitmapRoom): number[] {
  const bytes: number[] = [];
  for (let y = 0; y < COLLISION_ROWS; y++) {
    for (let x = 0; x < COLLISION_COLS; x++) {
      bytes.push(clampByte(room.collision?.[y]?.[x], 0));
    }
  }
  return bytes;
}

function buildBehaviorTableBytes(room: Msx2Screen5BitmapRoom): number[] {
  const bytes: number[] = [];
  for (let y = 0; y < COLLISION_ROWS; y++) {
    for (let x = 0; x < COLLISION_COLS; x++) {
      bytes.push(clampByte(room.behavior?.[y]?.[x], 0));
    }
  }
  return bytes;
}

function resolvePlayerSpawnPixels(room: Msx2Screen5BitmapRoom): { x: number; y: number; visible: boolean } {
  const entry = (room.playerEntries || [])[0];
  if (!entry) return { x: 0, y: 0xD8, visible: false };
  // playerEntries store PIXEL coordinates (0..255 / 0..191), NOT tile coords.
  const x = clampInt(entry?.x, 0, 255, 32);
  const y = clampInt(entry?.y, 0, 191, 128);
  return { x, y, visible: true };
}

// Maximum foreground hardware-sprite tiles per room (SAT/pattern budget; the
// player keeps slot `foregroundCount` onwards).
const BITMAP_ROOM_FOREGROUND_MAX = 3;
// Off-screen, non-terminating sprite Y written to empty foreground SAT slots so
// the V9938 keeps processing sprites up to the player (Y=#D8 would terminate).
const FOREGROUND_EMPTY_SPRITE_Y = 0xD4;

/**
 * Pack a 16x16 atlas tile into a 32-byte V9938 sprite-mode-2 pattern that is a
 * 1-bit OPACITY MASK: pixels equal to colour 0 (canvas transparent in the tile
 * editor) are transparent in the hardware sprite; every other pixel is opaque
 * (1). Layout matches the player sprite packing
 * (buildHardwareSpritePatternForLayer): four quadrants [TL, BL, TR, BR], 8 bytes
 * each, MSB = leftmost pixel.
 */
function buildForegroundMaskPattern(pixels: number[][], _backgroundColor: number): number[] {
  const result = new Array(32).fill(0);
  const height = Math.min(16, pixels.length);
  for (let gy = 0; gy < height; gy++) {
    const row = pixels[gy] || [];
    const width = Math.min(16, row.length);
    for (let gx = 0; gx < width; gx++) {
      if ((clampByte(row[gx], 0) & 0x0f) === 0) continue;
      const quadrantBase = (gx < 8 ? 0 : 16) + (gy < 8 ? 0 : 8);
      result[quadrantBase + (gy & 7)] |= 0x80 >> (gx & 7);
    }
  }
  return result;
}

/**
 * Resolve a foreground tile's single sprite colour. An explicit `color` wins;
 * otherwise the most common colour in the tile excluding 0 (canvas transparent)
 * and the room background colour. Colour 0 is transparent in sprites, so it is
 * never returned (min 1).
 */
function resolveForegroundTileColor(pixels: number[][], backgroundColor: number, explicit?: number): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    const c = clampByte(explicit, 1) & 0x0f;
    return c === 0 ? 1 : c;
  }
  const bg = backgroundColor & 0x0f;
  const counts = new Array(16).fill(0);
  for (const row of pixels) {
    if (!row) continue;
    for (const raw of row) {
      const c = clampByte(raw, 0) & 0x0f;
      if (c === 0 || c === bg) continue;
      counts[c]++;
    }
  }
  let best = 1;
  let bestCount = 0;
  for (let c = 1; c < 16; c++) {
    if (counts[c] > bestCount) {
      bestCount = counts[c];
      best = c;
    }
  }
  return best;
}

interface BitmapRoomForegroundData {
  patternBytes: number[];
  colorBytes: number[];
  /** Per-room table: foregroundCount * 3 bytes (satY, satX, pattern-offset/#FF). */
  roomTables: number[][];
}

/**
 * Build the global ROM tables for foreground tiles across every room: a packed
 * mask-pattern table (32 bytes per filled tile), a colour table (16 bytes per
 * filled tile) and one 3-byte-per-slot dispatch table per room. Filled tiles get
 * a sequential global pattern offset; empty slots (rooms with fewer than
 * `foregroundCount` tiles) carry pattern-offset #FF so the runtime paints an
 * off-screen invisible sprite.
 */
function buildBitmapRoomForegroundTables(rooms: Msx2Screen5BitmapRoom[], foregroundCount: number): BitmapRoomForegroundData {
  const patternBytes: number[] = [];
  const colorBytes: number[] = [];
  const roomTables: number[][] = [];
  let globalOffset = 0;
  for (const room of rooms) {
    const tiles = (room.foregroundTiles || []).slice(0, foregroundCount);
    const bg = clampByte(room.backgroundColor, 0) & 0x0f;
    const table: number[] = [];
    for (let slot = 0; slot < foregroundCount; slot++) {
      const tile = tiles[slot];
      if (!tile) {
        table.push(0, 0, 0xFF);
        continue;
      }
      const entry = (room.atlas?.entries || []).find(e => e.id === tile.atlasEntryId);
      // Fallback when the referenced atlas entry is missing: a fully-opaque tile
      // (use a non-background colour so the mask is non-empty).
      const pixels = entry
        ? extractAtlasEntryPixels(room, entry)
        : Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => (bg === 0 ? 1 : 0)));
      const mask = buildForegroundMaskPattern(pixels, bg);
      const color = resolveForegroundTileColor(pixels, bg, tile.color);
      for (const b of mask) patternBytes.push(b & 0xff);
      for (let i = 0; i < 16; i++) colorBytes.push(color & 0xff);
      const cellX = clampInt(tile.cellX, 0, 15, 0);
      const cellY = clampInt(tile.cellY, 0, 11, 0);
      const satY = (cellY * 16 + BITMAP_ROOM_GAME_Y_OFFSET) & 0xff;
      const satX = (cellX * 16) & 0xff;
      table.push(satY, satX, globalOffset & 0xff);
      globalOffset++;
    }
    roomTables.push(table);
  }
  return { patternBytes, colorBytes, roomTables };
}

/**
 * Emit the `bitmap_load_foreground_sprites` runtime routine. Called on init and
 * on every room flip to (re)write the foreground SAT slots, upload their mask
 * patterns/colours, and clear empty slots to an off-screen invisible sprite.
 */
function buildBitmapLoadForegroundSpritesAsm(fg: { count: number; patternGroupBase: number }): string {
  const slotBlocks: string[] = [];
  for (let i = 0; i < fg.count; i++) {
    const patGroup = fg.patternGroupBase + i;
    const patByte = (patGroup * 4) & 0xff;
    const patternVram = 0xF800 + patGroup * 32;
    const colorVram = 0xF400 + i * 16;
    const satVram = 0xF600 + i * 4;
    slotBlocks.push(`
.slot_${i}:
    ld a, (ix+2)              ; pattern offset (#FF = empty slot for this room)
    cp #FF
    jp z, .slot_${i}_empty
    ; --- upload 32-byte mask pattern -> VRAM ${hexWord(patternVram)} (group ${patGroup}) ---
    ld a, (ix+2)
    call fg_patterns_offset
    ld de, ${hexWord(patternVram)}
    ld bc, 32
    call copy_to_vram_ext
    ; --- upload 16-byte colour table -> VRAM ${hexWord(colorVram)} (slot ${i}) ---
    ld a, (ix+2)
    call fg_colors_offset
    ld de, ${hexWord(colorVram)}
    ld bc, 16
    call copy_to_vram_ext
    ; --- write SAT slot ${i} (filled): Y/X from table ---
    ld a, (ix+0)
    ld b, a                   ; B = satY
    ld a, (ix+1)
    ld c, a                   ; C = satX
    jp .slot_${i}_sat
.slot_${i}_empty:
    ld b, #${FOREGROUND_EMPTY_SPRITE_Y.toString(16).toUpperCase().padStart(2, '0')}                 ; satY = off-screen (invisible, non-terminator)
    ld c, 0                   ; satX
.slot_${i}_sat:
    ld de, ${hexWord(satVram)}
    push de
    ld a, d
    and #C0
    rlca
    rlca
    ld e, a
    ld a, #0E
    call vdp_write_register
    pop de
    ld a, e
    out (${VDP_CTRL_PORT}), a
    ld a, d
    and #3F
    or #40
    out (${VDP_CTRL_PORT}), a
    ld a, b
    out (${VDP_DATA_PORT}), a ; Y
    ld a, c
    out (${VDP_DATA_PORT}), a ; X
    ld a, ${hexByte(patByte)}; pattern number
    out (${VDP_DATA_PORT}), a
    xor a
    out (${VDP_DATA_PORT}), a ; EC = 0
    xor a
    ld e, a
    ld a, #0E
    call vdp_write_register
    inc ix
    inc ix
    inc ix                    ; IX -> next slot`);
  }
  return `
; ------------------------------------------------------------
; FUNCTION: bitmap_load_foreground_sprites
; ------------------------------------------------------------
; PURPOSE:
;   Load the foreground hardware-sprite tiles of the ACTIVE room into the first
;   ${fg.count} SAT slot(s) (VRAM #F600..${hexWord(0xF600 + fg.count * 4 - 1)}), so the
;   player (SAT slot ${fg.count}) walks BEHIND them. Each foreground tile is a
;   single-colour 16x16 sprite whose pattern is a 1-bit opacity mask derived from
;   its atlas tile (pixel == background -> transparent). Rooms with fewer than
;   ${fg.count} foreground tiles fill the leftover slots with an off-screen
;   invisible sprite (Y=#${FOREGROUND_EMPTY_SPRITE_Y.toString(16).toUpperCase().padStart(2, '0')}) so the VDP keeps processing sprites up to the player.
;   Patterns/colours are uploaded once here; the per-frame player/bullet SAT
;   writers never touch slots 0..${fg.count - 1}, so these sprites stay put.
;
; INPUT:
;   current_screen_index = active room index.
;
; OUTPUT:
;   SAT slots 0..${fg.count - 1}, pattern groups ${fg.patternGroupBase}..${fg.patternGroupBase + fg.count - 1}
;   and colour slots 0..${fg.count - 1} rewritten for the active room.
;
; DESTROYS:
;   AF, BC, DE, HL.
;
; PRESERVES:
;   IX, IY (caller's IX is pushed/popped; used internally as the room cursor).
;
; CALLS:
;   copy_to_vram_ext, vdp_write_register, fg_patterns_offset, fg_colors_offset.
;
; SIDE EFFECTS:
;   Writes VRAM SAT (#F600..), pattern table (#F800+) and colour table (#F400+);
;   restores R#14 = 0 on exit.
; ------------------------------------------------------------
bitmap_load_foreground_sprites:
    push ix
    ; IX -> active room foreground table (bitmap_room_foreground_ptr_table[idx]).
    ld hl, bitmap_room_foreground_ptr_table
    ld a, (current_screen_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    push hl
    pop ix                    ; IX -> 3 bytes/slot dispatch table
${slotBlocks.join('\n')}
    pop ix
    ret

; HL = bitmap_room_foreground_patterns + A*32 (A = foreground pattern offset).
fg_patterns_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *32
    ld de, bitmap_room_foreground_patterns
    add hl, de
    ret

; HL = bitmap_room_foreground_colors + A*16 (A = foreground pattern offset).
fg_colors_offset:
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                ; *16
    ld de, bitmap_room_foreground_colors
    add hl, de
    ret
`;
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2BitmapRoomConfig): string {
  const isKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  if (config.romMode === 'megarom' && config.targetFormat !== 'konami') {
    throw new Error(`MSX2 bitmap-room MegaROM currently supports Konami mapper only, got ${config.targetFormat}`);
  }
  // World engine: all screens of a world share one tileset/palette. The shared
  // tileset (the start room's atlas) is uploaded once to offscreen VRAM; each room
  // is a 192-byte tile map replayed as VRAM->VRAM copies by load_room.
  const world = collectBitmapWorldRooms(analysis);
  const sourceRooms = (world.rooms.length ? world.rooms : [firstBitmapRoom(analysis)]).map(normalizeRoom);
  const sharedAtlas = buildSharedWorldAtlasRooms(sourceRooms);
  const rooms = sharedAtlas.rooms;
  const startIndex = Math.min(world.startIndex, rooms.length - 1);
  const room = rooms[startIndex];
  const bitmapRoomPlayer = resolveBitmapRoomPlayer(analysis, room);
  const playerVitals = resolveBitmapPlayerVitals(bitmapRoomPlayer);
  const spawn = resolvePlayerSpawnPixels(room);
  const worldPalette = resolveWorldPalette(analysis, world.paletteAssetId, room.palette);
  const paletteBytes = buildPaletteBytes(worldPalette);
  const atlasPixels = normalizeAtlasPixels(sharedAtlas.atlasRoom);
  // Linked MSX2 HUD asset (Msx2HudAsset via room.runtime.hudAssetId): supersedes the
  // legacy hardcoded hearts HUD + inline room.runtime.hudWidgets when present. See
  // resolveLinkedHudAsset / buildBitmapHudSeedPixels / buildBitmapHudLinked*Asm.
  const linkedHudAsset = resolveLinkedHudAsset(analysis, room.runtime?.hudAssetId);
  const hudGloballyHidden = room.runtime?.showHud === false || room.runtime?.hideHud === true;
  // A linked HUD asset owns the SCREEN 5 HUD band. In that mode the legacy
  // automatic hearts HUD is fully disabled: no routines, no calls, no heart RLE
  // resources. Selecting NONE in the editor restores this classic fallback.
  const useClassicHeartsHud = !linkedHudAsset && !hudGloballyHidden;
  const linkedHudFont = linkedHudAsset ? getBitmapHudFontAsset(analysis, room, linkedHudAsset) : undefined;
  const linkedHudDynamicSources = linkedHudAsset && !hudGloballyHidden ? collectLinkedHudDynamicSources(linkedHudAsset) : [];
  // Offscreen tile/glyph source rows for linked dynamic widgets, stacked right after
  // the classic hearts slot (Y=224..239) and before the shared atlas (Y=512). 16 rows
  // reserved per tile-based instance (iconRow uses all 16; counter only uses the top 8,
  // the rest stay unwritten padding) so every instance steps at a uniform offset.
  // 'bar' widgets are EXCLUDED: they draw with HMMV fills (no source tile), so they
  // consume neither an offscreen slot nor the VRAM collision budget.
  const tileBasedHudSources = linkedHudDynamicSources.filter(source => source.kind !== 'bar');
  // Offscreen source rows for linked dynamic widgets. VRAM rows 256..467 are the
  // page-1 VISIBLE band (HUD seed + game band) and rows 488..511 hold the sprite
  // colour/SAT/pattern tables (#F400+), so the truly free 16px slots are:
  //   - page-0 offscreen band: rows 212..243 (2 slots),
  //   - page-1 offscreen band: rows 468..483 (1 slot, right above #F400),
  //   - everything after the shared atlas (rows 512+atlasHeight .. 1023).
  // The old fixed base at row 224 overflowed into the page-1 HUD band from the
  // third tile widget on: its glyph strip overwrote the page-1 HUD seed and became
  // visible after the first room transition flipped the display to page 1.
  const atlasRows16 = Math.ceil(atlasPixels.length / 16) * 16;
  // NPC dialogue system: its glyph-strip/portrait blob reserves rows at the TOP
  // end of VRAM (growing down from 1024), so the atlas and the linked-HUD slot
  // layout stay untouched; the HUD slot scan below simply stops at the blob.
  const dialogueData = collectBitmapDialogueData(analysis, rooms, getBitmapHudFontAsset(analysis, room, linkedHudAsset));
  const dialogueVramBaseRow = dialogueData ? 1024 - Math.ceil(dialogueData.blobRows / 16) * 16 : 1024;
  if (dialogueData && dialogueVramBaseRow < BITMAP_ROOM_ATLAS_BASE_Y + atlasRows16) {
    throw new Error(`MSX2 SCREEN 5 bitmap room "${room.name}": the NPC dialogue glyph/portrait blob needs ${dialogueData.blobRows} VRAM rows but only ${1024 - (BITMAP_ROOM_ATLAS_BASE_Y + atlasRows16)} rows are free after the shared atlas. Reduce portrait sizes/count or shrink the atlas.`);
  }
  const linkedHudSlotYs: number[] = [212, 228, 468];
  for (let slotY = BITMAP_ROOM_ATLAS_BASE_Y + atlasRows16; slotY + 16 <= dialogueVramBaseRow; slotY += 16) {
    linkedHudSlotYs.push(slotY);
  }
  if (tileBasedHudSources.length > linkedHudSlotYs.length) {
    throw new Error(`MSX2 HUD asset linked to room "${room.name}" defines too many tile/glyph dynamic widgets (${tileBasedHudSources.length}); only ${linkedHudSlotYs.length} offscreen VRAM slots are free next to the shared tileset atlas. Reduce the number of iconRow/counter widgets. Static icon/portrait widgets are baked into the HUD seed and do not consume these slots.`);
  }
  const linkedHudTileData: { index: number; kind: HudDynamicSource['kind']; tileVramY: number; bytes: number[]; rleChunks: ReturnType<typeof buildRleChunksForVram>; uploadAsm: string }[] = [];
  linkedHudDynamicSources.forEach((source, index) => {
    if (source.kind === 'bar') return; // bars use HMMV, no offscreen tile
    const tileSlot = linkedHudTileData.length;
    const tileVramY = linkedHudSlotYs[tileSlot];
    const pixels = source.kind === 'iconRow'
      ? buildIconRowTilePixels(linkedHudAsset!, source.element)
      : buildCounterGlyphPixels(linkedHudFont, source.element.colors.text ?? 15);
    const bytes = packBitmapPixels(pixels);
    const rleChunks = buildRleChunksForVram(bytes, tileVramY * ROW_BYTES, `bitmap_room_hud_linked_${index}_rle_chunk`);
    const uploadAsm = buildRleUploadAsm(rleChunks, isKonamiMegaRom);
    linkedHudTileData.push({ index, kind: source.kind, tileVramY, bytes, rleChunks, uploadAsm });
  });
  const atlasVramBase = BITMAP_ROOM_ATLAS_BASE_Y * ROW_BYTES;
  const tilesetBytes = packAtlasPixels(sharedAtlas.atlasRoom);
  const tilesetRleChunks = buildRleChunksForVram(tilesetBytes, atlasVramBase, 'bitmap_room_tileset_rle_chunk');
  // NPC dialogue glyph strips + portrait frames: one packed 4bpp blob uploaded
  // once at boot to the rows reserved above the atlas region.
  const dialogueBlobBytes = dialogueData ? packBitmapPixels(buildBitmapDialogueBlobPixels(dialogueData)) : [];
  const dialogueRleChunks = dialogueData
    ? buildRleChunksForVram(dialogueBlobBytes, dialogueVramBaseRow * ROW_BYTES, 'bitmap_dlg_gfx_rle_chunk')
    : [];
  // Classic automatic hearts HUD tiles (16x16 full + 16x16 empty outline, side
  // by side = 32x16 4bpp blob). They are emitted only when no linked HUD asset
  // owns the HUD band; otherwise the linked HUD's tile/glyph data reuses the
  // same offscreen VRAM row and the ROM does not carry dead heart resources.
  const heartTileBytes = useClassicHeartsHud ? packBitmapPixels(buildBitmapHeartTilePixels()) : [];
  const heartRleChunks = useClassicHeartsHud
    ? buildRleChunksForVram(heartTileBytes, BITMAP_HUD_HEART_VRAM, 'bitmap_room_hud_heart_rle_chunk')
    : [];
  // Per-room render program (command blocks) + collision map.
  const roomTables = rooms.map((roomData, index) => {
    const renderPage0 = buildRoomRenderBlocks(roomData, BITMAP_ROOM_PAGE0_BASE_Y);
    const renderPage1 = buildRoomRenderBlocks(roomData, BITMAP_ROOM_PAGE1_BASE_Y);
    return {
      index,
      renderLabelPage0: `bitmap_room_render_${index}_p0`,
      renderBytesPage0: renderPage0.bytes,
      renderLabelPage1: `bitmap_room_render_${index}_p1`,
      renderBytesPage1: renderPage1.bytes,
      blockCount: renderPage0.count,
      collisionLabel: `bitmap_room_collision_${index}`,
      collisionBytes: buildCollisionTableBytes(roomData),
      behaviorLabel: `bitmap_room_behavior_${index}`,
      behaviorBytes: buildBehaviorTableBytes(roomData),
    };
  });
  const roomDataBlocks: BankedDataBlock[] = roomTables.flatMap(table => [
    {
      label: table.renderLabelPage0,
      bytes: table.renderBytesPage0,
      description: `Room ${table.index} page 0 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`,
    },
    {
      label: table.renderLabelPage1,
      bytes: table.renderBytesPage1,
      description: `Room ${table.index} page 1 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`,
    },
    {
      label: table.collisionLabel,
      bytes: table.collisionBytes,
      description: `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} collision grid (16x16 px cells), row-major, 0=empty`,
    },
    {
      label: table.behaviorLabel,
      bytes: table.behaviorBytes,
      description: `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default`,
    },
  ]);
  // Edge-transition table: 4 bytes per room (west, east, north, south); #FF = no rail.
  const transitionTableBytes = rooms.flatMap((_roomData, index) => {
    const rails = world.transitions.get(index) || {};
    const target = (dir: ConnectionDirection) => (rails[dir] === undefined ? 0xff : rails[dir]!);
    return [target('west'), target('east'), target('north'), target('south')];
  });
  const hudSeedBytes = packBitmapPixels(buildBitmapHudSeedPixels(room, atlasPixels, analysis, linkedHudAsset, playerVitals));
  const hudSeedRleChunksPage0 = buildRleChunksForVram(hudSeedBytes, 0, 'bitmap_room_hud_seed_p0_rle_chunk');
  const hudSeedRleChunksPage1 = buildRleChunksForVram(hudSeedBytes, BITMAP_ROOM_PAGE1_VRAM_BASE, 'bitmap_room_hud_seed_p1_rle_chunk');
  const allHudSeedRleChunks = [...hudSeedRleChunksPage0, ...hudSeedRleChunksPage1];
  const linkedHudAllRleChunks = linkedHudTileData.flatMap(entry => entry.rleChunks);
  // GameFlow intro: SCREEN 5 presentation scene(s) + transitions before gameplay.
  // Each scene bitmap uploads to the visible page 0 (VRAM #00000) through the same
  // RLE decoder used by the HUD seed/atlas, so simple32k and MegaROM both work.
  const introScenes = resolveBitmapIntroScenes(analysis);
  const introSceneBlobs: BitmapIntroSceneBlob[] = introScenes.map((scene, index) => ({
    scene,
    index,
    rleChunks: buildRleChunksForVram(scene.bitmapBytes, 0, `bitmap_intro_scene${index}_rle_chunk`),
  }));
  const introRleChunks = introSceneBlobs.flatMap(blob => blob.rleChunks);
  const introEncodedBytes = introRleChunks.reduce((total, chunk) => total + chunk.bytes.length, 0);
  if (!isKonamiMegaRom && introEncodedBytes > 16384) {
    throw new Error(`MSX2 bitmap-room GameFlow intro needs ${introEncodedBytes} bytes of presentation RLE data and cannot fit a simple 32KB ROM; export as Konami MegaROM instead.`);
  }
  const allRleChunks = [...allHudSeedRleChunks, ...tilesetRleChunks, ...heartRleChunks, ...linkedHudAllRleChunks, ...introRleChunks, ...dialogueRleChunks];
  const bankedDataBlocks = isKonamiMegaRom
    ? [
      ...buildBankedRleDataBlocks(allHudSeedRleChunks, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed mirrored on page 0/1, packed 4bpp RLE`),
      ...buildBankedRleDataBlocks(tilesetRleChunks, `Shared world tileset (atlas), packed 4bpp RLE`),
      ...(useClassicHeartsHud ? buildBankedRleDataBlocks(heartRleChunks, `Hearts HUD tiles (full + empty outline), packed 4bpp RLE`) : []),
      ...linkedHudTileData.flatMap(entry => buildBankedRleDataBlocks(entry.rleChunks, `Linked HUD dynamic widget #${entry.index} (${entry.kind}) tile/glyph data, packed 4bpp RLE`)),
      ...roomDataBlocks,
      ...introSceneBlobs.flatMap(blob => buildBankedRleDataBlocks(blob.rleChunks, `GameFlow intro scene #${blob.index} SCREEN 5 bitmap, packed 4bpp RLE`)),
      ...(dialogueData ? buildBankedRleDataBlocks(dialogueRleChunks, 'NPC dialogue glyph strips + portrait frames, packed 4bpp RLE') : []),
    ]
    : [];
  const bankedDataBanks = isKonamiMegaRom ? packBitmapRoomDataBanks(bankedDataBlocks) : [];
  if (isKonamiMegaRom) assignDataBankConstants(bankedDataBanks, allRleChunks);
  const bankedDataEquates = isKonamiMegaRom ? formatBankedDataEquates(bankedDataBanks) : '';
  const bankedDataAsm = isKonamiMegaRom ? formatBankedDataBanks(bankedDataBanks) : '';
  const hudSeedDataAsm = isKonamiMegaRom
    ? `; Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed for page 0/1 is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(allHudSeedRleChunks, hudSeedBytes.length * 2, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed mirrored on page 0/1, packed 4bpp RLE`);
  const tilesetDataAsm = isKonamiMegaRom
    ? `; Shared world tileset RLE is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(tilesetRleChunks, tilesetBytes.length, `Shared world tileset (atlas), packed 4bpp RLE, destination VRAM ${hexVram(atlasVramBase)}`);
  const heartUploadAsm = useClassicHeartsHud ? buildRleUploadAsm(heartRleChunks, isKonamiMegaRom) : '';
  const heartDataAsm = useClassicHeartsHud
    ? (isKonamiMegaRom
        ? `; Hearts HUD tiles RLE is emitted in Konami MegaROM data banks below.\n`
        : formatRleChunks(heartRleChunks, heartTileBytes.length, `Hearts HUD tiles (full + empty outline), packed 4bpp RLE, destination VRAM ${hexVram(BITMAP_HUD_HEART_VRAM)}`))
    : `; Classic hearts HUD disabled: linked MSX2 HUD asset owns the HUD band.\n`;
  // Upload ASM + raw data section for every linked HUD dynamic widget's tile/glyph blob.
  // (Per-entry upload ASM is precomputed in linkedHudTileData; 'bar' widgets have no
  // tile/glyph data and are omitted here.)
  const linkedHudDataAsm = isKonamiMegaRom
    ? (linkedHudTileData.length ? `; Linked HUD dynamic widget tile/glyph RLE is emitted in Konami MegaROM data banks below.\n` : '')
    : linkedHudTileData.map(entry => formatRleChunks(
        entry.rleChunks,
        entry.bytes.length,
        `Linked HUD dynamic widget #${entry.index} (${entry.kind}) tile/glyph data, packed 4bpp RLE, destination VRAM ${hexVram(entry.tileVramY * ROW_BYTES)}`
      )).join('');
  const dialogueGfxDataAsm = !dialogueData
    ? ''
    : isKonamiMegaRom
      ? `; NPC dialogue glyph/portrait RLE is emitted in Konami MegaROM data banks below.\n`
      : formatRleChunks(dialogueRleChunks, dialogueBlobBytes.length, `NPC dialogue glyph strips + portrait frames, packed 4bpp RLE, destination VRAM ${hexVram(dialogueVramBaseRow * ROW_BYTES)}`);
  const playerSprite = resolveBitmapRoomPlayerSprite(analysis, room);
  const spriteTables = buildSpriteTables(playerSprite);
  const spriteSourceLabel = spriteTables.usedConfigured
    ? `configured player sprite${playerSprite?.name ? ` "${playerSprite.name}"` : ''}`
    : 'placeholder fallback (no configured player sprite resolvable)';
  // Per-state animation clips: optional separate sprites (player.render.stateSprites)
  // rendered on the SAME cell grid as the base sprite. Their frames are appended
  // after the base frames into one combined pattern/colour bank. When none are
  // configured the combined arrays equal the base arrays, so the ROM is byte-equal.
  const stateAnimations = resolveBitmapRoomStateAnimations(analysis, room, {
    frameCount: spriteTables.frameCount,
    cells: spriteTables.cells,
    colorLayerCount: spriteTables.colorLayerCount,
    authoredFacing: spriteTables.authoredFacing,
  });
  const hasStateAnimations = stateAnimations.length > 0;
  // Map an animation-state name -> runtime id so skills can assert their state.
  const stateAnimIds: Record<string, number> = {};
  for (const bank of stateAnimations) stateAnimIds[bank.state] = bank.animId;
  // Combined banks: [base non-mirror][state non-mirror][base mirror][state mirror].
  const combinedFrameCount = spriteTables.frameCount + stateAnimations.reduce((sum, bank) => sum + bank.frameCount, 0);
  const combinedPatterns = [
    ...spriteTables.basePatternsNoMirror,
    ...stateAnimations.flatMap(bank => bank.patternsNoMirror),
    ...spriteTables.basePatternsMirror,
    ...stateAnimations.flatMap(bank => bank.patternsMirror),
  ];
  const combinedColors = [
    ...spriteTables.colors,
    ...stateAnimations.flatMap(bank => bank.colors),
  ];
  // Clip table (id 0 = base idle/walk, ids 1..K = state clips): 3 bytes each
  // (frameBase, frameCount, delay). Emitted only when state animations exist.
  const animClipTableBytes = hasStateAnimations
    ? [
        0, spriteTables.frameCount & 0xff, spriteTables.delayFrames & 0xff,
        ...stateAnimations.flatMap(bank => [bank.frameBase & 0xff, bank.frameCount & 0xff, bank.delayFrames & 0xff]),
      ]
    : [];
  // Jump/fall physics from the linked Player Config (movement.jumpPower / maxFallSpeed).
  const playerPhysics = resolveBitmapPlayerPhysics(bitmapRoomPlayer);
  // Body collision box from the Player Config; defaults to the player sprite size so a
  // 16x32 sprite collides over its full height even without an explicit box.
  const playerHitbox = getBitmapPlayerBodyHitbox(bitmapRoomPlayer, playerSprite?.size);
  // Vitals from the Player Config (health.maxHealth / lives / invulnerabilityFrames).
  // Consumed by the Deadly-tile damage system and playerEnergy-bound HUD widgets.
  // Deadly-tile damage system: EQUs, init, main-loop call and the runtime routine.
  const deadlySystem = buildBitmapDeadlySystemAsm(playerVitals, playerHitbox);
  // Hearts HUD: one heart per point of player_health, top-left of the HUD band.
  // Only the classic zero-config fallback when no MSX2 HUD asset is linked (byte-
  // identical ROM for projects that never touch the Msx2HudEditor); a linked HUD
  // asset takes over the whole HUD (see linkedHud* below).
  const heartsHud = useClassicHeartsHud
    ? buildBitmapHeartsHudAsm(playerVitals.maxHealth, heartUploadAsm)
    : { equates: '', initAsm: '', mainLoopCall: '', routinesAsm: '' };
  // DASH skill (pilot): config from the linked Player Config; the ASM uses the
  // bitmap room's own collision/move primitives (no SCREEN 4 routines reused).
  const dashConfig = getMsx2DashConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const dashEquates = buildBitmapDashEquates(dashConfig);
  const dashInitClear = buildBitmapDashInitClearAsm(dashConfig);
  const dashGate = buildBitmapDashGateAsm(dashConfig);
  const dashRuntime = buildBitmapDashRuntimeAsm(dashConfig, { dashing: stateAnimIds['dashing'] });
  // AIR DASH skill: consumes the frame before normal movement/gravity, using
  // bitmap_try_move_x so collision remains tied to the SCREEN 5 room cache.
  const airDashConfig = getMsx2AirDashConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const airDashRamBase = MSX2_BITMAP_DASH_RAM_BASE + (bitmapDashEnabled(dashConfig) ? MSX2_BITMAP_DASH_RAM_BYTES : 0);
  const airDashEquates = buildBitmapAirDashEquates(airDashConfig, airDashRamBase);
  const airDashInitClear = buildBitmapAirDashInitClearAsm(airDashConfig);
  const airDashGate = buildBitmapAirDashGateAsm(airDashConfig);
  const airDashRuntime = buildBitmapAirDashRuntimeAsm(airDashConfig, { lockGroundDashOnStart: bitmapDashEnabled(dashConfig) });
  // GLIDE skill: clamps integer bitmap player_vy after gravity and before the
  // Y movement loop. RAM follows dash/air_dash so optional skill blocks cannot overlap.
  const glideConfig = getMsx2GlideConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const glideRamBase = airDashRamBase + (bitmapAirDashEnabled(airDashConfig) ? MSX2_BITMAP_AIR_DASH_RAM_BYTES : 0);
  const glideEquates = buildBitmapGlideEquates(glideConfig, glideRamBase);
  const glideInitClear = buildBitmapGlideInitClearAsm(glideConfig);
  const glideGravityHook = buildBitmapGlideGravityHookAsm(glideConfig);
  const glideRuntime = buildBitmapGlideRuntimeAsm(glideConfig);
  // WALL JUMP skill: detects bitmap wall contact and runs a committed pixel
  // kick through bitmap_try_move_x. RAM follows dash/air_dash/glide.
  const wallJumpConfig = getMsx2WallJumpConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const wallJumpRamBase = glideRamBase + (glideConfig.enabled ? MSX2_BITMAP_GLIDE_RAM_BYTES : 0);
  const wallJumpEquates = buildBitmapWallJumpEquates(wallJumpConfig, wallJumpRamBase);
  const wallJumpInitClear = buildBitmapWallJumpInitClearAsm(wallJumpConfig);
  const wallJumpInputHook = buildBitmapWallJumpInputHookAsm(wallJumpConfig);
  const wallJumpGravityHook = buildBitmapWallJumpGravityHookAsm(wallJumpConfig);
  const wallJumpLandClear = buildBitmapWallJumpLandClearAsm(wallJumpConfig);
  const wallJumpRuntime = buildBitmapWallJumpRuntimeAsm(wallJumpConfig, {
    wall_sliding: stateAnimIds['wall_sliding'],
    wall_jumping: stateAnimIds['wall_jumping'],
  });
  // POWER STOMP skill: pins the bitmap integer fall velocity and optionally
  // shakes SCREEN 5 through V9938 R#18. RAM follows wall_jump.
  const powerStompConfig = getMsx2PowerStompConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const powerStompRamBase = wallJumpRamBase + (wallJumpConfig.enabled ? MSX2_BITMAP_WALL_JUMP_RAM_BYTES : 0);
  const powerStompShakeRamBase = powerStompRamBase + (bitmapPowerStompEnabled(powerStompConfig) ? MSX2_BITMAP_POWER_STOMP_RAM_BYTES : 0);
  const powerStompEquates = buildBitmapPowerStompEquates(powerStompConfig, powerStompRamBase, powerStompShakeRamBase);
  const powerStompInitClear = buildBitmapPowerStompInitClearAsm(powerStompConfig);
  const powerStompInputHook = buildBitmapPowerStompInputHookAsm(powerStompConfig);
  const powerStompGravityHook = buildBitmapPowerStompGravityHookAsm(powerStompConfig);
  const powerStompLandClear = buildBitmapPowerStompLandClearAsm(powerStompConfig);
  const powerStompMainLoopCall = buildBitmapPowerStompMainLoopCallAsm(powerStompConfig);
  const powerStompRuntime = buildBitmapPowerStompRuntimeAsm(powerStompConfig);
  // SHOOT skill: fires bullets in the facing direction. RAM follows power_stomp shake.
  const shootConfig = getMsx2ShootConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const shootRamBase = powerStompShakeRamBase + (bitmapPowerStompEnabled(powerStompConfig) ? MSX2_BITMAP_SCREEN_SHAKE_RAM_BYTES : 0);
  const shootEquates = buildBitmapShootEquates(shootConfig, shootRamBase);
  const shootInitClear = buildBitmapShootInitClearAsm(shootConfig);
  const shootGate = buildBitmapShootGateAsm(shootConfig);
  const bulletSprite = resolveBitmapBulletSprite(analysis, resolveBitmapRoomPlayer(analysis, room));
  const playerPatternGroups = combinedFrameCount * spriteTables.layerCount * (spriteTables.mirror ? 2 : 1);
  const bulletPatternNumber = playerPatternGroups * 4;
  // Foreground hardware-sprite tiles (player walks behind them). foregroundCount
  // is the MAX tile count across all rooms (capped at 3); 0 disables the feature
  // entirely and keeps the ROM bit-identical to legacy exports.
  const foregroundCount = rooms.length
    ? Math.min(BITMAP_ROOM_FOREGROUND_MAX, Math.max(0, ...rooms.map(r => (Array.isArray(r.foregroundTiles) ? r.foregroundTiles.length : 0))))
    : 0;
  const foregroundPatternGroupBase = playerPatternGroups + 1;
  if (foregroundCount > 0 && foregroundPatternGroupBase + foregroundCount > 64) {
    throw new Error(
      `SCREEN 5 bitmap-room foreground sprites need pattern groups ${foregroundPatternGroupBase}..${foregroundPatternGroupBase + foregroundCount - 1}, ` +
      `but the V9938 sprite pattern table only holds 64 groups (player uses ${playerPatternGroups}, +1 bullet reserve). Reduce player animation frames/layers or foreground tiles.`,
    );
  }
  const playerSatBase = 0xF600 + foregroundCount * 4;
  const playerColorBase = 0xF400 + foregroundCount * 16;
  const foregroundData = buildBitmapRoomForegroundTables(rooms, foregroundCount);
  const foregroundContext = foregroundCount > 0 ? {
    count: foregroundCount,
    patternGroupBase: foregroundPatternGroupBase,
    satBase: playerSatBase,
    colorBase: playerColorBase,
    loadCallAsm: '    call bitmap_load_foreground_sprites\n' as string,
  } : null;
  const foregroundLoadCallAsm = foregroundContext ? foregroundContext.loadCallAsm : '';
  const shootRuntimeOptions: BitmapShootRuntimeOptions = {
    playerLayerCount: spriteTables.layerCount,
    bulletPatternNumber,
    satBase: 0xF600,
    colorBase: playerColorBase,
    patternBase: 0xF800,
    gameYOffset: BITMAP_ROOM_GAME_Y_OFFSET,
    screenWidth: SCREEN_WIDTH,
    foregroundSlotCount: foregroundCount,
  };
  const shootBulletInitUpload = buildBitmapBulletInitUploadAsm(shootConfig, shootRuntimeOptions);
  const shootBulletSatCall = buildBitmapBulletSatCallAsm(shootConfig);
  const shootBulletDataTables = buildBitmapBulletDataTables(shootConfig, bulletSprite);
  const shootRuntime = buildBitmapShootRuntimeAsm(shootConfig, shootRuntimeOptions);
  // TELEPORT A-B skill: saves/restores position between two points. Pure RAM.
  const teleportConfig = getMsx2TeleportABConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const teleportRamBase = shootRamBase + bitmapShootRamBytes(shootConfig);
  const teleportEquates = buildBitmapTeleportABEquates(teleportConfig, teleportRamBase);
  const teleportInitClear = buildBitmapTeleportABInitClearAsm(teleportConfig);
  const teleportGate = buildBitmapTeleportABGateAsm(teleportConfig);
  const teleportRuntime = buildBitmapTeleportABRuntimeAsm(teleportConfig);
  // SLASH skill: melee attack in facing direction. RAM follows teleport.
  const slashConfig = getMsx2SlashConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const slashRamBase = teleportRamBase + (bitmapTeleportABEnabled(teleportConfig) ? MSX2_BITMAP_TELEPORT_AB_RAM_BYTES : 0);
  const slashEquates = buildBitmapSlashEquates(slashConfig, slashRamBase);
  const slashInitClear = buildBitmapSlashInitClearAsm(slashConfig);
  const slashGate = buildBitmapSlashGateAsm(slashConfig);
  const slashRuntime = buildBitmapSlashRuntimeAsm(slashConfig);
  // GRAB skill: wall cling with slow slide. RAM follows slash.
  const grabConfig = getMsx2GrabConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const grabRamBase = slashRamBase + (bitmapSlashEnabled(slashConfig) ? MSX2_BITMAP_SLASH_RAM_BYTES : 0);
  const grabEquates = buildBitmapGrabEquates(grabConfig, grabRamBase);
  const grabInitClear = buildBitmapGrabInitClearAsm(grabConfig);
  const grabGate = buildBitmapGrabGateAsm(grabConfig);
  const grabGravityHook = buildBitmapGrabGravityHookAsm(grabConfig);
  const grabRuntime = buildBitmapGrabRuntimeAsm(grabConfig);
  // HIGH JUMP skill: variable jump height. RAM follows grab.
  const highJumpConfig = getMsx2HighJumpConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const highJumpRamBase = grabRamBase + (bitmapGrabEnabled(grabConfig) ? MSX2_BITMAP_GRAB_RAM_BYTES : 0);
  const highJumpEquates = buildBitmapHighJumpEquates(highJumpConfig, highJumpRamBase);
  const highJumpInitClear = buildBitmapHighJumpInitClearAsm(highJumpConfig);
  const highJumpInputHook = buildBitmapHighJumpInputHookAsm(highJumpConfig);
  const highJumpGravityHook = buildBitmapHighJumpGravityHookAsm(highJumpConfig);
  const highJumpLandClear = buildBitmapHighJumpLandClearAsm(highJumpConfig);
  const highJumpRuntime = buildBitmapHighJumpRuntimeAsm(highJumpConfig);
  // WALL BREAK skill: break solid tiles ahead. RAM follows high_jump.
  const wallBreakConfig = getMsx2WallBreakConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const wallBreakRamBase = highJumpRamBase + (bitmapHighJumpEnabled(highJumpConfig) ? MSX2_BITMAP_HIGH_JUMP_RAM_BYTES : 0);
  const wallBreakEquates = buildBitmapWallBreakEquates(wallBreakConfig, wallBreakRamBase);
  const wallBreakInitClear = buildBitmapWallBreakInitClearAsm(wallBreakConfig);
  const wallBreakGate = buildBitmapWallBreakGateAsm(wallBreakConfig);
  const wallBreakRuntime = buildBitmapWallBreakRuntimeAsm(wallBreakConfig);
  // SPIN ATTACK skill: radial melee. RAM follows wall_break.
  const spinAttackConfig = getMsx2SpinAttackConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const spinAttackRamBase = wallBreakRamBase + (bitmapWallBreakEnabled(wallBreakConfig) ? MSX2_BITMAP_WALL_BREAK_RAM_BYTES : 0);
  const spinAttackEquates = buildBitmapSpinAttackEquates(spinAttackConfig, spinAttackRamBase);
  const spinAttackInitClear = buildBitmapSpinAttackInitClearAsm(spinAttackConfig);
  const spinAttackGate = buildBitmapSpinAttackGateAsm(spinAttackConfig);
  const spinAttackRuntime = buildBitmapSpinAttackRuntimeAsm(spinAttackConfig);
  // ICE SLIDE skill: grounded inertia on behavior-layer ice cells. RAM follows spin_attack.
  const iceSlideConfig = {
    ...getMsx2IceSlideConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room)),
    footProbeLeftOffset: Math.max(0, Math.min(31, playerHitbox.x)),
    footProbeRightOffset: Math.max(0, Math.min(31, playerHitbox.x + playerHitbox.w - 1)),
    footProbeYOffset: Math.max(1, Math.min(32, playerHitbox.y + playerHitbox.h)),
  };
  const iceSlideRamBase = spinAttackRamBase + (bitmapSpinAttackEnabled(spinAttackConfig) ? MSX2_BITMAP_SPIN_ATTACK_RAM_BYTES : 0);
  const iceSlideEquates = buildBitmapIceSlideEquates(iceSlideConfig, iceSlideRamBase);
  const iceSlideInitClear = buildBitmapIceSlideInitClearAsm(iceSlideConfig);
  const iceSlideHorizontalHook = buildBitmapIceSlideHorizontalHookAsm(iceSlideConfig);
  const iceSlideRuntime = buildBitmapIceSlideRuntimeAsm(iceSlideConfig);
  // CROUCH skill: hold DOWN while grounded to slow/freeze movement (optional
  // momentum slide on release). Shares the horizontal hook slot with ice_slide.
  // RAM follows ice_slide.
  const crouchConfig = getMsx2CrouchConfigFromPlayerEntity(resolveBitmapRoomPlayer(analysis, room));
  const crouchRamBase = iceSlideRamBase + (bitmapIceSlideEnabled(iceSlideConfig) ? MSX2_BITMAP_ICE_SLIDE_RAM_BYTES : 0);
  const crouchEquates = buildBitmapCrouchEquates(crouchConfig, crouchRamBase);
  const crouchInitClear = buildBitmapCrouchInitClearAsm(crouchConfig);
  const crouchHorizontalHook = buildBitmapCrouchHorizontalHookAsm(crouchConfig);
  const crouchRuntime = buildBitmapCrouchRuntimeAsm(crouchConfig, {
    crouching: stateAnimIds['crouching'],
    sliding: stateAnimIds['sliding'],
  });
  // Linked MSX2 HUD asset dynamic widgets: RAM follows crouch (the last skill in
  // the chain). Per widget: dirty-flag (1 byte, or 2 for wide 16-bit counters so a
  // high-byte-only change is detected) + value byte(s) for bindings without a real
  // existing RAM counter (score/bossEnergy/air/collectibles/custom; NOT a scoring
  // mechanic, just the widget's own persistent byte(s) — 2 bytes for wide counters).
  // Shared hud_dec3_buffer (3B) for narrow counters + hud_dec5_buffer (5B) for wide.
  // Guarded against overflowing into the reserved player-animation block at #C1F0.
  const linkedHudRamBase = crouchRamBase + (crouchConfig.enabled ? MSX2_BITMAP_CROUCH_RAM_BYTES : 0);
  const HUD_LINKED_RAM_CEILING = 0xC1F0;
  let hudLinkedRamCursor = linkedHudRamBase;
  const experienceElement = linkedHudDynamicSources
    .map(source => source.element)
    .find(element => element.binding === 'experience' && element.kind === 'bar');
  const anyExperienceHud = linkedHudDynamicSources.some(source =>
    source.element.binding === 'experience'
    || source.element.binding === 'level'
    || source.element.binding === 'skillPoints'
  );
  const linkedHudRamAllocations = linkedHudDynamicSources.map(source => {
    const dirtyFlagAddress = hudLinkedRamCursor;
    const wide = source.kind === 'counter' && linkedCounterSpec(source.element).wide;
    const dirtyBytes = wide ? 2 : 1;
    hudLinkedRamCursor += dirtyBytes;
    const needsOwnValue = !(
      source.element.binding === 'playerEnergy'
      || source.element.binding === 'lives'
      || source.element.binding === 'air'
      || source.element.binding === 'experience'
      || source.element.binding === 'level'
      || source.element.binding === 'skillPoints'
    );
    const valueBytes = needsOwnValue ? (wide ? 2 : 1) : 0;
    const valueAddress = valueBytes > 0 ? hudLinkedRamCursor : undefined;
    hudLinkedRamCursor += valueBytes;
    return { dirtyFlagAddress, valueAddress, wide };
  });
  const anyNarrowCounter = linkedHudDynamicSources.some(source => source.kind === 'counter' && !linkedCounterSpec(source.element).wide);
  const anyWideCounter = linkedHudDynamicSources.some(source => source.kind === 'counter' && linkedCounterSpec(source.element).wide);
  const hudDec3BufferAddress = anyNarrowCounter ? hudLinkedRamCursor : undefined;
  if (hudDec3BufferAddress !== undefined) hudLinkedRamCursor += 3;
  const hudDec5BufferAddress = anyWideCounter ? hudLinkedRamCursor : undefined;
  if (hudDec5BufferAddress !== undefined) hudLinkedRamCursor += 5;
  // Air/time countdown timer (G3): allocated whenever an 'air'-bound HUD counter
  // exists. 'air' counters read the shared air_timer byte (like playerEnergy reads
  // player_health), so air_timer + air_frame_divider are always allocated+seeded
  // when an air counter is present (giving it a valid symbol); the decrement
  // routine is only emitted when initialAir>0 and the timer is not disabled.
  const anyAirCounter = linkedHudDynamicSources.some(source => source.kind === 'counter' && source.element.binding === 'air');
  const airInitial = clampByte(room.runtime?.initialAir ?? 0, 0);
  const airDisabled = !!room.runtime?.disableAirTimer;
  const airTimerAllocated = anyAirCounter;
  const airTimerAddress = airTimerAllocated ? hudLinkedRamCursor : undefined;
  if (airTimerAllocated) hudLinkedRamCursor += 1;
  const airFrameDividerAddress = airTimerAllocated ? hudLinkedRamCursor : undefined;
  if (airTimerAllocated) hudLinkedRamCursor += 1;
  const airTimerSystem = airTimerAllocated
    ? buildBitmapAirTimerAsm({
        airTimerAddress: airTimerAddress!,
        airFrameDividerAddress: airFrameDividerAddress!,
        initialAir: airInitial,
        framesPerTick: 60,
        ticking: airInitial > 0 && !airDisabled,
      })
    : null;
  const experienceAddress = anyExperienceHud ? hudLinkedRamCursor : undefined;
  if (anyExperienceHud) hudLinkedRamCursor += 1;
  const experienceMaxAddress = anyExperienceHud ? hudLinkedRamCursor : undefined;
  if (anyExperienceHud) hudLinkedRamCursor += 1;
  const levelAddress = anyExperienceHud ? hudLinkedRamCursor : undefined;
  if (anyExperienceHud) hudLinkedRamCursor += 1;
  const skillPointsAddress = anyExperienceHud ? hudLinkedRamCursor : undefined;
  if (anyExperienceHud) hudLinkedRamCursor += 1;
  const experienceSystem = anyExperienceHud
    ? buildBitmapExperienceSystemAsm({
        xpAddress: experienceAddress!,
        xpMaxAddress: experienceMaxAddress!,
        levelAddress: levelAddress!,
        skillPointsAddress: skillPointsAddress!,
        initialXp: clampByte(experienceElement?.initialValue, 0),
        xpMax: Math.max(1, clampByte(experienceElement?.maxValue, 100)),
        maxHealth: playerVitals.maxHealth,
        reward: experienceElement?.xpReward,
      })
    : null;
  const keyDoorSystem = buildBitmapKeyDoorSystemAsm(rooms, playerHitbox, hudLinkedRamCursor, isKonamiMegaRom);
  hudLinkedRamCursor += keyDoorSystem.ramBytes;
  const dialogueSystem = buildBitmapDialogueSystemAsm(
    dialogueData,
    rooms,
    playerHitbox,
    hudLinkedRamCursor,
    dialogueVramBaseRow,
    buildRleUploadAsm(dialogueRleChunks, isKonamiMegaRom),
    keyDoorSystem.initialDrawCall,
    isKonamiMegaRom
  );
  hudLinkedRamCursor += dialogueSystem.ramBytes;
  if ((linkedHudDynamicSources.length || keyDoorSystem.enabled || dialogueSystem.enabled) && hudLinkedRamCursor > HUD_LINKED_RAM_CEILING) {
    throw new Error(`MSX2 SCREEN 5 bitmap room "${room.name}" needs too much RAM for dynamic HUD/key-door/dialogue systems: chain (${hexWord(hudLinkedRamCursor)}) would overflow the reserved player-animation block at ${hexWord(HUD_LINKED_RAM_CEILING)}. Reduce dynamic HUD widgets, disable air timer, or reduce key pickups/locked doors.`);
  }
  const tileDataBySourceIndex = new Map(linkedHudTileData.map(entry => [entry.index, entry]));
  const linkedHudElementAsms = linkedHudDynamicSources.map((source, index) => {
    const ram = linkedHudRamAllocations[index];
    const bindingRamLabel = resolveHudElementBindingRamLabel(source.element, index);
    if (source.kind === 'bar') {
      return buildBitmapHudLinkedBarAsm(source, ram, bindingRamLabel, index, playerVitals);
    }
    const tileData = tileDataBySourceIndex.get(index)!;
    return source.kind === 'iconRow'
      ? buildBitmapHudLinkedIconRowAsm(source, tileData.tileVramY, ram, bindingRamLabel, tileData.uploadAsm, index, playerVitals)
      : buildBitmapHudLinkedCounterAsm(source, tileData.tileVramY, ram, bindingRamLabel, tileData.uploadAsm, index);
  });
  const linkedHudSharedEquates = linkedHudDynamicSources.length
    ? `; Linked MSX2 HUD asset dynamic widgets: shared 15-byte V9938 command scratch${hudDec3BufferAddress !== undefined || hudDec5BufferAddress !== undefined ? ' + shared decimal conversion buffer(s)' : ''}.
hud_cmd_block EQU #C2C0
${hudDec3BufferAddress !== undefined ? `hud_dec3_buffer EQU ${hexWord(hudDec3BufferAddress)}\n` : ''}${hudDec5BufferAddress !== undefined ? `hud_dec5_buffer EQU ${hexWord(hudDec5BufferAddress)}\n` : ''}`
    : '';
  const linkedHudSharedRoutines = linkedHudDynamicSources.length
    ? `${HUD_LINKED_LAUNCH_CMD_ROUTINE_ASM}${hudDec3BufferAddress !== undefined ? HUD_BYTE_TO_DEC3_ROUTINE_ASM : ''}${hudDec5BufferAddress !== undefined ? HUD_WORD_TO_DEC5_ROUTINE_ASM : ''}`
    : '';
  const linkedHudEquates = `${linkedHudSharedEquates}${linkedHudElementAsms.map(asm => asm.equates).join('')}${airTimerSystem?.equates || ''}${experienceSystem?.equates || ''}${keyDoorSystem.equates}${dialogueSystem.equates}`;
  const linkedHudInitAsm = `${linkedHudElementAsms.map(asm => asm.initAsm).join('')}${airTimerSystem?.initAsm || ''}${experienceSystem?.initAsm || ''}${keyDoorSystem.initAsm}${dialogueSystem.initAsm}`;
  const linkedHudMainLoopCall = `${linkedHudElementAsms.map(asm => asm.mainLoopCall).join('')}${airTimerSystem?.mainLoopCall || ''}${keyDoorSystem.mainLoopCall}`;
  const linkedHudRoutinesAsm = `${linkedHudSharedRoutines}${linkedHudElementAsms.map(asm => asm.routinesAsm).join('')}${airTimerSystem?.routinesAsm || ''}${experienceSystem?.routinesAsm || ''}${keyDoorSystem.routinesAsm}`;
  const hudSeparatorRestore = buildBitmapHudSeparatorRestoreAsm(useClassicHeartsHud || linkedHudDynamicSources.length > 0);
  // DOUBLE JUMP skill: extends the inline jump block (see buildBitmapJumpBlockAsm,
  // wired in update_player_movement) from the same Player Config physics.
  const doubleJumpEquates = buildBitmapDoubleJumpEquates(playerPhysics);
  const doubleJumpInitClear = buildBitmapDoubleJumpInitClearAsm(playerPhysics);
  // COYOTE TIME / JUMP BUFFER: extend the same inline jump block with a
  // post-ledge jump window and a pre-land press buffer (skillParameters.jump).
  // RAM is fixed at #C00E/#C00F (free gap), independent of the skill chain.
  const coyoteBufferEquates = buildBitmapCoyoteBufferEquates(playerPhysics);
  const coyoteBufferInitClear = buildBitmapCoyoteBufferInitClearAsm(playerPhysics);
  const coyoteBufferLandHook = buildBitmapCoyoteBufferLandHookAsm(playerPhysics);
  const coyoteBufferLeaveGroundHook = buildBitmapCoyoteBufferLeaveGroundHookAsm(playerPhysics);
  // WALL CLIMB skill (SCREEN 5-only): climb solid walls while holding UP + a
  // horizontal key into the wall. Gravity hook overrides player_vy upward; no RAM.
  const wallClimbConfig = resolveBitmapWallClimbConfig(resolveBitmapRoomPlayer(analysis, room));
  const wallClimbGravityHook = buildBitmapWallClimbGravityHookAsm(wallClimbConfig);
  const wallClimbRuntime = buildBitmapWallClimbRuntimeAsm(wallClimbConfig);
  const inputHooks = `${wallJumpInputHook}${powerStompInputHook}${highJumpInputHook}`;
  const gravityHooks = `${glideGravityHook}${wallJumpGravityHook}${powerStompGravityHook}${wallClimbGravityHook}${grabGravityHook}${highJumpGravityHook}`;
  // coyote/buffer land hook runs LAST so wall_jump/power_stomp/high_jump clears
  // settle first; a buffered-jump fire then clears grounded and arms player_vy.
  const landClearHooks = `${wallJumpLandClear}${powerStompLandClear}${highJumpLandClear}${coyoteBufferLandHook}`;
  const leaveGroundHooks = `${coyoteBufferLeaveGroundHook}`;
  const runtimeAsm = buildRuntimeAsm(room, tilesetRleChunks, allHudSeedRleChunks, {
    frameCount: spriteTables.frameCount,
    delayFrames: spriteTables.delayFrames,
    mirror: spriteTables.mirror,
    authoredFacing: spriteTables.authoredFacing,
    layerCount: spriteTables.layerCount,
    spriteOffsets: spriteTables.spriteOffsets,
    totalFrameCount: combinedFrameCount,
    hasStateAnimations,
  }, { bankedRle: isKonamiMegaRom }, playerPhysics, playerHitbox, {
    inputGateAsm: inputHooks,
    horizontalHookAsm: `${iceSlideHorizontalHook}${crouchHorizontalHook}`,
    gravityHookAsm: gravityHooks,
    landClearAsm: landClearHooks,
    leaveGroundAsm: leaveGroundHooks,
  }, foregroundContext, true /* enableBlink: bitmap backend always renders i-frame flicker */, keyDoorSystem.enabled, keyDoorSystem.pendingPageDrawCall);
  // Foreground sprite load routine + its per-room dispatch/data tables (only when
  // some room actually defines foreground tiles).
  const foregroundLoadRoutineAsm = foregroundContext ? buildBitmapLoadForegroundSpritesAsm(foregroundContext) : '';
  const foregroundDataAsm = foregroundContext
    ? formatBytes('bitmap_room_foreground_patterns', foregroundData.patternBytes, `Foreground tile opacity masks (1 bit/px, ${foregroundContext.count} slot(s) max): ${foregroundData.patternBytes.length / 32} tile(s) total`)
      + formatBytes('bitmap_room_foreground_colors', foregroundData.colorBytes, `Foreground tile colour tables (16 bytes/slot, single colour repeated)`)
      + roomTables.map(table => formatBytes(`bitmap_room_foreground_table_${table.index}`, foregroundData.roomTables[table.index], `Room ${table.index} foreground dispatch: ${foregroundContext.count} slot(s) x 3 bytes (satY, satX, pattern-offset/#FF)`)).join('')
      + `bitmap_room_foreground_ptr_table:\n${roomTables.map(t => `    DW bitmap_room_foreground_table_${t.index}`).join('\n')}\n`
    : '';
  // Per-room render-program + collision data and the dispatch tables for load_room.
  const roomDataAsm = isKonamiMegaRom
    ? `; Per-room render programs, collision maps and behavior maps are emitted in Konami MegaROM data banks below.\n`
    : roomTables.map(table =>
      `${formatBytes(table.renderLabelPage0, table.renderBytesPage0, `Room ${table.index} page 0 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`)}` +
      `${formatBytes(table.renderLabelPage1, table.renderBytesPage1, `Room ${table.index} page 1 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`)}` +
      `${formatBytes(table.collisionLabel, table.collisionBytes, `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} collision grid (16x16 px cells), row-major, 0=empty`)}` +
      `${formatBytes(table.behaviorLabel, table.behaviorBytes, `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default`)}`
    ).join('\n');
  const roomRenderPtrTableAsm = `bitmap_room_render_ptr_table_p0:\n${roomTables.map(t => `    DW ${t.renderLabelPage0}`).join('\n')}\nbitmap_room_render_ptr_table_p1:\n${roomTables.map(t => `    DW ${t.renderLabelPage1}`).join('\n')}\n`;
  const roomRenderBankTableAsm = isKonamiMegaRom
    ? `${formatDbExpressions('bitmap_room_render_bank_table_p0', roomTables.map(t => `${t.renderLabelPage0}_DATA_BANK`), 'Konami data bank for each page 0 room render program')}${formatDbExpressions('bitmap_room_render_bank_table_p1', roomTables.map(t => `${t.renderLabelPage1}_DATA_BANK`), 'Konami data bank for each page 1 room render program')}`
    : '';
  const roomBlockCountTableAsm = `bitmap_room_blockcount_table:\n${roomTables.map(t => `    DW ${t.blockCount}`).join('\n')}\n`;
  const roomCollisionPtrTableAsm = `bitmap_room_collision_ptr_table:\n${roomTables.map(t => `    DW ${t.collisionLabel}`).join('\n')}\n`;
  const roomCollisionBankTableAsm = isKonamiMegaRom
    ? formatDbExpressions('bitmap_room_collision_bank_table', roomTables.map(t => `${t.collisionLabel}_DATA_BANK`), 'Konami data bank for each room collision grid')
    : '';
  const roomBehaviorPtrTableAsm = `bitmap_room_behavior_ptr_table:\n${roomTables.map(t => `    DW ${t.behaviorLabel}`).join('\n')}\n`;
  const roomBehaviorBankTableAsm = isKonamiMegaRom
    ? formatDbExpressions('bitmap_room_behavior_bank_table', roomTables.map(t => `${t.behaviorLabel}_DATA_BANK`), 'Konami data bank for each room behavior grid')
    : '';
  const roomTransitionTableAsm = formatBytes('bitmap_room_transition_table', transitionTableBytes, 'Edge rails per room: west,east,north,south (#FF = none)');
  // Per-room player spawn coordinates (1 byte each). Indexed by current_screen_index
  // by bitmap_check_deadly_contact to respawn the player at the correct room's entry.
  const roomSpawnBytes = rooms.map(roomData => {
    const sp = resolvePlayerSpawnPixels(roomData);
    return { x: clampByte(sp.x, 0) & 0xff, y: clampByte(sp.y, 0) & 0xff };
  });
  const roomSpawnTableAsm =
    `bitmap_room_spawn_x_table:\n    DB ${roomSpawnBytes.map(b => `${b.x}`).join(',')}\n` +
    `bitmap_room_spawn_y_table:\n    DB ${roomSpawnBytes.map(b => `${b.y}`).join(',')}\n`;
  const playerAnimationUpdateCall = (combinedFrameCount > 1 || spriteTables.mirror || hasStateAnimations)
    ? '    call bitmap_update_player_sprite_animation\n'
    : '';
  // Re-upload the player's sprite colour table on animation frame changes so
  // OR/CC multi-colour frames render correctly (fast, on-change only).
  const playerColorsUpdateCall = (combinedFrameCount > 1 || hasStateAnimations)
    ? '    call bitmap_upload_player_frame_colors\n'
    : '';
  // GameFlow intro ASM (empty strings when the flow has no presentation scenes,
  // keeping the ROM byte-identical to legacy exports).
  const intro = buildBitmapIntroAsm(introSceneBlobs, isKonamiMegaRom);
  const visibleHeight = SCREEN5_VISIBLE_HEIGHT;
  const hudWidgetCount = hudGloballyHidden
    ? 0
    : linkedHudAsset
      ? linkedHudAsset.layers.filter(layer => layer.kind === 'widget').length
      : room.runtime?.hudWidgets?.length || 0;

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)
; Project: ${projectName}
; Room: ${room.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen4-bitmap-room
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
; Auto MegaROM: ${config.autoMegaROM ? 'Yes' : 'No'}
; NOTE: ${isKonamiMegaRom ? 'Bitmap-room SCREEN 5 RLE sources are read through Konami P2/#8000 data banks.' : 'Bitmap-room SCREEN 5 uses a linear simple32k ROM layout.'}
; Visible page: VRAM #0000, ${ROW_BYTES} bytes/row, ${visibleHeight} lines
; Bitmap room HUD height: ${BITMAP_ROOM_HUD_HEIGHT} px
; Bitmap room HUD widgets: ${hudWidgetCount}
; Bitmap room game area: ${SCREEN_WIDTH}x${SCREEN_HEIGHT_DEFAULT} at visual Y=${BITMAP_ROOM_GAME_Y_OFFSET}
; Bitmap room game band VRAM base: ${hexWord(BITMAP_ROOM_GAME_VRAM_BASE)}
; World rooms: ${rooms.length}; start room index: ${startIndex}
; Shared tileset bytes: ${tilesetBytes.length} at VRAM ${hexVram(atlasVramBase)}
; MSX2_GAMEFLOW_INTRO_SCENES: ${introScenes.length}
; ==================================================================

CHGMOD  EQU #005F
ENASLT  EQU #0024
GTSTCK  EQU #00DC
RSLREG  EQU #0138
SNSMAT  EQU #0141
PPI_A EQU #A8
PPI_B EQU #A9
PPI_C EQU #AA
VDP_CTRL_PORT EQU ${VDP_CTRL_PORT}
VDP_DATA_PORT EQU ${VDP_DATA_PORT}
VDP_CMD_PORT EQU ${VDP_CMD_PORT}
VDP_PALETTE_PORT EQU ${VDP_PALETTE_PORT}
${bankedDataEquates}

; Player SAT image in RAM (kept contiguous so the 4 bytes copy straight to the
; sprite 0 SAT slot at VRAM #F600): Y, X, pattern number, early-clock byte.
player_y   EQU #C000
player_x   EQU #C001
player_pat EQU #C002
player_ec  EQU #C003
player_anim_counter EQU #C004
player_anim_frame   EQU #C005
player_vy           EQU #C006
player_flags        EQU #C007
player_facing       EQU #C008
player_jump_lock    EQU #C009
player_moving       EQU #C00A
; World engine runtime state.
current_screen_index EQU #C00B
${(spriteTables.frameCount > 1 || hasStateAnimations) ? `; Frame whose player sprite colours are currently in VRAM (#F400). Drives the
; on-change per-frame OR/CC colour re-upload (bitmap_upload_player_frame_colors).
player_colors_loaded EQU #C00C
` : ''}${hasStateAnimations ? `; Per-state animation runtime (separate sprite per animation state). Fixed block
; above the skill RAM chain and below the behavior map (#C200). player_anim_state
; is reset to 0 each frame in update_player_movement and asserted by skills.
player_anim_state      EQU #C1F0
player_anim_state_prev EQU #C1F1
player_anim_clip_base  EQU #C1F2
player_anim_clip_count EQU #C1F3
player_anim_clip_delay EQU #C1F4
player_anim_abs_frame  EQU #C1F5
` : ''}${doubleJumpEquates}${coyoteBufferEquates}; Active room collision map copied here by load_room (16x12 = 192 bytes).
bitmap_room_collision_map EQU #C010
; Double-buffer room-transition state. Collision map ends at #C0CF.
bitmap_displayed_page             EQU #C0D0
bitmap_composition_state          EQU #C0D1
bitmap_pending_room               EQU #C0D2
bitmap_transition_dir             EQU #C0D3
bitmap_composition_block_ptr      EQU #C0D4
bitmap_composition_blocks_left    EQU #C0D6
bitmap_pending_display_page       EQU #C0D8
bitmap_composition_block_bank     EQU #C1F6
; Sub-pixel gravity accumulator (low byte of the 8.8 gravityStrength from the Player
; Config). Added to player_vy_frac every frame; player_vy only rises by 1 when this
; carries, so the fall/jump arc accelerates gradually like SCREEN 4 (default 0.25
; px/frame^2) instead of the old fixed 1 px/frame^2 nudge.
player_vy_frac                    EQU #C0D9
${dashEquates}
${airDashEquates}
${glideEquates}
${wallJumpEquates}
${powerStompEquates}
${shootEquates}
${teleportEquates}
${slashEquates}
${grabEquates}
${highJumpEquates}
${wallBreakEquates}
${spinAttackEquates}
${iceSlideEquates}
${crouchEquates}
; Active room behavior map copied here by load_room (16x12 = 192 bytes).
; Used by surface skills such as ice_slide. Kept away from the compact player
; state/skill chain so future optional skills do not overlap it.
bitmap_room_behavior_map EQU #C200
${deadlySystem.equates}${heartsHud.equates}${linkedHudEquates}    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    ${isKonamiMegaRom ? 'call map_page2_to_cart_primary\n    call init_konami8k_fixed_bank0_banks' : 'call init_plain32k_page2_slot'}
    call init_screen5_bitmap_vdp
${intro.initCallAsm}    call load_screen5_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
${dialogueSystem.uploadCallAsm}${shootBulletInitUpload}    ; Render the start room from the shared tileset already in VRAM.
    ld a, ${startIndex}
    call load_room
${keyDoorSystem.initialDrawCall}
${foregroundLoadCallAsm}    ; Place the player at the room spawn point.
    ld a, ${spawn.y}
    ld (player_y), a
    ld a, ${spawn.x}
    ld (player_x), a
    xor a
    ld (player_pat), a
    ld (player_ec), a
    ld (player_anim_counter), a
    ld (player_anim_frame), a
    ld (player_vy), a
    ld (player_vy_frac), a
    ld (player_flags), a
    ld (player_jump_lock), a
    ld (player_moving), a
    ld (bitmap_displayed_page), a
    ld (bitmap_composition_state), a
    ld (bitmap_pending_room), a
    ld (bitmap_transition_dir), a
    ld (bitmap_composition_blocks_left), a
    ld (bitmap_composition_blocks_left + 1), a
    ld (bitmap_pending_display_page), a
    ld hl, 0
    ld (bitmap_composition_block_ptr), hl
    inc a
    ld (player_facing), a
${deadlySystem.initAsm}${heartsHud.initAsm}${linkedHudInitAsm}    ; Select status register 0 so vblank polling reads S#0 (the VDP command
    ; engine left R#15 pointing at S#2). This runtime drives its own 60 Hz sync
    ; by polling the frame flag, so interrupts stay disabled and the BIOS cannot
    ; consume S#0 before the main loop sees it.
    ld a, #0F
    ld e, #00
    call vdp_write_register
${hasStateAnimations ? `    xor a
    ld (player_anim_state), a
    ld (player_anim_abs_frame), a
    dec a
    ld (player_anim_state_prev), a    ; #FF forces a clean clip reset on frame 1
` : ''}${dashInitClear}${doubleJumpInitClear}${coyoteBufferInitClear}${airDashInitClear}${glideInitClear}${wallJumpInitClear}${powerStompInitClear}${shootInitClear}${teleportInitClear}${slashInitClear}${grabInitClear}${highJumpInitClear}${wallBreakInitClear}${spinAttackInitClear}${iceSlideInitClear}${crouchInitClear}.main_loop:
    call bitmap_wait_vblank
    call step_room_composition
    jp c, .skip_player_movement
${dialogueSystem.mainLoopGateAsm}${airDashGate}    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
${dashGate}${shootGate}${teleportGate}${slashGate}${grabGate}${wallBreakGate}${spinAttackGate}.skip_player_movement:
${playerAnimationUpdateCall}${playerColorsUpdateCall}${powerStompMainLoopCall}${deadlySystem.mainLoopCall}${heartsHud.mainLoopCall}${linkedHudMainLoopCall}${hudSeparatorRestore.mainLoopCall}    call bitmap_update_sprite_sat
${shootBulletSatCall}    jp .main_loop
${intro.routinesAsm}
${runtimeAsm}
${dashRuntime}
${airDashRuntime}
${glideRuntime}
${wallJumpRuntime}
${powerStompRuntime}
${shootRuntime}
${wallClimbRuntime}
${teleportRuntime}
${slashRuntime}
${grabRuntime}
${highJumpRuntime}
${wallBreakRuntime}
${spinAttackRuntime}
${iceSlideRuntime}
${crouchRuntime}
${deadlySystem.routineAsm}
${heartsHud.routinesAsm}
${linkedHudRoutinesAsm}
${dialogueSystem.routinesAsm}
${hudSeparatorRestore.routinesAsm}
${foregroundLoadRoutineAsm}
${formatBytes('screen5_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${intro.dataAsm}bitmap_room_hud_seed_data:
${hudSeedDataAsm}
bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
${tilesetDataAsm}
bitmap_room_tileset_data_end:

bitmap_room_hud_heart_data:
${heartDataAsm}
bitmap_room_hud_heart_data_end:

bitmap_room_hud_linked_data:
${linkedHudDataAsm}
bitmap_room_hud_linked_data_end:

; World engine dispatch tables (indexed by room/screen index).
${roomRenderPtrTableAsm}
${roomRenderBankTableAsm}
${roomBlockCountTableAsm}
${roomCollisionPtrTableAsm}
${roomCollisionBankTableAsm}
${roomBehaviorPtrTableAsm}
${roomBehaviorBankTableAsm}
${roomTransitionTableAsm}
${roomSpawnTableAsm}
${keyDoorSystem.dataAsm}
${dialogueSystem.dataAsm}${dialogueGfxDataAsm}
; Per-room render programs, collision maps and behavior maps.
${roomDataAsm}
${foregroundDataAsm}
${formatBytes('bitmap_room_sprite_colors', combinedColors, `Sprite 0 line color table (mode 2): ${spriteSourceLabel}${hasStateAnimations ? ` + ${stateAnimations.length} state clip(s)` : ''}`)}
bitmap_room_sprite_colors_end:

${formatBytes('bitmap_room_sprite_attrs', spriteTables.attrs, 'SAT: sprite 0 active (Y/X set at runtime), sprite 1 Y=#D8 stops processing')}
bitmap_room_sprite_attrs_end:

${formatBytes('bitmap_room_sprite_patterns', combinedPatterns, `Sprite 0 pattern (16x16, mode 2 quadrants): ${spriteSourceLabel}${hasStateAnimations ? ` + ${stateAnimations.length} state clip(s)` : ''}`)}
bitmap_room_sprite_patterns_end:
${hasStateAnimations ? `
; Player animation clip table: id 0 = base idle/walk, ids 1..${stateAnimations.length} = state
; clips. 3 bytes/entry: frameBase, frameCount, delayFrames. Indexed by player_anim_state.
${formatBytes('bitmap_player_anim_clip_table', animClipTableBytes, stateAnimations.map(b => `${b.animId}=${b.state}(base ${b.frameBase},${b.frameCount}f)`).join(', '))}` : ''}

${shootBulletDataTables}    ds #C000 - $, #FF
${bankedDataAsm}
    end
`;
}

export function generateMsx2Screen5BitmapRoomFiles(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2BitmapRoomConfig
): GeneratedASMFiles {
  const unitedFiles = generateUnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 4 bitmap-room backend: page0 not used.\n',
    'bios.asm': '; BIOS equates emitted in unitedFiles.asm.\n',
    'constants.asm': '; Constants emitted in unitedFiles.asm.\n',
    'variables.asm': '; Runtime RAM variables reserved for future bitmap-room gameplay.\n',
    'mapper.asm': '; Mapper support reserved for multi-room bitmap projects.\n',
    'resource_ids.asm': '; Resource IDs not used by bitmap-room MVP.\n',
    'resource_table.asm': '; Resource table not used by bitmap-room MVP.\n',
    'resource_manager.asm': '; Resource manager not used by bitmap-room MVP.\n',
    'interrupt.asm': '; Interrupt runtime not used by bitmap-room MVP.\n',
    'header.asm': '; Header emitted in unitedFiles.asm.\n',
    'patterns.asm': '; Bitmap rooms do not use PGT tile tables.\n',
    'colors.asm': '; Bitmap rooms do not use CGT tile tables.\n',
    'sprites.asm': '; Sprite tables are emitted in unitedFiles.asm.\n',
    'worlds.asm': '; Worlds are not emitted by bitmap-room MVP yet.\n',
    'screens.asm': '; Bitmap room atlas/commands are emitted in unitedFiles.asm.\n',
    'components.asm': '; Components are not emitted by bitmap-room MVP yet.\n',
    'entities.asm': '; Entities are not emitted by bitmap-room MVP yet.\n',
    'sound.asm': '; Sound is not emitted by bitmap-room MVP yet.\n',
    'scroll.asm': '; Scroll is not emitted by bitmap-room MVP yet.\n',
    'animtiles.asm': '; Animated tiles are not emitted by bitmap-room MVP yet.\n',
    'bosses.asm': '; Bosses are not emitted by bitmap-room MVP yet.\n',
    'gameflow.asm': '; GameFlow is not emitted by bitmap-room MVP yet.\n',
    'menus.asm': '; Menus are not emitted by bitmap-room MVP yet.\n',
    'statemachine.asm': '; State machines are not emitted by bitmap-room MVP yet.\n',
    'font.asm': '; Bitmap HUD font is not emitted by bitmap-room MVP yet.\n',
    'hud.asm': '; Bitmap HUD widgets are composed through V9938 commands.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
