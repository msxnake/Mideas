import { ConnectionDirection, Msx2BitmapRoomCommand, Msx2HudFontAsset, Msx2HudWidget, Msx2PlayerDefinition, Msx2Screen5BitmapRoom, Msx2Sprite, PaletteAsset, Screen5PaletteSlot } from '../../../../types';
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
    Math.min(BITMAP_ROOM_ATLAS_MAX_HEIGHT, Math.max(...rooms.map(room => clampInt(room.atlas?.height, TILE_GRID_SIZE, BITMAP_ROOM_ATLAS_MAX_HEIGHT, TILE_GRID_SIZE)), requiredHeight)),
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

function getBitmapHudFontAsset(analysis: ProjectAnalysis, room: Msx2Screen5BitmapRoom): Msx2HudFontAsset | undefined {
  const assets = ((analysis as any).assets || []) as Array<{ id?: string; type?: string; data?: unknown }>;
  const preferredId = room.runtime?.hudFontAssetId;
  const preferred = preferredId
    ? assets.find(asset => asset.type === 'msx2hudfont' && asset.id === preferredId)?.data as Msx2HudFontAsset | undefined
    : undefined;
  return preferred || assets.find(asset => asset.type === 'msx2hudfont')?.data as Msx2HudFontAsset | undefined;
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

function buildBitmapHudSeedPixels(room: Msx2Screen5BitmapRoom, atlasPixels: number[][], analysis: ProjectAnalysis): number[][] {
  const framebuffer = Array.from({ length: BITMAP_ROOM_HUD_HEIGHT }, () => Array.from({ length: SCREEN_WIDTH }, () => 1));
  for (let y = 0; y < BITMAP_ROOM_HUD_HEIGHT - 1; y++) {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      framebuffer[y][x] = 1;
    }
  }
  for (let x = 0; x < SCREEN_WIDTH; x++) {
    framebuffer[BITMAP_ROOM_HUD_HEIGHT - 1][x] = 15;
  }
  const widgets = room.runtime?.showHud === false || room.runtime?.hideHud === true ? [] : room.runtime?.hudWidgets || [];
  const font = getBitmapHudFontAsset(analysis, room);
  const allowedCharacters = font?.characters || DEFAULT_HUD_CHARS;
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

function formatDataBankEquates(chunks: RleChunk[]): string {
  const lines: string[] = [];
  for (const chunk of chunks) {
    if (chunk.dataBank !== undefined) {
      lines.push(`${chunk.label}_DATA_BANK EQU ${chunk.dataBank}`);
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
    lines.push(`    ds #A000 - $, #FF`);
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
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room render blocks
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
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room collision source
    ld de, bitmap_room_collision_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                 ; HL = room behavior source
    ld de, bitmap_room_behavior_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ; The command-engine status polls above left R#15 pointing at S#2. Restore S#0
    ; selection so the main loop's bitmap_wait_vblank (which assumes R#15=0) syncs
    ; correctly; otherwise post-transition rooms run on the bounded-delay fallback
    ; every frame (severe lag).
    ld a, #0F
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
    jp .select_render_program
.compose_page1:
    ld a, 1
    ld (bitmap_pending_display_page), a
    ld hl, bitmap_room_render_ptr_table_p1
.select_render_program:
    ld a, (bitmap_pending_room)
    ld e, a
    ld d, 0
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (bitmap_composition_block_ptr), hl
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
    ld hl, (bitmap_composition_block_ptr)
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
    ld a, #0F
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
;   clears bitmap_composition_state, and resets vertical player velocity.
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
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_room_collision_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
    ld a, (current_screen_index)
    ld e, a
    ld d, 0
    ld hl, bitmap_room_behavior_ptr_table
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld de, bitmap_room_behavior_map
    ld bc, ${COLLISION_COLS * COLLISION_ROWS}
    ldir
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
.commit_enter_top:
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
.commit_flip_page:
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
    ; (every <=16px so a tall body cannot tunnel a cell). Clobbers AF/BC/DE/HL.
    ld b, a
    ld a, (player_x)
    bit 7, b
    jp z, .check_right_bounds
    cp 2
    ret c
    jp .x_bounds_ok
.check_right_bounds:
    cp 239
    ret nc
.x_bounds_ok:
    ld a, (player_x)
    add a, b                ; A = candidate X (sprite top-left)
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
    ; when empty. Index = (Y & #F0) + (X >> 4) into the 16x12 grid. Because a
    ; cell is 16 px, (Y >> 4) * 16 == (Y & #F0). Clobbers AF/DE/HL; keeps BC.
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
    ld a, (hl)
    or a
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
${playerAnimation.spriteOffsets.map((offset, slotIndex) => `    ld a, (player_y)
    add a, ${BITMAP_ROOM_GAME_Y_OFFSET}${offset.y ? `\n    add a, ${offset.y}                   ; cell row +${offset.y}px` : ''}
    out (${VDP_DATA_PORT}), a
    ld a, (player_x)${offset.x ? `\n    add a, ${offset.x}                   ; cell col +${offset.x}px` : ''}
    out (${VDP_DATA_PORT}), a
    ld a, (player_pat)
${slotIndex ? `    add a, ${slotIndex * 4}\n` : ''}    out (${VDP_DATA_PORT}), a
    ld a, (player_ec)
    out (${VDP_DATA_PORT}), a
`).join('')}    ld a, #D8
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
  const spawn = resolvePlayerSpawnPixels(room);
  const worldPalette = resolveWorldPalette(analysis, world.paletteAssetId, room.palette);
  const paletteBytes = buildPaletteBytes(worldPalette);
  const atlasPixels = normalizeAtlasPixels(sharedAtlas.atlasRoom);
  const atlasVramBase = BITMAP_ROOM_ATLAS_BASE_Y * ROW_BYTES;
  const tilesetBytes = packAtlasPixels(sharedAtlas.atlasRoom);
  const tilesetRleChunks = buildRleChunksForVram(tilesetBytes, atlasVramBase, 'bitmap_room_tileset_rle_chunk');
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
  // Edge-transition table: 4 bytes per room (west, east, north, south); #FF = no rail.
  const transitionTableBytes = rooms.flatMap((_roomData, index) => {
    const rails = world.transitions.get(index) || {};
    const target = (dir: ConnectionDirection) => (rails[dir] === undefined ? 0xff : rails[dir]!);
    return [target('west'), target('east'), target('north'), target('south')];
  });
  const hudSeedBytes = packBitmapPixels(buildBitmapHudSeedPixels(room, atlasPixels, analysis));
  const hudSeedRleChunksPage0 = buildRleChunksForVram(hudSeedBytes, 0, 'bitmap_room_hud_seed_p0_rle_chunk');
  const hudSeedRleChunksPage1 = buildRleChunksForVram(hudSeedBytes, BITMAP_ROOM_PAGE1_VRAM_BASE, 'bitmap_room_hud_seed_p1_rle_chunk');
  const allHudSeedRleChunks = [...hudSeedRleChunksPage0, ...hudSeedRleChunksPage1];
  const allRleChunks = [...allHudSeedRleChunks, ...tilesetRleChunks];
  const bankedDataBlocks = isKonamiMegaRom
    ? [
      ...buildBankedRleDataBlocks(allHudSeedRleChunks, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed mirrored on page 0/1, packed 4bpp RLE`),
      ...buildBankedRleDataBlocks(tilesetRleChunks, `Shared world tileset (atlas), packed 4bpp RLE`),
    ]
    : [];
  const bankedDataBanks = isKonamiMegaRom ? packBitmapRoomDataBanks(bankedDataBlocks) : [];
  if (isKonamiMegaRom) assignDataBankConstants(bankedDataBanks, allRleChunks);
  const bankedDataEquates = isKonamiMegaRom ? formatDataBankEquates(allRleChunks) : '';
  const bankedDataAsm = isKonamiMegaRom ? formatBankedDataBanks(bankedDataBanks) : '';
  const hudSeedDataAsm = isKonamiMegaRom
    ? `; Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed for page 0/1 is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(allHudSeedRleChunks, hudSeedBytes.length * 2, `Persistent ${SCREEN_WIDTH}x${BITMAP_ROOM_HUD_HEIGHT} HUD seed mirrored on page 0/1, packed 4bpp RLE`);
  const tilesetDataAsm = isKonamiMegaRom
    ? `; Shared world tileset RLE is emitted in Konami MegaROM data banks below.\n`
    : formatRleChunks(tilesetRleChunks, tilesetBytes.length, `Shared world tileset (atlas), packed 4bpp RLE, destination VRAM ${hexVram(atlasVramBase)}`);
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
  const playerPhysics = resolveBitmapPlayerPhysics(resolveBitmapRoomPlayer(analysis, room));
  // Body collision box from the Player Config; defaults to the player sprite size so a
  // 16x32 sprite collides over its full height even without an explicit box.
  const playerHitbox = getBitmapPlayerBodyHitbox(resolveBitmapRoomPlayer(analysis, room), playerSprite?.size);
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
  }, foregroundContext);
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
  const roomDataAsm = roomTables.map(table =>
    `${formatBytes(table.renderLabelPage0, table.renderBytesPage0, `Room ${table.index} page 0 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`)}` +
    `${formatBytes(table.renderLabelPage1, table.renderBytesPage1, `Room ${table.index} page 1 render program: ${table.blockCount} V9938 command blocks (clear + 16x16 tile copies)`)}` +
    `${formatBytes(table.collisionLabel, table.collisionBytes, `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} collision grid (16x16 px cells), row-major, 0=empty`)}` +
    `${formatBytes(table.behaviorLabel, table.behaviorBytes, `Room ${table.index} ${COLLISION_COLS}x${COLLISION_ROWS} behavior grid (16x16 px cells), row-major, 0=empty, 3=ice_slide default`)}`
  ).join('\n');
  const roomRenderPtrTableAsm = `bitmap_room_render_ptr_table_p0:\n${roomTables.map(t => `    DW ${t.renderLabelPage0}`).join('\n')}\nbitmap_room_render_ptr_table_p1:\n${roomTables.map(t => `    DW ${t.renderLabelPage1}`).join('\n')}\n`;
  const roomBlockCountTableAsm = `bitmap_room_blockcount_table:\n${roomTables.map(t => `    DW ${t.blockCount}`).join('\n')}\n`;
  const roomCollisionPtrTableAsm = `bitmap_room_collision_ptr_table:\n${roomTables.map(t => `    DW ${t.collisionLabel}`).join('\n')}\n`;
  const roomBehaviorPtrTableAsm = `bitmap_room_behavior_ptr_table:\n${roomTables.map(t => `    DW ${t.behaviorLabel}`).join('\n')}\n`;
  const roomTransitionTableAsm = formatBytes('bitmap_room_transition_table', transitionTableBytes, 'Edge rails per room: west,east,north,south (#FF = none)');
  const playerAnimationUpdateCall = (combinedFrameCount > 1 || spriteTables.mirror || hasStateAnimations)
    ? '    call bitmap_update_player_sprite_animation\n'
    : '';
  // Re-upload the player's sprite colour table on animation frame changes so
  // OR/CC multi-colour frames render correctly (fast, on-change only).
  const playerColorsUpdateCall = (combinedFrameCount > 1 || hasStateAnimations)
    ? '    call bitmap_upload_player_frame_colors\n'
    : '';
  const visibleHeight = SCREEN5_VISIBLE_HEIGHT;
  const hudWidgetCount = room.runtime?.showHud === false || room.runtime?.hideHud === true ? 0 : room.runtime?.hudWidgets?.length || 0;

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
    org #4000

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
    call load_screen5_bitmap_palette
    call init_bitmap_hud_band
    call upload_tileset_atlas
    call init_hardware_sprite_tables
${shootBulletInitUpload}    ; Render the start room from the shared tileset already in VRAM.
    ld a, ${startIndex}
    call load_room
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
    ; Select status register 0 so vblank polling reads S#0 (the VDP command
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
${airDashGate}    ; Normal platform movement/gravity runs only when no transition/air_dash consumed this frame.
    call update_player_movement
${dashGate}${shootGate}${teleportGate}${slashGate}${grabGate}${wallBreakGate}${spinAttackGate}.skip_player_movement:
${playerAnimationUpdateCall}${playerColorsUpdateCall}${powerStompMainLoopCall}    call bitmap_update_sprite_sat
${shootBulletSatCall}    jp .main_loop

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
${foregroundLoadRoutineAsm}
${formatBytes('screen5_bitmap_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
bitmap_room_hud_seed_data:
${hudSeedDataAsm}
bitmap_room_hud_seed_data_end:

bitmap_room_tileset_data:
${tilesetDataAsm}
bitmap_room_tileset_data_end:

; World engine dispatch tables (indexed by room/screen index).
${roomRenderPtrTableAsm}
${roomBlockCountTableAsm}
${roomCollisionPtrTableAsm}
${roomBehaviorPtrTableAsm}
${roomTransitionTableAsm}
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
