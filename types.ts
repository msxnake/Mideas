
import React from 'react';
import { StateMachine } from './statemachine.types';
import { MideasGlobalVariable } from './constants';

/** A string representing a color in hex format (e.g., "#RRGGBB"). */
export type MSXColorValue = string;
/** A string representing a color from the MSX1 palette in hex format. */
export type MSX1ColorValue = string;

/**
 * Represents a single configurable color slot for MSX2 V9938 tiles.
 */
export interface Screen5PaletteSlot {
  /** Position in the 16-color palette (0-15). */
  slotIndex: number;
  /** Index of the MSX2 master palette entry (0-511). */
  masterIndex: number;
  /** Hex color stored for quick rendering. */
  hex: MSXColorValue;
}

/**
 * Functional zoning of the single shared SCREEN4/SCREEN5 16-color palette.
 *
 * In SCREEN 4 tiles and sprites share ONE hardware palette, so the user can
 * carve the 16 slots into functional zones with a single movable divider:
 *
 *  - Immutable slots (slot 0 transparent + black/white) are never reassigned.
 *  - Sprite zone: contiguous mutable slots reserved for sprites [spriteStart..divider-1].
 *  - Tile zone: contiguous mutable slots reserved for tiles [divider..tileEnd].
 *
 * `divider` is the first slot belonging to the tile zone; everything from
 * `spriteStart` up to (but not including) `divider` is the sprite zone. This is
 * the single boundary the user drags. Immutable slots are excluded from both
 * zones by `getSpriteZoneSlots` / `getTileZoneSlots`.
 */
export interface Msx2PaletteZones {
  /** First slot of the sprite zone (inclusive, usually 1 or 2). */
  spriteStart: number;
  /** Movable boundary: first slot of the tile zone (inclusive). */
  divider: number;
  /** Last slot of the tile zone (inclusive, usually 15). */
  tileEnd: number;
}

/**
 * Represents a color in the MSX2 V9938 palette.
 */
export interface MSXColor {
  /** The common name of the color. */
  name: string;
  /** The hex value of the color. */
  hex: MSXColorValue;
}

/**
 * Represents a color in the MSX1 (SCREEN 2) palette.
 */
export interface MSX1Color {
  /** The common name of the color. */
  name: string;
  /** The hex value of the color. */
  hex: MSX1ColorValue;
  /** The hardware index of the color (0-15). */
  index: number;
}

/** A 2D array representing the pixel data of a tile or sprite frame. */
export type PixelData = MSXColorValue[][];

/**
 * Represents the foreground and background colors for an 8-pixel segment in SCREEN 2.
 */
export interface LineColorAttribute {
  /** The foreground color for the segment. */
  fg: MSX1ColorValue;
  /** The background color for the segment. */
  bg: MSX1ColorValue;
}

/**
 * Represents the logical properties of a tile, used for game mechanics.
 */
export interface TileLogicalProperties {
  /** The primary byte for encoded properties (0-255). High nibble = familyId, Low nibble = instanceId. */
  mapId: number;
  /** The solidity category of the tile (0-15), derived from mapId. */
  familyId: number;
  /** Property flags for the tile (0-15), derived from mapId. */
  instanceId: number;

  /** Whether the tile is solid (derived from familyId). */
  isSolid: boolean;
  /** Whether the tile is breakable (derived from instanceId). */
  isBreakable: boolean;
  /** Whether the tile can be moved (derived from instanceId). */
  isMovable?: boolean;
  /** Whether the tile causes damage (derived from instanceId). */
  causesDamage?: boolean;
  /** Whether the tile is an interactive switch (derived from instanceId). */
  isInteractiveSwitch?: boolean;
  /** Explicit interactable marker used by the generic tile-interaction runtime. */
  isInteractable?: boolean;
  /** Programmed interaction behavior for this tile. */
  interactionType?: TileInteractionType;
  /** Optional numeric parameter interpreted by the selected interaction type. */
  interactionValue?: number;
  /** Optional target variable / hook name used by programmable interactions. */
  interactionTarget?: string;
}

/**
 * Animation metadata for dynamic background tiles in MSX ASM exports.
 * Multiple tiles sharing the same groupId are treated as animation frames.
 */
export type TileAnimationMode = 'frames' | 'transform';

export type TileTransformEffect =
  | 'rotate_left'
  | 'rotate_right'
  | 'shift_left'
  | 'shift_right'
  | 'shift_up'
  | 'shift_down'
  | 'swap_top_bottom';

export interface TileTransformSettings {
  /** Bitwise/row transform operation applied at runtime in ASM. */
  effect?: TileTransformEffect;
  /** Number of checkpoints/steps used by editor preview cycle (1-255). */
  checkpoints?: number;
  /** Apply vertical transforms to color rows too (SCREEN 2 attribute bytes). */
  includeColors?: boolean;
}

export interface TileAnimationSettings {
  /** Enable/disable animation for this tile. */
  enabled?: boolean;
  /** Animation mode: explicit frame list or runtime transform. */
  mode?: TileAnimationMode;
  /** Group identifier shared by all frames (e.g. "torch"). */
  groupId?: string;
  /** Frame order inside the group (0,1,2...). */
  frameIndex?: number;
  /** Frames to wait between animation updates (1-255). */
  speed?: number;
  /** Optional target/base tile ID where frames are rendered. */
  baseTileId?: string;
  /** Transform-mode settings (used when mode === 'transform'). */
  transform?: TileTransformSettings;
}

/**
 * Represents a tile asset.
 */
export interface Tile {
  /** A unique identifier for the tile. */
  id: string;
  /** The name of the tile. */
  name: string;
  /** The width of the tile in pixels. */
  width: number;
  /** The height of the tile in pixels. */
  height: number;
  /** The pixel data for the tile. */
  data: PixelData;
  /** Line color attributes for SCREEN 2 mode. */
  lineAttributes?: LineColorAttribute[][];
  /** Logical properties for game mechanics. */
  logicalProperties: TileLogicalProperties;
  /** Optional per-8x8 character logical overrides, keyed as "charX,charY". Missing entries inherit logicalProperties. */
  charLogicalProperties?: Record<string, TileLogicalProperties>;
  /** Optional custom palette definition for MSX2 tiles. */
  screen5Palette?: Screen5PaletteSlot[];
  /** Optional tile animation metadata for ASM generation. */
  animation?: TileAnimationSettings;
  /** Compatibility mirror: enables animated tile behavior. */
  isAnimated?: boolean;
  /** Compatibility mirror: animation group ID. */
  animationGroup?: string;
  /** Compatibility mirror: frame index inside group. */
  animationFrameIndex?: number;
  /** Compatibility mirror: speed in frames per update. */
  animationSpeed?: number;
  /** Compatibility mirror: target/base tile ID. */
  animationBaseTileId?: string;
  /** Compatibility mirror: animation mode ('frames' | 'transform'). */
  animationMode?: TileAnimationMode;
  /** Compatibility mirror: transform effect. */
  animationTransformEffect?: TileTransformEffect;
  /** Compatibility mirror: preview checkpoints/steps. */
  animationTransformCheckpoints?: number;
  /** Compatibility mirror: include color bytes in vertical transforms. */
  animationTransformIncludeColors?: boolean;
}

/**
 * Represents a single frame of a sprite's animation.
 */
export interface SpriteFrame {
  /** A unique identifier for the frame. */
  id: string;
  /** The pixel data for the frame. */
  data: PixelData;
  /** Optional independent MSX1 hardware-sprite bitplanes keyed by spritePalette index. */
  msx1LayerData?: Record<number, boolean[][]>;
}

/** The direction an entity is facing. */
export type FacingDirection = 'neutral' | 'right' | 'left' | 'up' | 'down';

/**
 * Represents a sprite asset.
 */
export interface Sprite {
  /** A unique identifier for the sprite. */
  id: string;
  /** The name of the sprite. */
  name: string;
  /** The size of the sprite in pixels. */
  size: { width: number; height: number };
  /** The 4-color palette used by the sprite. */
  spritePalette: [MSXColorValue, MSXColorValue, MSXColorValue, MSXColorValue];
  /** The color treated as transparent. */
  backgroundColor: MSXColorValue;
  /** An array of animation frames. */
  frames: SpriteFrame[];
  /** The index of the currently displayed frame. */
  currentFrameIndex: number;
  /** Desired animation speed in milliseconds per frame (optional). */
  animationSpeedMs?: number;
  /** A key-value map of custom attributes. */
  attributes?: Record<string, any>;
  /** The default facing direction of the sprite. */
  facingDirection?: FacingDirection;
  /** Hitbox configuration for collision detection. */
  hitbox?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
  /** Whether the sprite is mirrored horizontally by default. */
  mirroredHorizontally?: boolean;
  /** Whether the sprite is mirrored vertically by default. */
  mirroredVertically?: boolean;
  /** Whether the sprite animation loops (default: true). */
  loops?: boolean;
  /** MSX1 hardware-sprite layer offsets keyed by spritePalette index. */
  msx1LayerOffsets?: Record<number, {
    /** Vertical offset applied to this color layer when rendered on MSX1. */
    offsetY?: number;
  }>;
}

export interface Msx2SpriteFrame {
  id: string;
  data: PixelData;
}

export type Msx2SuperSpriteLayout = 'single16' | 'stackVertical' | 'stackHorizontal' | 'block2x2' | 'custom';

export interface Msx2SuperSpritePart {
  id: string;
  label: string;
  offsetX: number;
  offsetY: number;
  width: 16;
  height: 16;
}

export interface Msx2HardwareSpriteSettings {
  x: number;
  y: number;
  color: number;
  patternIndex: number;
  /** Enables Konami-style OR-color composition when a row contains A, B, and A|B colors. */
  useOrColor?: boolean;
}

export interface Msx2Sprite {
  id: string;
  name: string;
  target: 'MSX2';
  vdpMode: 'SCREEN4' | 'SCREEN5';
  size: { width: number; height: number };
  /** Logical composition of 16x16 MSX2 hardware sprite cells. */
  superSpriteLayout?: Msx2SuperSpriteLayout;
  superSpriteParts?: Msx2SuperSpritePart[];
  palette: Screen5PaletteSlot[];
  backgroundColor: MSXColorValue;
  frames: Msx2SpriteFrame[];
  currentFrameIndex: number;
  animationSpeedMs?: number;
  loops?: boolean;
  /** Authored side/orientation. Mideas can mirror horizontal sprites from this base direction. */
  facingDirection?: FacingDirection;
  hitbox?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
  hardware: Msx2HardwareSpriteSettings;
}

export interface Msx2Bitmap {
  id: string;
  name: string;
  target: 'MSX2';
  vdpMode: 'SCREEN5';
  size: { width: 256; height: 212 };
  palette: Screen5PaletteSlot[];
  pixels: number[][];
  transparentSlot?: number;
  notes?: string;
}

export interface BitmapTileScreen5 {
  id: string;
  name: string;
  mode: 'SCREEN5_BITMAP';
  width: number;
  height: number;
  sourceType: 'png-import' | 'manual-edit' | 'generated' | 'atlas-export';
  sourceFileName?: string;
  paletteId: string;
  pixelData: number[];
  /** Optional SCREEN 5 bitmap-room collision flags carried by stamps/metatiles. */
  collisionFlags?: number;
  /** Optional SCREEN 5 bitmap-room behavior code carried by stamps/metatiles. 3 = ice_slide surface, 4 = exit_enemy. */
  behaviorCode?: number;
  previewImage?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BitmapTileStampScreen5 {
  id: string;
  name: string;
  mode: 'SCREEN5_BITMAP_STAMP';
  columns: number;
  rows: number;
  tileWidth: 16;
  tileHeight: 16;
  sourceType: 'png-import' | 'manual-edit' | 'generated' | 'atlas-export';
  sourceFileName?: string;
  paletteId: string;
  tiles: BitmapTileScreen5[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * A SCREEN 5 bitmap stamp stored as a PROJECT asset (persists in the project JSON,
 * so a new project starts without stamps). Same shape as a global stamp-library
 * entry (`Msx2BitmapStampLibraryEntry`) so the editor can reuse stamp placement logic.
 */
export interface Msx2BitmapStampAsset {
  id: string;
  name: string;
  savedAt: number;
  stamp: BitmapTileStampScreen5;
  palette: Screen5PaletteSlot[];
}

export interface Msx2BitmapTerrainAssetTile {
  id: string;
  name: string;
  width: number;
  height: number;
  pixels: number[][];
  collisionFlags?: number;
  behaviorCode?: number;
}

/** Reusable SCREEN 5 autotile terrain asset. The terrain mapping references tile ids
 *  from `tiles`; importing into a room copies those tiles into that room's atlas and
 *  remaps the terrain to the newly-created atlas entry ids. */
export interface Msx2BitmapTerrainAsset {
  id: string;
  name: string;
  savedAt: number;
  terrain: Omit<Msx2BitmapAutoTerrain, 'id'>;
  tiles: Msx2BitmapTerrainAssetTile[];
  palette: Screen5PaletteSlot[];
}

export type Msx2BitmapRoomCommand =
  | { id: string; op: 'copy'; atlasEntryId: string; dx: number; dy: number; w?: number; h?: number }
  | { id: string; op: 'fill'; x: number; y: number; w: number; h: number; color: number }
  | { id: string; op: 'lineH'; x: number; y: number; length: number; color: number }
  | { id: string; op: 'lineV'; x: number; y: number; length: number; color: number };

export interface Msx2BitmapRoomAtlasEntry {
  id: string;
  name: string;
  sx: number;
  sy: number;
  w: number;
  h: number;
  /** Optional SCREEN 5 bitmap-room collision/behavior flags applied when this atlas tile is painted. */
  collisionFlags?: number;
  /** Optional SCREEN 5 bitmap-room behavior code applied when this atlas tile is painted. 3 = ice_slide surface, 4 = exit_enemy. */
  behaviorCode?: number;
  /** Optional SCREEN 5 bitmap-room 8x8 sub-cell solidity mask applied when this atlas tile is painted (0..15, 0=full cell, 15=full cell). Each bit is one quadrant: bit0=TL, bit1=TR, bit2=BL, bit3=BR. */
  collisionShape?: number;
  /** SCREEN 5 bitmap-room destroy_tile skill: cells painted with this tile can be dug out by the player. */
  destructible?: boolean;
}

/**
 * Autotile terrain for SCREEN 5 bitmap rooms. Editor-only: painting with a terrain picks the
 * atlas entry matching each cell's neighbour mask, but the room still stores plain `tileGrid`
 * atlas references, so the MSX2 generator and the ROM output are unaffected.
 */
export interface Msx2BitmapAutoTerrain {
  id: string;
  name: string;
  /** blob16: 16 tiles keyed by cardinal neighbours; wang47: 47 tiles including diagonals. */
  template: 'blob16' | 'wang47';
  /** Canonical 8-bit neighbour mask (see utils/msx2Autotile.ts) -> atlas entry id. */
  mapping: Record<number, string>;
  /**
   * Optional random substitutions per canonical mask (e.g. grassier centre tiles). Rolled
   * ONCE when a cell first resolves to a mask; re-resolving keeps any tile already valid for
   * the mask (base or variant), so healing neighbours never reshuffles decoration. Erase +
   * repaint re-rolls.
   */
  variants?: Record<number, Msx2BitmapAutoTerrainVariant[]>;
}

/** Random substitution tile for one autotile mask (e.g. a grassier centre tile). */
export interface Msx2BitmapAutoTerrainVariant {
  /** Atlas entry drawn instead of the base tile when the roll hits. */
  entryId: string;
  /** 1-100: chance of this variant. The base tile keeps the remaining probability. */
  percent: number;
}

export interface Msx2KeyItemDefinition {
  id: string;
  name: string;
  /** Inventory bit/slot used by the eventual runtime exporter. Keep 0..7 for one byte. */
  bitIndex: number;
  /** Optional HUD icon id to mirror this key/item in the linked HUD. */
  hudIconId?: string;
  /** Palette slot used by simple UI/runtime previews. */
  color?: number;
  /** When true, the key survives room transitions/save-state decisions. */
  persistent?: boolean;
  notes?: string;
}

export interface Msx2LockedDoorConfig {
  enabled: boolean;
  requiredKeyId?: string;
  consumeKey?: boolean;
  openOnce?: boolean;
  /** Transition doors only fire on a fresh UP press while overlapping (shop-style entrance). */
  requireUpKey?: boolean;
  closedAtlasEntryId?: string;
  openAtlasEntryId?: string;
  lockedMessage?: string;
  targetRoomId?: string;
  targetEntryId?: string;
}

export interface Msx2PressureButtonConfig {
  enabled: boolean;
  targetDoorId?: string;
  actors?: 'player' | 'enemies' | 'playerAndEnemies';
  latch?: boolean;
  atlasEntryId?: string;
  pressedAtlasEntryId?: string;
}

/** Spring/jumper tile in SCREEN 5 bitmap rooms: solid 16x16 cell that launches the player upward when stood on. */
export interface Msx2JumperConfig {
  enabled: boolean;
  /** Idle spring atlas metatile drawn at room load (cell is solid). */
  atlasEntryId?: string;
  /** Extended/compressed spring atlas metatile shown ~12 frames after firing. */
  triggeredAtlasEntryId?: string;
  /** Upward launch velocity in px/frame (2-15). Normal jumps are usually 5-6. */
  impulsePx?: number;
}

/** Wall-jumper tile in SCREEN 5 bitmap rooms: solid 16x16 cell placed against a vertical
 *  wall that launches the player horizontally on side contact. The launch decays via
 *  friction each frame while gravity keeps acting, producing an arcing trajectory. */
export interface Msx2WallJumperConfig {
  enabled: boolean;
  /** Idle wall-jumper atlas metatile drawn at room load (cell is solid). */
  atlasEntryId?: string;
  /** Extended/compressed wall-jumper atlas metatile shown ~12 frames after firing. */
  triggeredAtlasEntryId?: string;
  /** Horizontal launch magnitude in px/frame (2-15). */
  impulsePx?: number;
  /** Which way the player is thrown. 'right' = spring on the LEFT side of a wall;
   *  'left' = spring on the RIGHT side of a wall. Defaults to 'right'. */
  direction?: 'left' | 'right';
}

export interface Msx2Screen5BitmapRoom {
  id: string;
  name: string;
  target: 'MSX2';
  vdpMode: 'SCREEN5_BITMAP_ROOM';
  width: 256;
  height: 192 | 212;
  palette: Screen5PaletteSlot[];
  /**
   * Base SCREEN 5 palette slot. Single backdrop color: it clears the visible bitmap room,
   * and is written to VDP R#7 so it ALSO paints the outer "franjas" and every color-0
   * (transparent) pixel inside tiles. Background, transparency and border share this slot.
   */
  backgroundColor?: number;
  atlas: {
    width: number;
    height: number;
    offscreenBaseY: number;
    pixels: number[][];
    entries: Msx2BitmapRoomAtlasEntry[];
  };
  composition: {
    source: 'authored' | 'generated-from-cells';
    commands: Msx2BitmapRoomCommand[];
  };
  /**
   * Tile-map of the visible page: 16 cols x (height/16) rows (192 cells at 192px).
   * Each cell holds an atlas-entry reference (index into `atlas.entries` + 1; 0 = empty),
   * so only one 16x16 tile can occupy a cell (last paint wins). The render's `copy` commands
   * are derived from this grid; it is also the compact representation to export to MSX2.
   */
  tileGrid?: number[][];
  /** Autotile terrains: neighbour-mask -> atlas-entry mappings painted with the terrain brush. */
  autoTerrains?: Msx2BitmapAutoTerrain[];
  visibleFramebuffer?: {
    source: 'pre-rendered';
    pixels: number[][];
  };
  collision: number[][];
  effects: number[][];
  behavior: number[][];
  /**
   * Optional 8x8 SUB-CELL solidity, one nibble per 16x16 collision cell (same 16 cols x
   * rows grid as `collision`). Each cell is split into four 8x8 quadrants:
   *
   *   bit0 = top-left, bit1 = top-right, bit2 = bottom-left, bit3 = bottom-right
   *
   * A set bit means that quadrant is solid. 0 (and 15) mean "the whole 16x16 cell is
   * solid", which is the legacy behaviour, so absent/zero grids export exactly like
   * before. The mask is only consulted for cells that are already solid in `collision`;
   * it never makes a passable cell block. Typical shapes: 12 = bottom half (a ledge you
   * can walk on with an empty upper half), 3 = top half, 5 = left half, 10 = right half.
   *
   * The generator packs it into the HIGH nibble of the exported behavior byte (behavior
   * codes only use 0..4) and marks the cell with HAS_SHAPE (0x01) in the collision byte.
   */
  collisionShape?: number[][];
  entities: Msx2Screen4EntityInstance[];
  /** Room-authored key/item definitions used by pickups and locked doors. */
  keyItems?: Msx2KeyItemDefinition[];
  /** Dedicated player spawn/entry points. The player is not authored as a generic entity. */
  playerEntries?: Msx2PlayerEntry[];
  /**
   * Tiles drawn as SCREEN 5 hardware sprites with HIGHER SAT priority than the player,
   * so the player walks BEHIND them (pillars / capitals / foreground decoration). Each
   * entry is a 16x16 cell holding an atlas tile reference; the runtime converts the tile
   * pixels into a 1-bit opacity mask (pixel == backgroundColor -> transparent, else
   * opaque) and draws it as a single-color sprite on top of the player. Kept to a few
   * tiles per room (SAT budget). When empty/absent, the player stays at SAT slot 0
   * (bit-identical to legacy ROMs).
   */
  foregroundTiles?: Msx2BitmapRoomForegroundTile[];
  /** Optional MSX2 runtime metadata (HUD widgets, movement engine). */
  runtime?: Msx2Screen4Runtime;
  notes?: string;
}

/** A 16x16 foreground overlay tile drawn as a high-priority hardware sprite. */
export interface Msx2BitmapRoomForegroundTile {
  /** Grid column 0..15. */
  cellX: number;
  /** Grid row 0..(height/16)-1 (0..11 at 192px). */
  cellY: number;
  /** Atlas entry whose pixels define the opacity mask (non-background pixels = opaque). */
  atlasEntryId: string;
  /** Sprite colour 0..15. Defaults to the tile's most common non-background colour. */
  color?: number;
}

/** Foreground/background palette slots for one 8-pixel SCREEN 4 segment. */
export interface Msx2Screen4LineAttribute {
  fg: number;
  bg: number;
}

/** MSX2 SCREEN 4 tile gameplay role used for palette filtering and auto runtime layers. */
export type Msx2Screen4TileBehaviorKind = 'background' | 'foreground' | 'dangerous' | 'box';

/** Per-tile collision/damage hitbox in pixels relative to the tile top-left corner. */
export interface Msx2Screen4TileHitbox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface Msx2Screen4Tile {
  id: string;
  name: string;
  /** Width in pixels. Must be a multiple of 8. Defaults to the screen cell size, 16. */
  width?: number;
  /** Height in pixels. Must be a multiple of 8. Defaults to the screen cell size, 16. */
  height?: number;
  pixels: number[][];
  /** Per-row, per-8px-segment fg/bg slots for SCREEN 4 hardware constraints. */
  lineAttributes?: Msx2Screen4LineAttribute[][];
  /** Gameplay role: background, solid foreground, hazard, or pushable box. Defaults to background. */
  behaviorKind?: Msx2Screen4TileBehaviorKind;
  /** Optional SCREEN 5 bitmap-room collision flags preserved when importing into a bitmap atlas. */
  collisionFlags?: number;
  /** Optional SCREEN 5 bitmap-room behavior code preserved when importing into a bitmap atlas. */
  behaviorCode?: number;
  /** Optional per-tile hitbox override for collision/hazard probes. */
  hitbox?: Msx2Screen4TileHitbox;
}

export type Msx2ScreenKind = ScreenKind;
export type Msx2ScreenEngineKind = ScreenEngineKind;
export type Msx2EntityKind = 'player' | 'enemy' | 'collectible' | 'door' | 'npc' | 'hazard' | 'platform' | 'boss' | 'hidden_obj' | 'custom';
export type Msx2PlayerMovementMode = 'platform' | 'maze' | 'shooterHorizontal' | 'shooterVertical' | 'static';
export type Msx2EnemyMovementMode = 'static' | 'patrolX' | 'patrolY' | 'patrolChaseX' | 'walkerGravity' | 'ghostMaze' | 'dive';
export type Msx2PlayerGameType = 'platform' | 'maze' | 'shooterHorizontal' | 'shooterVertical' | 'topDown' | 'grid';
export type Msx2PlayerFunctionKeyAction = 'none' | 'inventory' | 'pause' | 'map' | 'status' | 'save' | 'load' | 'magic' | 'custom';
export type Msx2PlayerFunctionKeyId = 'f1' | 'f2' | 'f3' | 'f4' | 'f5';
export type Msx2PlayerInputSource = 'arrows' | 'joystick1' | 'joystick2';
export type Msx2PlayerButtonBinding = 'upArrow' | 'spc' | 'n' | 'm' | 'joyA' | 'joyB';
/** @deprecated Use Msx2PlayerButtonBinding */
export type Msx2PlayerJumpBinding = Msx2PlayerButtonBinding;
export type Msx2PlayerControlId = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack';

/** Per-skill control binding used by the state machine skill system. */
export interface Msx2PlayerSkillBinding {
  /** Primary icon. Never 'none' — if a skill has a binding, primary is required. */
  primary: Msx2PlayerControlId;
  /** Secondary icon for combo activations. 'none' = no second button needed. */
  secondary?: Msx2PlayerControlId | 'none';
  /** How primary/secondary are combined in UI declarations. Default: 'and'. */
  operator?: 'and' | 'or';
}
export type Msx2PlayerRenderMode = 'hardwareSprite' | 'softwareSprite' | 'hybrid';
export type Msx2PlayerSpriteSize = '16x16' | '16x32' | '32x16' | '32x32';
export type Msx2PlayerFacing = 'neutral' | 'left' | 'right' | 'up' | 'down';
export type Msx2PlayerEntryAnimation = 'none' | 'walkIn' | 'doorExit' | 'ladderExit' | 'fadeIn';

export type Msx2PlayerAnimationRole = 'idle' | 'walk' | 'run' | 'dash' | 'jump' | 'dead' | 'attack' | 'defend' | 'custom';
export type Msx2PlayerAnimationPlayback = 'loop' | 'once';

export interface Msx2PlayerAnimation {
  frames: number[];
  speed: number;
  /** MSX2 Sprite Editor asset used to render this animation. Falls back to player.render.spriteAssetId. */
  spriteAssetId?: string;
  /** Generic animation role used by gameplay/state machines and MSX export. */
  role?: Msx2PlayerAnimationRole;
  /** Declarative State Machine state linked to this animation. Does not drive runtime ASM yet. */
  stateMachineState?: string;
  /** Free label when role is custom. */
  customRole?: string;
  playback?: Msx2PlayerAnimationPlayback;
}

export interface Msx2PlayerHitbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Msx2PlayerWeaponType = 'melee' | 'projectile' | 'arc' | 'bomb' | 'magic';
export type Msx2PlayerWeaponButton = 'a' | 'b';
export type Msx2PlayerWeaponHitboxSource = 'attackByFacing' | 'custom' | 'none';
export type Msx2PlayerWeaponAvailability = 'owned' | 'pickup' | 'locked';
export type Msx2PlayerWeaponEmptyBehavior = 'block' | 'unequip' | 'switchState';
export type Msx2PlayerWeaponBreakBehavior = 'unequip' | 'remove' | 'keepBroken';

export interface Msx2PlayerWeaponAmmo {
  enabled: boolean;
  initial: number;
  max: number;
  consumePerUse: number;
  refillItemId?: string;
  refillAmount?: number;
  emptyBehavior?: Msx2PlayerWeaponEmptyBehavior;
  emptyState?: string;
}

export interface Msx2PlayerWeaponDurability {
  enabled: boolean;
  initial: number;
  max: number;
  consumePerUse: number;
  repairItemId?: string;
  repairAmount?: number;
  breakBehavior?: Msx2PlayerWeaponBreakBehavior;
  brokenState?: string;
}

/**
 * Declarative visual and collision contract for a directional melee attack.
 * The sprite is rendered relative to the player while the attack animation is
 * active; the runtime can use the facing-specific hitbox to apply damage to
 * enemies and destructible world tiles.
 */
export interface Msx2PlayerWeaponAttackVisual {
  /** msx2sprite asset id used for the slash animation. */
  spriteAssetId?: string;
  /** Consecutive (or explicit) sprite frame indices used by the slash. */
  frames: number[];
  /** Number of game frames each slash sprite frame remains visible. */
  frameDelay: number;
  /** Position of the visual relative to the player for each facing. */
  offsetByFacing: Partial<Record<Exclude<Msx2PlayerFacing, 'neutral'>, { x: number; y: number }>>;
  /** Damage rectangle relative to the player for each facing. */
  hitboxByFacing: Partial<Record<Exclude<Msx2PlayerFacing, 'neutral'>, Msx2PlayerHitbox>>;
  /** Whether this attack can damage enemy entities. */
  affectsEnemies: boolean;
  /** Whether this attack can interact with solid/destructible world tiles. */
  affectsWalls: boolean;
  /** Whether a matching destructible tile should be broken on contact. */
  breaksDestructibleTiles: boolean;
}

export interface Msx2PlayerWeaponDefinition {
  id: string;
  name: string;
  type: Msx2PlayerWeaponType;
  availability?: Msx2PlayerWeaponAvailability;
  pickupItemId?: string;
  button: Msx2PlayerWeaponButton;
  state?: string;
  animationRole?: Msx2PlayerAnimationRole;
  damage: number;
  cooldownFrames: number;
  activeFrames: {
    start: number;
    end: number;
  };
  hitboxSource: Msx2PlayerWeaponHitboxSource;
  projectileAssetId?: string;
  /** Bullet visual contract. Optional; when omitted, the weapon has no specific bullet visual. */
  bulletVisual?: {
    /** 'sprite' = hardware-sprite asset; 'char' = single 8x8 name-table char. */
    kind: 'sprite' | 'char';
    /** msx2sprite asset id (kind === 'sprite'). Empty/undefined = invisible/placeholder bullet. */
    spriteAssetId?: string;
    /** Screen char code 0-255 (kind === 'char'). */
    charCode?: number;
  };
  /** Directional melee/sword slash visual and impact metadata. */
  attackVisual?: Msx2PlayerWeaponAttackVisual;
  ammo?: Msx2PlayerWeaponAmmo;
  durability?: Msx2PlayerWeaponDurability;
  notes?: string;
}

export interface Msx2PlayerLogicFlags {
  isPlayer?: boolean;
  blocksProjectiles?: boolean;
  affectsEnemies?: boolean;
  pushable?: boolean;
  triggersEvents?: boolean;
  canDie?: boolean;
  canUseItems?: boolean;
  canUseMagic?: boolean;
}

export interface Msx2PlayerDefinition {
  id: string;
  name: string;
  target: 'MSX2';
  gameType: Msx2PlayerGameType;
  /** Default world-facing direction used when a screen entry does not override it. */
  defaultFacing?: Msx2PlayerFacing;
  basedOnTemplate?: string;
  render: {
    mode: Msx2PlayerRenderMode;
    spriteAssetId?: string;
    spriteSize: Msx2PlayerSpriteSize;
    paletteAssetId?: string;
    usesFlipX: boolean;
    /**
     * Optional sprite asset used for the destroy_tile skill's debris chips.
     * When omitted the generator falls back to a sprite named /debris|viruta/i,
     * then to its built-in 3x3 grey chip. Consumed by resolveBitmapDebrisSprite.
     */
    debrisSpriteAssetId?: string;
    /**
     * Explicit per-animation-state sprite overrides (state name -> sprite asset
     * id) for SCREEN 5 bitmap rooms. Wins over the Player Animations table.
     * e.g. { digging: 'pick_swing_sprite' }. Consumed by
     * resolveBitmapRoomStateAnimations.
     */
    stateSprites?: Record<string, string>;
  };
  animations: Record<string, Msx2PlayerAnimation>;
  /** Stable row order for the animation table and MSX export. */
  animationOrder?: string[];
  hitboxes: {
    body: Msx2PlayerHitbox;
    feet?: Msx2PlayerHitbox;
    head?: Msx2PlayerHitbox;
    attack?: Msx2PlayerHitbox;
    attackByFacing?: Partial<Record<Exclude<Msx2PlayerFacing, 'neutral'>, Msx2PlayerHitbox>>;
    interaction?: Msx2PlayerHitbox;
    damage?: Msx2PlayerHitbox;
  };
  movement: {
    model: Msx2PlayerGameType;
    moveSpeed: number;
    acceleration?: number;
    deceleration?: number;
    gravity?: number;
    maxFallSpeed?: number;
    jumpPower?: number;
    coyoteTime?: number;
    jumpBuffer?: number;
    airControl?: boolean;
    diagonalAllowed?: boolean;
    snapToGrid?: boolean;
    screenBoundsClamp?: boolean;
    fireRate?: number;
    maxProjectiles?: number;
  };
  inputMapping: Record<string, string>;
  /** When false, the action is omitted from runtime input handling. Omitted keys default to enabled. */
  inputEnabled?: Partial<Record<'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'inventory' | 'pause', boolean>>;
  /** Label used when the matching function key action is set to custom. */
  functionKeyCustomActions?: Partial<Record<Msx2PlayerFunctionKeyId, string>>;
  /** Skill-to-control binding overrides. Key = skill id. Falls back to SkillDef.controlIcon defaults. */
  skillBindings?: Record<string, Msx2PlayerSkillBinding>;
  /** Optional skill ids that are active for this player. Omitted = use defaults from SkillDef. */
  activeSkills?: string[];
  /**
   * Per-skill parameter values keyed by skill id and parameter key.
   * Populated by the normalizer from SkillDef.parameters defaults when the skill
   * is active. Not consumed by the MSX2 ASM generator yet.
   */
  skillParameters?: Record<string, Record<string, number | boolean>>;
  health: {
    maxHealth: number;
    lives: number;
    invulnerabilityFrames: number;
    knockbackX?: number;
    knockbackY?: number;
    /**
     * SCREEN 5 bitmap deadly-tile behaviour when the player touches a deadly
     * cell. true (default) = instant respawn (platformer-style: spikes kill on
     * touch and send the player back to the room spawn, costing 1 life).
     * false = action-style: spikes deal 1 health damage + blink i-frames but
     * do NOT respawn; the player can walk off and only respawns at 0 health.
     */
    deadlyInstantRespawn?: boolean;
  };
  /** Declarative weapon definitions. Not consumed by MSX2 ASM yet. */
  weapons?: Msx2PlayerWeaponDefinition[];
  equippedWeaponId?: string;
  attack: {
    type: 'none' | 'melee' | 'projectile' | 'whip' | 'swordArc' | 'shot' | 'bomb';
    damage: number;
    durationFrames?: number;
    cooldownFrames?: number;
    projectileType?: string;
  };
  interaction: {
    mode: 'touch' | 'pressUp' | 'pressAction' | 'automaticTrigger';
    box: Msx2PlayerHitbox;
  };
  sounds?: Record<string, string>;
  /** Enable/disable each player sound slot. */
  soundsEnabled?: Record<string, boolean>;
  /** Event trigger preset: event:default, anim:key, or custom. */
  soundPresets?: Record<string, string>;
  /** Custom event id when soundPresets[slot] is custom. */
  soundCustomValues?: Record<string, string>;
  /** MSX2 PSG Sound Editor asset id for each slot. */
  soundAssetIds?: Record<string, string>;
  /** Custom SFX id when soundAssetIds[slot] is __custom__. */
  soundAssetCustomValues?: Record<string, string>;
  inventoryHooks?: string[];
  /** Project State Machine asset id used by this MSX2 player. */
  stateMachineAssetId?: string;
  /** Runtime/logic flags for screen placement and ECS behavior. */
  logic?: Msx2PlayerLogicFlags;
  /** Native MSX2 component bag used by SCREEN 4/5 player-specific capabilities. */
  components?: Record<string, Record<string, any>>;
  stateMachine: string[];
  budget: {
    cpu: number;
    ram: number;
    sprites: number;
    maxProjectiles?: number;
  };
  requiredRoutines: string[];
  notes?: string;
}

export interface Msx2PlayerEntry {
  id: string;
  x: number;
  y: number;
  facing: Msx2PlayerFacing;
  state?: string;
  playerId?: string;
  entryAnimation?: Msx2PlayerEntryAnimation;
  invulnerabilityFrames?: number;
  cameraTransition?: 'instant' | 'scroll' | 'fade';
}

/** MSX2-only project template selected at new-project time. Drives asset/entity filtering. */
export type Msx2GameProfileId = 'platform' | 'maze' | 'shooterVertical' | 'shooterHorizontal' | 'bitmapPlatform';

export interface Msx2ProjectProfileFilters {
  allowedAssetTypes: ProjectAsset['type'][];
  allowedEntityPresetIds: string[];
  allowedEntityEngines: string[];
  allowedComponentIds: string[];
  defaultEntityPresetId: string;
  showBehaviorLayer: boolean;
  showEffectsLayer: boolean;
}

export interface Msx2ProjectProfile {
  version: 1;
  profileId: Msx2GameProfileId;
  label: string;
  description: string;
  screenEngine: Msx2ScreenEngineKind;
  movementMode: Msx2PlayerMovementMode;
  filters: Msx2ProjectProfileFilters;
}

export interface Msx2Screen4EntityInstance {
  id: string;
  name: string;
  kind: Msx2EntityKind;
  position: { x: number; y: number };
  spriteAssetId?: string;
  /** Native MSX2 component bags. Kept separate from legacy MSX1 EntityTemplate ECS. */
  components?: Record<string, Record<string, any>>;
  params?: Record<string, any>;
}

export interface Msx2Screen4Layers {
  collision: number[][];
  effects: number[][];
  /** MSX2-only behavior cells. 1 = ladder, 2 = conveyor right, 3 = conveyor left. Kept separate from collision/effects. */
  behavior?: number[][];
  entities: Msx2Screen4EntityInstance[];
  enemySpawns?: EnemySpawn[];
}

export type Msx2HudWidgetKind = 'bar' | 'counter' | 'icon' | 'text';
export type Msx2HudWidgetBinding =
  | 'playerEnergy'
  | 'bossEnergy'
  | 'air'
  | 'experience'
  | 'level'
  | 'skillPoints'
  | 'score'
  | 'lives'
  | 'collectibles'
  | 'keyItem'
  | 'carriedObject'
  | 'custom';

export interface Msx2HudWidget {
  id: string;
  name: string;
  kind: Msx2HudWidgetKind;
  binding: Msx2HudWidgetBinding;
  x: number;
  y: number;
  width: number;
  height: number;
  maxValue?: number;
  initialValue?: number;
  primaryColor?: number;
  secondaryColor?: number;
  borderColor?: number;
  emptyColor?: number;
  iconTileIndex?: number;
  /** Optional bitmap-room atlas entry used by SCREEN 5 HUD icon/item widgets. */
  atlasEntryId?: string;
  text?: string;
  variableName?: string;
}

/** Standalone HUD asset (Msx2HudAsset) element kinds. Distinct from Msx2HudWidgetKind (SCREEN 4 tile HUD). */
export type Msx2HudElementKind = 'bar' | 'counter' | 'icon' | 'iconRow' | 'iconCounter' | 'text' | 'portrait';
export type Msx2HudElementBinding = Msx2HudWidgetBinding;

export interface Msx2HudElementFormat {
  digits?: number;
  base?: 'dec' | 'hex';
  zeroPad?: boolean;
  prefix?: string;
}

export interface Msx2HudElementColors {
  text?: number;
  outline?: number;
  shadow?: number;
  primary?: number;
  secondary?: number;
  border?: number;
  empty?: number;
}

export interface Msx2HudElementAlign {
  h: 'left' | 'center' | 'right';
  v: 'top' | 'middle' | 'bottom';
}

export type Msx2HudXpRewardActionType =
  | 'incrementLevel'
  | 'incrementSkillPoints'
  | 'restoreHealth'
  | 'callAsmHook';

export interface Msx2HudXpRewardAction {
  type: Msx2HudXpRewardActionType;
  amount?: number;
  hookLabel?: string;
}

export interface Msx2HudXpRewardConfig {
  enabled: boolean;
  carryOverflow: boolean;
  actions: Msx2HudXpRewardAction[];
}

/** A single structured HUD element placed on a Msx2HudAsset canvas. */
export interface Msx2HudElement {
  id: string;
  kind: Msx2HudElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  binding: Msx2HudElementBinding;
  variableName?: string;
  text?: string;
  maxValue?: number;
  initialValue?: number;
  spacing?: number;
  format: Msx2HudElementFormat;
  colors: Msx2HudElementColors;
  atlasEntryId?: string;
  /** Empty/background icon variant used by iconRow slots (e.g. lives pips). */
  emptyAtlasEntryId?: string;
  /** @deprecated keyItem HUD widgets now reflect the shared key count
   *  (bitmap_key_count): the icon toggles empty (0 keys) / full (≥1 key) and a
   *  counter shows the total. This per-bit selector is no longer read; kept only
   *  so older project JSON still parses. */
  keyBitIndex?: number;
  /** Optional reward program used by experience bars when player XP reaches maxValue. */
  xpReward?: Msx2HudXpRewardConfig;
  align: Msx2HudElementAlign;
  visible: boolean;
  blink: 'off' | 'slow' | 'fast';
}

/** Small icon atlas owned by a Msx2HudAsset, used by icon/iconRow/iconCounter/portrait elements. */
export interface Msx2HudIconEntry {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Palette indices (0-15), one entry per pixel row-major. */
  pixels: number[][];
}

export type Msx2HudLayer =
  | { id: string; name: string; kind: 'paint'; visible: boolean; locked: boolean; pixels: number[][] }
  | { id: string; name: string; kind: 'widget'; visible: boolean; locked: boolean; element: Msx2HudElement };

/**
 * Standalone, reusable HUD asset for MSX2 SCREEN 5 bitmap rooms.
 * Authored once (paint layers + structured widget layers with variable bindings),
 * then linked by id from a room's runtime (Msx2Screen4Runtime.hudAssetId).
 */
export interface Msx2HudAsset {
  target: 'MSX2';
  /** Fixed: matches BITMAP_ROOM_HUD_HEIGHT (top band of SCREEN 5 bitmap rooms). */
  width: 256;
  height: 20;
  /** Ordered top-to-bottom in the editor's Layers panel; first entry renders on top. */
  layers: Msx2HudLayer[];
  /** Optional shared palette asset (type 'palette'), same pattern as WorldMapGraph.paletteAssetId. */
  paletteAssetId?: string;
  /**
   * Optional MSX2 HUD Font asset used by SCREEN 5 bitmap text/counter widgets.
   * null means "None": do not auto-pick a project font, use the built-in bitmap fallback.
   */
  hudFontAssetId?: string | null;
  icons: Msx2HudIconEntry[];
  notes?: string;
}

export type Msx2ShooterDirection = 'vertical' | 'horizontal';
export type Msx2ShooterScrollMode = 'none' | 'tileVertical' | 'spaceLoop' | 'bossStatic';
export type Msx2ShooterPlayerMode = 'single' | 'twoPlayerAlternate' | 'twoPlayerLimited';
export type Msx2IrqProfileId =
  | 'IRQ_IDLE'
  | 'IRQ_STAGE_NORMAL'
  | 'IRQ_STAGE_SCROLL_EVEN'
  | 'IRQ_STAGE_SCROLL_ODD'
  | 'IRQ_HUD_DIRTY'
  | 'IRQ_PALETTE_FLASH'
  | 'IRQ_BOSS'
  | 'IRQ_TRANSITION_FADE';

export interface Msx2IrqProfileBudget {
  id: Msx2IrqProfileId;
  estimatedCycles: number;
  worstCaseCycles: number;
  maxAllowedCycles: number;
  vramBytes: number;
  frequency: 'everyFrame' | 'every2Frames' | 'burst' | 'transitionOnly';
  sustained: boolean;
  tasks: string[];
}

export interface Msx2Shooter60HzBudget {
  targetHz: 60;
  maxEnemies: number;
  maxPlayerShots: number;
  maxEnemyShots: number;
  maxPowerups: number;
  maxExplosions: number;
  maxBossParts: number;
  activeIrqProfile: Msx2IrqProfileId;
  irqProfiles: Msx2IrqProfileBudget[];
}

export interface Msx2ShooterRuntimeConfig {
  direction: Msx2ShooterDirection;
  scrollMode: Msx2ShooterScrollMode;
  playerMode: Msx2ShooterPlayerMode;
  stageId?: string;
  waveSetId?: string;
  bossId?: string;
  hudMode: 'compactTop' | 'compactBottom' | 'minimal';
  budget: Msx2Shooter60HzBudget;
}

export interface Msx2Screen4Runtime {
  screenKind: Msx2ScreenKind;
  screenEngine: Msx2ScreenEngineKind;
  /** Player movement engine selected by the native SCREEN 4 runtime. */
  movementMode?: Msx2PlayerMovementMode;
  /** Legacy/editor alias for movementMode. */
  movementModel?: Msx2PlayerMovementMode;
  controlMode?: Msx2PlayerMovementMode;
  playerMode?: Msx2PlayerMovementMode;
  /** Number of collected effect=3 cells required before exits unlock on this MSX2 screen. */
  requiredCollectibles?: number;
  /** Initial air/time value for this MSX2 screen. Use 0 to disable the countdown. */
  initialAir?: number;
  /** Platform jump impulse magnitude (1024 = MSX1 default #FC00). */
  jumpPower?: number;
  jumpImpulse?: number;
  /** Platform gravity acceleration per frame in 8.8 low-byte units (64 = MSX1 default). */
  gravityStrength?: number;
  /** Terminal fall speed cap in 8.8 units (1024 = MSX1 default). */
  terminalVelocity?: number;
  disableAirTimer?: boolean;
  airTimer?: boolean;
  activeAreaX: number;
  activeAreaY: number;
  activeAreaWidth: number;
  activeAreaHeight: number;
  hideHud?: boolean;
  showHud?: boolean;
  statusHud?: boolean;
  hudStyle?: 'compact' | 'statusBars';
  playerEnergyMax?: number;
  playerEnergyInitial?: number;
  bossEnergyMax?: number;
  bossEnergyInitial?: number;
  hudPrimaryColor?: number;
  hudSecondaryColor?: number;
  hudBorderColor?: number;
  hudEmptyColor?: number;
  /** Optional MSX2 HUD Font asset used by bitmap-room text widgets. */
  hudFontAssetId?: string;
  hudWidgets?: Msx2HudWidget[];
  /** Optional linked Msx2HudAsset (project asset type 'msx2hud'); supersedes inline hudWidgets for SCREEN 5 bitmap rooms. */
  hudAssetId?: string;
  shooter?: Msx2ShooterRuntimeConfig;
  notes?: string;
}

export interface Msx2Screen4TileScreen {
  id: string;
  name: string;
  target: 'MSX2';
  vdpMode: 'SCREEN4' | 'SCREEN5';
  tileSize: 16;
  widthTiles: 16;
  heightTiles: 12;
  palette: Screen5PaletteSlot[];
  /** User-defined functional zoning of the shared palette (sprites vs tiles). */
  paletteZones?: Msx2PaletteZones;
  tiles: Msx2Screen4Tile[];
  map: number[][];
  /** MSX2 runtime layers. Kept separate from visual tile data to avoid duplicating large bitmap payloads. */
  layers?: Msx2Screen4Layers;
  /** Dedicated player spawn/entry points for screen links, doors, checkpoints, and respawns. */
  playerEntries?: Msx2PlayerEntry[];
  /** Runtime role/engine metadata for MSX2 screens. */
  runtime?: Msx2Screen4Runtime;
  /** Legacy collision map retained for older projects. Prefer layers.collision for new data. */
  collisionMap?: number[][];
  notes?: string;
}

/**
 * Represents a single tile placed on a screen map layer.
 */
export interface ScreenTile {
  /** The ID of the tile asset. */
  tileId: string | null;
  /** The x-coordinate of the sub-tile within the larger tile asset (for meta-tiles). */
  subTileX?: number;
  /** The y-coordinate of the sub-tile within the larger tile asset. */
  subTileY?: number;
}

/** A 2D array representing a layer of a screen map. */
export type ScreenLayerData = ScreenTile[][];

/**
 * An enumeration of all possible HUD element types.
 */
export enum HUDElementType {
  Score = "Score", HighScore = "HighScore", Lives = "Lives", EnergyBar = "EnergyBar",
  ItemDisplay = "ItemDisplay", SceneName = "SceneName", MiniMap = "MiniMap",
  CoinCounter = "CoinCounter", BossEnergyBar = "BossEnergyBar", PhaseIndicator = "PhaseIndicator",
  AttackAlert = "AttackAlert", TextBox = "TextBox", NumericField = "NumericField", CustomCounter = "CustomCounter",
}

/**
 * The base properties for a HUD element.
 */
export interface HUDElementProperties_Base {
  /** The name of the HUD element. */
  name: string;
  /** The text content for text-based elements. */
  text?: string;
  /** The position of the element on the screen, in pixels. */
  position: { x: number; y: number };
  /** Whether the element is currently visible. */
  visible: boolean;
  /** A key-value map of additional details specific to the element type. */
  details?: Record<string, any>;
  /** The memory address associated with the element's data. */
  memoryAddress?: string;
}

/**
 * Represents a single element in the Heads-Up Display (HUD).
 */
export interface HUDElement extends HUDElementProperties_Base {
  /** A unique identifier for the HUD element. */
  id: string;
  /** The type of the HUD element. */
  type: HUDElementType;
}

/**
 * Represents the complete configuration for a screen's HUD.
 */
/**
 * Represents the TileBank assignment for a screen sector in MSX Screen 2.
 * MSX Screen 2 divides the 24-line screen into 3 sectors of 8 lines each.
 * Fonts are automatically extracted from the TileBank's character definitions.
 */
export interface HUDScreenSector {
  /** The TileBank asset ID to use for this sector. Contains both tiles and font characters. */
  tileBankAssetId?: string;
}

/** Snapshot cell for an imported HUD frame region. */
export interface HUDImportedFrameCell {
  /** Tile X coordinate in screen grid units (0-31 in SCREEN 2). */
  x: number;
  /** Tile Y coordinate in screen grid units (0-23 in SCREEN 2). */
  y: number;
  /** Character code resolved from the selected TileBank at import time. */
  charCode: number;
  /** Optional original tile reference for editor preview. */
  tileId?: string;
  /** Optional sub-tile X for meta-tiles. */
  subTileX?: number;
  /** Optional sub-tile Y for meta-tiles. */
  subTileY?: number;
}

/** Snapshot metadata for a HUD frame imported from a screen asset. */
export interface HUDImportedFrame {
  /** Source screen asset ID used to import the frame. */
  sourceScreenAssetId: string;
  /** Optional source screen name for editor display. */
  sourceScreenName?: string;
  /** TileBank asset ID used to resolve char codes during import. */
  sourceTileBankAssetId?: string;
  /** Source screen dimensions captured at import time. */
  width: number;
  height: number;
  /** Source active area used to detect HUD/discard zone. */
  activeAreaX: number;
  activeAreaY: number;
  activeAreaWidth: number;
  activeAreaHeight: number;
  /** Timestamp for traceability. */
  importedAt: number;
  /** Imported HUD cells (outside active area). */
  cells: HUDImportedFrameCell[];
}

/**
 * Represents the HUD configuration with proper MSX Screen 2 sector management.
 */
export interface HUDConfiguration {
  /** An array of all HUD elements. */
  elements: HUDElement[];
  /** Optional imported HUD frame snapshot from a source screen. */
  importedFrame?: HUDImportedFrame;
  /** TileBank and Font assignments per screen sector (MSX Screen 2 compatible). */
  screenSectors?: {
    /** Sector 0: Lines 0-7 (Y: 0-63 pixels) - VRAM Bank 0 */
    sector0?: HUDScreenSector;
    /** Sector 1: Lines 8-15 (Y: 64-127 pixels) - VRAM Bank 1 */
    sector1?: HUDScreenSector;
    /** Sector 2: Lines 16-23 (Y: 128-191 pixels) - VRAM Bank 2 */
    sector2?: HUDScreenSector;
  };
}

// --- ECS Core Types ---
/**
 * Defines a single property within a component.
 */
export interface ComponentPropertyDefinition {
  /** The name of the property. */
  name: string;
  /** The data type of the property. */
  type: 'byte' | 'word' | 'boolean' | 'string' | 'color' | 'sprite_ref' | 'msx2sprite_ref' | 'sound_ref' | 'behavior_script_ref' | 'entity_template_ref' | 'statemachine_ref' | 'tile_ref' | 'dialogue_ref';
  /** The default value for the property. */
  defaultValue?: any;
  /** A description of the property. */
  description?: string;
}

/**
 * Defines the structure and properties of a component.
 */
export interface ComponentDefinition {
  /** A unique identifier for the component definition (e.g., "comp_position"). */
  id: string;
  /** A user-friendly name for the component (e.g., "Position"). */
  name: string;
  /** Target runtime. Omitted means legacy MSX1. */
  target?: 'MSX1' | 'MSX2' | 'COMMON';
  /** An array of property definitions for this component. */
  properties: ComponentPropertyDefinition[];
  /** A description of the component's purpose. */
  description?: string;
}

/**
 * Represents a component attached to an entity template, with its default values.
 */
export interface EntityTemplateComponent {
  /** The ID of the ComponentDefinition. */
  definitionId: string;
  /** A key-value map of default property values for this component. */
  defaultValues: Record<string, any>;
}

/**
 * Defines a template for creating entity instances.
 */
export interface EntityTemplate {
  /** A unique identifier for the template (e.g., "tpl_player"). */
  id: string;
  /** A user-friendly name for the template (e.g., "Player", "Goomba"). */
  name: string;
  /** Target runtime. Omitted means legacy MSX1. */
  target?: 'MSX1' | 'MSX2' | 'COMMON';
  /** An optional icon for display in the editor UI. */
  icon?: string;
  /** Marks this template as a player-controlled hero candidate for runtime systems. */
  isPlayer?: boolean;
  /** Global Player Library template this project player was created from. */
  playerTemplateId?: string;
  /** Marks this entity template as a concrete project player definition. */
  playerLibraryRole?: 'projectPlayer';
  /** An array of components that make up this template. */
  components: EntityTemplateComponent[];
  /** A description of the entity template. */
  description?: string;
  /** MSX2 entity kind captured when saved from the MSX2 room editor (target MSX2). */
  msx2Kind?: Msx2EntityKind;
  /** MSX2 entity params captured when saved from the MSX2 room editor (target MSX2). */
  msx2Params?: Record<string, any>;
}

export type PlayerTemplateCategory =
  | 'platformer'
  | 'maze'
  | 'shooter'
  | 'topDown'
  | 'grid'
  | 'dialogue';

export type PlayerTemplateMovementType =
  | 'Platformer'
  | 'Maze4'
  | 'Maze8'
  | 'ShooterHorizontal'
  | 'ShooterVertical'
  | 'TopDown'
  | 'Grid'
  | 'Static';

export interface PlayerTemplateBudget {
  cpu: number;
  ram: number;
  sprites: number;
}

export interface PlayerTemplate {
  templateId: string;
  name: string;
  category: PlayerTemplateCategory;
  movement: {
    type: PlayerTemplateMovementType;
    defaults: Record<string, number | boolean | string>;
  };
  input: Record<string, string>;
  stateMachine: string[];
  respawn: {
    mode: 'lastCheckpoint' | 'screenEntry' | 'fixed' | 'none';
    invulnerabilityFrames: number;
  };
  requiredRoutines: string[];
  budget: PlayerTemplateBudget;
  description?: string;
}

export interface ProjectPlayerDefinition {
  playerId: string;
  basedOnTemplate: string;
  name: string;
  render?: {
    spriteId?: string;
    palette?: string;
    size?: string;
    animations?: Record<string, { frames: number[]; speed: number }>;
  };
  stats: {
    maxHealth: number;
    lives: number;
  };
  movementOverrides?: Record<string, number | boolean | string>;
  sounds?: Record<string, string>;
}

export type EnemyCategory = 'simpleEnemy' | 'boss' | 'hazard' | 'projectileLike';
export type EnemyBehaviorType = 'None' | 'PatrolHorizontal' | 'WalkerTurnOnEdge' | 'FlyerSine' | 'BounceDiagonal' | 'Jumper' | 'HopperTowardsPlayer' | 'ShooterStatic' | 'TurretAim' | 'ChaseHorizontal' | 'SlimeCeiling' | 'GearWheel' | 'DropFromCeiling' | 'EmergeFromGround' | 'CustomBehavior';
export type EnemyAttackType = 'None' | 'DamageOnTouch' | 'ShooterStatic' | 'ProjectileEmitter' | 'MeleeBox' | 'ExplosionOnTouch';
export type EnemyRenderMode = 'hardwareSprite' | 'softwareSprite' | 'hybrid';
export type EnemySpriteSize = '16x16' | '16x32' | '32x16' | '32x32';
export type EnemyLibraryScope = 'common' | 'perWorld' | 'boss';
export type SpawnParamSchemaType = 'byte' | 'int' | 'enum' | 'boolean';
export type SpawnParamExportSlot = 'p0' | 'p1' | 'p2' | 'p3';
export type EnemyBehaviorTransitionCondition = 'PlayerNear';

export interface EnemyBehaviorStateTransition {
  id: string;
  label?: string;
  condition: EnemyBehaviorTransitionCondition;
  toBehavior: EnemyBehaviorType;
  fromBehavior?: EnemyBehaviorType | 'Any';
  returnBehavior?: EnemyBehaviorType;
  rangeX: number;
  rangeY: number;
}

export interface SpawnParamSchemaItem {
  name: string;
  label?: string;
  type: SpawnParamSchemaType;
  default: number | string | boolean;
  min?: number;
  max?: number;
  values?: string[];
  exportParam: SpawnParamExportSlot;
}

export interface EnemyTemplate {
  templateId: string;
  name: string;
  category: EnemyCategory;
  behavior: { type: EnemyBehaviorType; requiresRoutine?: string };
  attack: { type: EnemyAttackType };
  spawnParamsSchema: SpawnParamSchemaItem[];
  requiredRoutines: string[];
  budget: { cpu: number; ram: number; sprites: number };
  renderPlaceholder?: { spriteSize: EnemySpriteSize; defaultAnimation: string };
  description?: string;
}

export interface EnemyAnimationDefinition {
  frames: number[];
  speed: number;
  loop: boolean;
}

export interface EnemyRenderRoleBinding {
  id: string;
  label: string;
  state?: string;
  behavior?: EnemyBehaviorType | 'Any';
  attack?: EnemyAttackType | 'Any';
  spriteId: string;
  animation: string;
  frames: number[];
  speed: number;
  loop: boolean;
  notes?: string;
}

export interface EnemyRenderConfig {
  renderMode: EnemyRenderMode;
  spriteId: string;
  palette: string;
  size: EnemySpriteSize;
  animations: Record<string, EnemyAnimationDefinition>;
  roles?: EnemyRenderRoleBinding[];
}

export interface EnemyHitboxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnemyHitboxes {
  body: EnemyHitboxRect;
  damage: EnemyHitboxRect;
  weak?: EnemyHitboxRect;
}

// ---------------------------------------------------------------------------
// MSX2 SCREEN 5 bitmap BOSS (see docs/msx/BOSS_SYSTEM_DESIGN.md)
// A BossDefinition is a reusable template; a screen references it from a placed
// `kind:'boss'` entity (the BossEncounter) and may override fields per instance.
// ---------------------------------------------------------------------------

/** What happens when the boss is defeated. */
export type Msx2BossDefeatAction =
  | { action: 'setFlag'; flag: string }
  | { action: 'giveKey'; count?: number }
  | { action: 'openDoor'; target: string }
  /** Opens a dialogue in the NPC text box; needs a `msx2dialogue` asset with lines. */
  | { action: 'showMessage'; dialogueAssetId: string }
  /**
   * Sends the player to another bitmap room, reusing the door transition.
   * `entryX`/`entryY` omitted = drop the player where they already stand.
   */
  | { action: 'changeScreen'; target: string; entryX?: number; entryY?: number };

/** An attack phase: the boss gets angrier as its HP drops. */
export interface Msx2BossPhase {
  id: string;
  /** This phase is active at or below this percentage of the boss's HP. */
  enterWhenHpBelowPercent: number;
  /** Frames between shots. */
  interval: number;
  projectileSpeed: number;
  /**
   * Path followed during this phase: a `msx2bosspath` asset id, `'none'` to
   * stand still, or empty to inherit the boss's default path.
   */
  pathId?: string;
}

/** A rectangle on the boss body, in boss-LOCAL pixels. */
export interface Msx2BossDamageZone {
  id: string;
  /** 'invulnerable' = armour (bullets die, no damage); otherwise a weak point. */
  type: 'weak_point' | 'invulnerable';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Hits per bullet on a weak point. */
  damageMultiplier: number;
}

/**
 * What the boss does when it reaches a path node. The list runs in order and
 * movement resumes when it ends, so a node is a little script: "stop here,
 * fire three times, carry on".
 */
export type Msx2BossPathAction =
  | { action: 'wait'; frames: number }
  /** `shootId` names a `msx2shoot` asset; empty = one bullet aimed at the player. */
  | { action: 'fire'; shootId?: string }
  | { action: 'setSpeed'; speed: number }
  | { action: 'setAnimFrame'; frame: number };

/**
 * A reusable shot pattern, authored once and fired from a path node (and later
 * from turrets and shoot'em up enemies).
 *
 * Bullets fly along a 16-point ring (k * 22.5 degrees), stored in the pool as an
 * 8.8 fixed-point velocity per axis. The AUTHORED direction stays on the 8
 * compass points and maps to the even ring slots: aiming only needs the sign of
 * each axis, which is far cheaper than a real angle, and the odd slots exist so
 * fans and radials can land between the compass points.
 */
export type Msx2ShootPattern = 'aimed' | 'linear' | 'spread' | 'radial';

/** Compass direction for `linear` shots, clockwise from up. */
export type Msx2ShootDirection =
  | 'up' | 'upRight' | 'right' | 'downRight'
  | 'down' | 'downLeft' | 'left' | 'upLeft';

export interface Msx2ShootDefinition {
  id: string;
  name: string;
  /**
   * 'aimed' points at the player (turret style); 'linear' always fires the same
   * way; 'spread' fans several bullets around the aim; 'radial' shares them out
   * around the whole circle.
   */
  pattern: Msx2ShootPattern;
  /** Bullets per wave. More than the bullet pool holds are dropped (with a build warning). */
  bulletCount: number;
  /** `linear` only: which way the bullets go. */
  direction: Msx2ShootDirection;
  /** Pixels per frame; 0 = inherit the attack phase's bullet speed. */
  speed: number;
  /**
   * `spread` only: angle between neighbouring bullets, in 22.5-degree ring steps.
   * 2 (the default) keeps the historical 45-degree fan; 1 gives a tight one.
   */
  spreadStep?: number;
  /**
   * Waves fired per trigger. Staggering a volley over several frames is what makes
   * a wide radial visible at all: every bullet is born at the boss centre, so a
   * single-frame ring runs straight into the V9938's 8-sprites-per-line limit.
   */
  burstCount?: number;
  /** Frames between the waves of a burst. Ignored when `burstCount` is 1. */
  burstInterval?: number;
}

/** How the boss travels along one segment of the path. */
export interface Msx2BossPathSegment {
  mode: 'linear' | 'sine' | 'spline';
  /** Sine only: peak excursion perpendicular to the segment, in pixels. */
  amplitude?: number;
  /** Sine only: full waves fitted along the segment. */
  frequency?: number;
}

export interface Msx2BossPathNode {
  id: string;
  /** Room pixels while authoring; baked as deltas, so the path is a reusable shape. */
  x: number;
  y: number;
  actions: Msx2BossPathAction[];
  /** How to travel FROM this node to the next one. Absent = straight line. */
  segment?: Msx2BossPathSegment;
}

/**
 * A reusable movement recipe: nodes joined by segments, with an action script on
 * each node. Referenced by a boss (and later by shoot'em up enemy waves), never
 * owned by one.
 */
export interface Msx2BossPath {
  id: string;
  name: string;
  nodes: Msx2BossPathNode[];
  /** Travel per body update. The boss body's 4px restore strips cap it at 2. */
  speedPxPerTick: number;
  loopMode: 'loop' | 'pingpong' | 'once';
  /**
   * 'path' silences the phase's automatic firing cadence so only the node
   * scripts shoot; 'auto' keeps the cadence and ignores `fire` nodes.
   */
  firing: 'auto' | 'path';
}

/**
 * One step of the Room Lock entry sequence, authored in the Boss editor.
 *
 * After the mandatory automatic walk to screen centre, the player is frozen
 * for these authored steps. Their order decides what they see: a dialogue
 * before the chain closes reads as a warning, after it reads as a taunt.
 */
export type Msx2BossRoomLockStep =
  /** Seal the room perimeter with `bossBarrierTileId`. */
  | {
      kind: 'closeBarrier';
      /** Reveal the chain as a horizontal top-to-bottom raster. */
      animated?: boolean;
      /** Horizontal pixel scanlines processed per frame (1..16, default 4). */
      linesPerFrame?: number;
      /** @deprecated Pre-raster name; its value is reused as linesPerFrame. */
      cellsPerFrame?: number;
    }
  /** Show an `msx2dialogue` asset and wait for the player to finish it. */
  | { kind: 'dialogue'; dialogueAssetId: string }
  /** Hold still for a beat, e.g. between the chain landing and the boss talking. */
  | { kind: 'wait'; frames: number };

export interface Msx2BossDefinition {
  id: string;
  name: string;
  /**
   * Body: a `msx2bitmapstamp` asset, composed into one rectangle and injected
   * into the shared world atlas by the generator, then blitted with V9938 HMMM.
   *
   * A stamp is the right unit for a boss: it is authored as one picture and the
   * boss is one picture. Atlas entries are not — importing a stamp into a room
   * splits it into 16x16 cells, so a body was never a single entry to point at,
   * and the same artwork got a different entry id in every room.
   */
  bossStampAssetId?: string;
  /**
   * Legacy body reference: an atlas entry id, resolved against the room the boss
   * is placed in. Still honoured for projects authored before stamps, and only
   * consulted when `bossStampAssetId` is empty.
   */
  bossAtlasEntryId: string;
  bossFrames: number;
  bossAnimDelay: number;
  bossHp: number;
  bossDamage: number;
  /** Body redraw cadence; bullets run on the other frames. */
  bossInterval: number;
  /**
   * How the body moves. 'static' = never moves (turret bosses that only shoot);
   * the patrols bounce between the bounds on that axis. Empty/undefined keeps
   * the movement authored on the placed entity.
   */
  bossMovement?: 'static' | 'patrolX' | 'patrolY' | 'patrolXY';
  /** Default `msx2bosspath` asset id; attack phases may override it. */
  bossPathId?: string;
  /** Patrol speed in px/frame; the 4px restore strips cap it at 2. */
  bossSpeed?: number;
  /** Travel distance from the spawn position, in px. 0 = use the room bounds. */
  bossRangePx?: number;
  /** Room Lock: 16x16 atlas tile that seals the room's empty perimeter cells. */
  bossBarrierTileId: string;
  /**
   * Room Lock: what happens, in order, when the player walks into the room.
   *
   * The player cannot move while these authored steps run, so a dialogue can
   * be read before the chain drops and the fight starts. An empty or missing
   * sequence still performs the mandatory walk, then seals the chain at once.
   */
  roomLockSequence?: Msx2BossRoomLockStep[];
  /** @deprecated Superseded by a `closeBarrier` step in {@link roomLockSequence}. */
  bossBarrierAnimated?: boolean;
  /** @deprecated Superseded by a `dialogue` step in {@link roomLockSequence}. */
  bossBarrierDialogueAssetId?: string;
  /**
   * @deprecated Never had an effect. It existed because atlas previews were
   * drawn with the room's stale palette instead of the world's shared one;
   * that is resolved in the editor now (see utils/msx2WorldPalette.ts).
   */
  bossBarrierPaletteAssetId?: string;
  /** 'sprite' = hardware sprites; 'bitmap' = HMMM blit (slow bombs / rockets). */
  bossProjectileKind: 'sprite' | 'bitmap';
  bossProjectileSpriteId: string;
  bossProjectileTileId: string;
  bossShootInterval: number;
  bossProjectileSpeed: number;
  bossProjectileDamage: number;
  bossPhases: Msx2BossPhase[];
  /** Weak points must be listed BEFORE the armour that contains them. */
  damageZones: Msx2BossDamageZone[];
  onDefeated: Msx2BossDefeatAction[];
}

export interface EnemyDefinition {
  enemyId: string;
  basedOnTemplate?: string;
  name: string;
  world: string | 'common';
  behaviorGroup: string;
  category: EnemyCategory;
  scope: EnemyLibraryScope;
  behavior: { type: EnemyBehaviorType; customRoutine?: string; stateTransitions?: EnemyBehaviorStateTransition[] };
  attack: {
    type: EnemyAttackType;
    projectileType?: string;
    fireRate?: number;
    maxProjectiles?: number;
    dropBombOnPlayerX?: boolean;
    bulletSpriteId?: string;
    /** TurretAim: inner/base round hardware sprite. Falls back to render.spriteId. */
    turretBaseSpriteId?: string;
    /** TurretAim: outer round hardware sprite that marks the aiming vector. */
    turretHeadSpriteId?: string;
    /** Distance in pixels between the two turret sprite centres. */
    turretMinSeparation?: number;
    /** Centre of the allowed aiming arc, degrees: 0=right, 90=down. */
    turretBaseAngle?: number;
    /** Total allowed aiming arc in degrees (0..360). */
    turretMaxAngle?: number;
    /** Bullet speed in pixels per frame. */
    bulletSpeed?: number;
  };
  render: EnemyRenderConfig;
  hitboxes: EnemyHitboxes;
  stats: { hp: number; damage: number; invulnerabilityFrames?: number; knockback?: number };
  sound: Record<string, string | null>;
  spawnParamsSchema: SpawnParamSchemaItem[];
  requiredRoutines: string[];
  budget: {
    cpu: number;
    sprites: number;
    ram: number;
    codePackage: string;
    graphicsPackage?: string;
    graphicsBank?: string;
    ramPackage?: string;
  };
  notes?: string;
}

export interface EnemySpawn {
  id: string;
  enemyId: string;
  x: number;
  y: number;
  params: Record<string, number | string | boolean>;
}

export interface PlayerEntry {
  id: string;
  x: number;
  y: number;
  facing: Exclude<FacingDirection, 'neutral'>;
  playerId?: string;
}

/**
 * Represents an instance of an entity placed on a screen map.
 */
export interface EntityInstance {
  /** A unique identifier for this specific instance. */
  id: string;
  /** The ID of the EntityTemplate this instance is based on. */
  entityTemplateId: string;
  /** The display name for this instance. */
  name: string;
  /**
   * Entity job execution rate in percent.
   * Supported UI values: 100, 50, 33, 25.
   * 100 means every frame.
   */
  jobRate?: number;
  /**
   * Entry slot within the selected job period window.
   * Example: jobRate 50 -> valid entries 0..1.
   */
  jobEntry?: number;
  /** A map of component property overrides for this instance. */
  componentOverrides: Record<string, Record<string, any>>;
  /** The position of the instance on the screen map, in cells. */
  position: { x: number; y: number };
}
// --- End ECS Core Types ---

// --- Effect Zone Types ---
/**
 * Legacy bitmask definitions kept only to infer effect types from old projects.
 * New data should use `effectType + params`.
 */
export const LEGACY_EFFECT_ZONE_FLAGS = {
  water: { bit: 0, label: "Water Effect", maskValue: 0b00000001, color: 'rgba(50, 100, 200, 0.4)' },
  customGravity: { bit: 1, label: "Custom Gravity", maskValue: 0b00000010, color: 'rgba(150, 50, 200, 0.4)' },
  icePhysics: { bit: 2, label: "Ice Physics", maskValue: 0b00000100, color: 'rgba(100, 200, 255, 0.4)' },
  spriteConceal: { bit: 3, label: "Sprite Concealment", maskValue: 0b00001000, color: 'rgba(100, 100, 100, 0.4)' },
} as const;

/** Supported runtime effect categories for rectangular effect zones. */
export const EFFECT_ZONE_TYPE_CONFIG = {
  secretZone: { label: "Secret Zone", color: 'rgba(255, 209, 102, 0.38)' },
  wind: { label: "Wind", color: 'rgba(91, 192, 235, 0.34)' },
  water: { label: "Water", color: 'rgba(50, 100, 200, 0.4)' },
  customGravity: { label: "Custom Gravity", color: 'rgba(150, 50, 200, 0.4)' },
  icePhysics: { label: "Ice Physics", color: 'rgba(100, 200, 255, 0.4)' },
  spriteConceal: { label: "Sprite Concealment", color: 'rgba(100, 100, 100, 0.4)' },
} as const;

export type EffectType = keyof typeof EFFECT_ZONE_TYPE_CONFIG;
export type EffectZoneLegacyFlagKey = keyof typeof LEGACY_EFFECT_ZONE_FLAGS;
export type WindEffectDirection = 'left' | 'right' | 'up' | 'down';

export interface WindEffectZoneParams {
  direction: WindEffectDirection;
  strength: number;
}

export type EffectZoneParams = Record<string, any>;

export const DEFAULT_WIND_EFFECT_ZONE_PARAMS: WindEffectZoneParams = {
  direction: 'right',
  strength: 1,
};

export const getDefaultEffectZoneParams = (effectType: EffectType): EffectZoneParams => {
  switch (effectType) {
    case 'wind':
      return { ...DEFAULT_WIND_EFFECT_ZONE_PARAMS };
    default:
      return {};
  }
};

export const normalizeEffectZoneParams = (effectType: EffectType, params?: Record<string, any>): EffectZoneParams => {
  const source = params || {};
  if (effectType === 'wind') {
    const allowedDirections: WindEffectDirection[] = ['left', 'right', 'up', 'down'];
    const rawDirection = typeof source.direction === 'string' ? source.direction : DEFAULT_WIND_EFFECT_ZONE_PARAMS.direction;
    const direction = allowedDirections.includes(rawDirection as WindEffectDirection)
      ? rawDirection as WindEffectDirection
      : DEFAULT_WIND_EFFECT_ZONE_PARAMS.direction;
    const rawStrength = typeof source.strength === 'number' ? source.strength : parseInt(String(source.strength ?? ''), 10);
    return {
      direction,
      strength: Number.isFinite(rawStrength) ? Math.max(0, rawStrength) : DEFAULT_WIND_EFFECT_ZONE_PARAMS.strength,
    };
  }
  return {};
};

export const resolveEffectZoneType = (zone: { effectType?: EffectType; mask?: number }): EffectType => {
  if (zone.effectType && zone.effectType in EFFECT_ZONE_TYPE_CONFIG) {
    return zone.effectType;
  }

  const mask = zone.mask ?? 0;
  if ((mask & LEGACY_EFFECT_ZONE_FLAGS.water.maskValue) !== 0) return 'water';
  if ((mask & LEGACY_EFFECT_ZONE_FLAGS.customGravity.maskValue) !== 0) return 'customGravity';
  if ((mask & LEGACY_EFFECT_ZONE_FLAGS.icePhysics.maskValue) !== 0) return 'icePhysics';
  if ((mask & LEGACY_EFFECT_ZONE_FLAGS.spriteConceal.maskValue) !== 0) return 'spriteConceal';
  return 'secretZone';
};

/**
 * Represents a rectangular area on a screen map that can apply special effects.
 */
export interface EffectZone {
  /** A unique identifier for the effect zone. */
  id: string;
  /** The name of the effect zone. */
  name: string;
  /** The rectangular area of the zone, in grid cells. */
  rect: { x: number; y: number; width: number; height: number };
  /** Explicit type describing how the zone behaves at runtime. */
  effectType?: EffectType;
  /** Optional per-type configuration payload. */
  params?: EffectZoneParams;
  /** Legacy bitmask kept for backward compatibility with older projects. */
  mask?: number;
  /** A description of the effect zone's purpose. */
  description?: string;
}
// --- End Effect Zone Types ---

/** Export strategy for block-based screen optimization. */
export type ScreenBlockExportMode = 'raw' | 'blocks2x2' | 'blocks4x4';

/** Source used to build the runtime behavior/collision map for a screen. */
export type ScreenBehaviorSource = 'collisionLayer' | 'backgroundChars';

/** High-level role of a screen in the game flow. */
export type ScreenKind = 'playable' | 'tutorial' | 'dialog' | 'cutscene';

/** Runtime update engine selected for a screen. Only one should run per screen. */
export type ScreenEngineKind = 'player' | 'fakePlayer' | 'maze' | 'shooter';

/** Optional build-time optimization settings for screen exports. */
export interface ScreenBlockOptimization {
  /** Background export strategy. `raw` preserves the current 32x24 tile stream. */
  backgroundMode?: ScreenBlockExportMode;
  /** Include this screen in the shared ROM block catalog group for its mode/TileBank. */
  sharedCatalogEnabled?: boolean;
}

/** Optional behavior generation settings for a screen. */
export interface ScreenBehaviorConfig {
  /** Chooses whether behavior comes from the legacy collision layer or from background chars. */
  source?: ScreenBehaviorSource;
}

/**
 * Represents a screen map asset, containing tile layers and entity instances.
 */
export interface ScreenMap {
  /** A unique identifier for the screen map. */
  id: string;
  /** The name of the screen map. */
  name: string;
  /** The width of the map in tiles. */
  width: number;
  /** The height of the map in tiles. */
  height: number;
  /** High-level role of this screen: gameplay, tutorial/dialog, or cutscene. */
  screenKind?: ScreenKind;
  /** Runtime engine for this screen. Playable screens use Player; tutorial/dialog/cutscene use FakePlayer. */
  screenEngine?: ScreenEngineKind;
  /** The different layers of the screen map. */
  layers: {
    background: ScreenLayerData;
    collision: ScreenLayerData;
    effects: ScreenLayerData;
    entities: EntityInstance[];
    enemySpawns?: EnemySpawn[];
  };
  /** Optional build-time export optimization settings. */
  blockOptimization?: ScreenBlockOptimization;
  /** Optional behavior generation settings. */
  behaviorConfig?: ScreenBehaviorConfig;
  /** An array of rectangular effect zones on the map. */
  effectZones?: EffectZone[];
  /** Boss placements assigned to this screen, using 8x8 char coordinates. */
  bossInstances?: BossInstance[];
  /** The x-coordinate of the active (playable) area of the map. */
  activeAreaX?: number;
  /** The y-coordinate of the active (playable) area of the map. */
  activeAreaY?: number;
  /** The width of the active (playable) area of the map. */
  activeAreaWidth?: number;
  /** The height of the active (playable) area of the map. */
  activeAreaHeight?: number;
  /** The HUD configuration for this screen. */
  hudConfiguration?: HUDConfiguration;
  /** MSX Screen 2 sector configuration for TileBank/Font assignment per 8-line sector. */
  screenSectors?: {
    sector0?: HUDScreenSector;
    sector1?: HUDScreenSector;
    sector2?: HUDScreenSector;
  };
  /** The TileBank asset ID used by this screen (SCREEN 2 mode only). Contains all 3 banks internally. */
  tileBankAssetId?: string;
  /** Background color for MSX VDP (index 0-15). */
  backgroundColor?: number;
  /** Border color for MSX VDP (index 0-15). */
  borderColor?: number;
}

/** A type representing the possible layer names in the screen editor. */
export type ScreenEditorLayerName = keyof ScreenMap['layers'] | 'entities' | 'enemySpawns' | 'effects' | 'bosses';

/**
 * Represents the data copied to the buffer when cloning a screen grid.
 */
export interface CopiedScreenData {
  /** The tile data for the background, collision, and effects layers. */
  layers: {
    background: ScreenLayerData;
    collision: ScreenLayerData;
    effects: ScreenLayerData;
  };
  /** Optional build-time export optimization settings copied with the screen. */
  blockOptimization?: ScreenBlockOptimization;
  /** Optional behavior generation settings copied with the screen. */
  behaviorConfig?: ScreenBehaviorConfig;
  /** High-level role copied with the screen. */
  screenKind?: ScreenKind;
  /** Runtime engine copied with the screen. */
  screenEngine?: ScreenEngineKind;
  /** The effect zones within the copied area. */
  effectZones?: EffectZone[];
  /** Boss placements copied with the screen. */
  bossInstances?: BossInstance[];
  /** The x-coordinate of the copied active area. */
  activeAreaX: number;
  /** The y-coordinate of the copied active area. */
  activeAreaY: number;
  /** The width of the copied active area. */
  activeAreaWidth: number;
  /** The height of the copied active area. */
  activeAreaHeight: number;
  /** The HUD configuration of the copied screen. */
  hudConfiguration?: HUDConfiguration;
  /** A list of tile assets referenced by the copied data. */
  referencedTiles: Tile[];
}

/**
 * Represents the data copied to the buffer when copying a single layer.
 */
export interface CopiedLayerData {
  /** The name of the layer that was copied. */
  layerName: 'background' | 'collision' | 'effects';
  /** The tile data of the copied layer. */
  data: ScreenLayerData;
}

/** A type representing the cardinal directions for world map connections. */
export type ConnectionDirection = 'north' | 'south' | 'east' | 'west';
export type WorldMapTransitionMode =
  | 'preserve_y_validated'
  | 'preserve_x_validated'
  | 'fixed_entry'
  | 'door_entry'
  | 'ladder_entry'
  | 'checkpoint_entry';
export type WorldMapTransitionBlockedAction = 'deny' | 'safe_entry';

/**
 * Represents a single screen node in a world map graph.
 */
export interface WorldMapScreenNode {
  /** A unique identifier for the node. */
  id: string;
  /** The ID of the screen map asset this node represents. */
  screenAssetId: string;
  /** The name of the node. */
  name: string;
  /** The position of the node in the world map editor. */
  position: { x: number; y: number };
  /** An optional zone identifier for the node. */
  zone?: string;
}

/**
 * Represents a connection between two screen nodes in a world map.
 */
export interface WorldMapConnection {
  /** A unique identifier for the connection. */
  id: string;
  /** The ID of the starting node. */
  fromNodeId: string;
  /** The ID of the ending node. */
  toNodeId: string;
  /** The direction of the connection from the starting node. */
  fromDirection: ConnectionDirection;
  /** The direction of the connection to the ending node. */
  toDirection: ConnectionDirection;
  /** How player coordinates are resolved when moving through this connection. */
  transitionMode?: WorldMapTransitionMode;
  /** What to do when the resolved destination hitbox is blocked. */
  ifBlocked?: WorldMapTransitionBlockedAction;
  /** Optional named PlayerEntry for fixed/door/ladder/checkpoint transitions. */
  entryId?: string;
  /** Optional fixed entry coordinates in pixels until named PlayerEntry assets are available. */
  entryPoint?: { x: number; y: number };
}

/**
 * Represents a world map graph, connecting multiple screen maps.
 */
export interface WorldMapGraph {
  /** A unique identifier for the world map. */
  id: string;
  /** The name of the world map. */
  name: string;
  /** Shared MSX2 palette asset loaded once when entering this world. */
  paletteAssetId?: string;
  /** An array of all screen nodes in the map. */
  nodes: WorldMapScreenNode[];
  /** An array of all connections between nodes. */
  connections: WorldMapConnection[];
  /** The ID of the starting screen node for the world map. */
  startScreenNodeId: string | null;
  /** The size of the grid cells in the editor. */
  gridSize: number;
  /** The current zoom level of the editor. */
  zoomLevel: number;
  /** The current pan offset of the editor. */
  panOffset: { x: number; y: number };
}

/**
 * Represents a single step in a PSG sound channel's sequence.
 */
export interface PSGSoundChannelStep {
  /** A unique identifier for the step. */
  id: string;
  /** The tone period for the PSG. */
  tonePeriod: number;
  /** The volume for the PSG channel (0-15). */
  volume: number;
  /** Whether the tone is enabled for this step. */
  toneEnabled: boolean;
  /** Whether the noise is enabled for this step. */
  noiseEnabled: boolean;
  /** Whether to use the hardware envelope for this step. */
  useEnvelope: boolean;
  /** The envelope shape to use when useEnvelope is true (0-15). Optional, defaults to global envelope shape. */
  envelopeShape?: number;
  /** The duration of the step in milliseconds. */
  durationMs: number;
}

/**
 * Represents the state and sequence for a single PSG channel (A, B, or C).
 */
export interface PSGSoundChannelState {
  /** The channel identifier. */
  id: 'A' | 'B' | 'C';
  /** An array of steps for this channel's sequence. */
  steps: PSGSoundChannelStep[];
  /** Whether the channel's sequence should loop. */
  loop: boolean;
}

/**
 * Represents a complete PSG sound effect asset.
 */
export interface PSGSoundData {
  /** A unique identifier for the sound effect. */
  id: string;
  /** The name of the sound effect. */
  name: string;
  /** The tempo of the sound effect in beats per minute. */
  tempoBPM: number;
  /** An array of the three PSG channel states. */
  channels: [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
  /** The noise period for the PSG. */
  noisePeriod: number;
  /** The hardware envelope period for the PSG. */
  envelopePeriod: number;
  /** The hardware envelope shape for the PSG. */
  envelopeShape: number;
  /** The master volume for the sound effect. */
  masterVolume: number;
}

/** A type representing the PSG channel identifiers in the tracker. */
export type PT3ChannelId = 'A' | 'B' | 'C';

/** A type representing the SCC channel identifiers in the tracker. */
export type SCCChannelId = '1' | '2' | '3' | '4' | '5';

/** A type representing any channel identifier in the tracker. */
export type TrackerChannelId = PT3ChannelId | SCCChannelId;

/** Compatibility mode for PT3 hardware-envelope slide accumulation. */
export type PT3EnvelopeSlideMode = 'pt3-legacy-8bit' | 'corrected-16bit';

/** One decoded four-byte ProTracker 3 sample line. */
export interface PT3SampleStep {
  /** Original PT3 bytes (C, B, tone low, tone high), kept for lossless round-trips. */
  raw: [number, number, number, number];
  volume: number;
  amplitudeSlide: -1 | 0 | 1;
  /** Signed raw AY tone-period delta, not a semitone offset. */
  tonePeriodOffset: number;
  accumulateTone: boolean;
  toneEnabled: boolean;
  noiseEnabled: boolean;
  hardwareEnvelopeEnabled: boolean;
  /** Signed envelope delta when E is active; otherwise the PT3 noise offset. */
  noiseOrEnvelopeOffset: number;
  accumulateNoiseOrEnvelope: boolean;
}

/** Native Mideas representation of a tick-programmed PT3 sample. */
export interface PT3SampleMacro {
  loop: number;
  steps: PT3SampleStep[];
  envelopeSlideMode: PT3EnvelopeSlideMode;
  sourceSampleId?: number;
  sourcePointer?: number;
}

/**
 * Represents a PT3 instrument (PSG).
 */
export interface PT3Instrument {
  /** The instrument's ID (1-31). */
  id: number;
  /** The name of the instrument. */
  name: string;
  /** Chip this instrument targets. Optional for legacy songs (PSG assumed);
   *  dual-chip songs tag every instrument so channel groups only offer their own. */
  chip?: 'PSG' | 'SCC';
  /** An array of volume envelope points. */
  volumeEnvelope?: number[];
  /** An array of tone envelope points (pitch offsets). */
  toneEnvelope?: number[];
  /** An array of noise envelope points (AY noise period 0-31 per step). */
  noiseEnvelope?: number[];
  /** The loop position for the volume envelope. */
  volumeLoop?: number;
  /** The loop position for the tone envelope. */
  toneLoop?: number;
  /** The loop position for the noise envelope. */
  noiseLoop?: number;
  /** (Not implemented) Sample data for the instrument. */
  sampleData?: any;
  /** Selects the backwards-compatible envelope engine or the exact PT3 step engine. */
  instrumentMode?: 'legacy-envelopes' | 'pt3-sample';
  /** Exact per-tick PT3 sample program when instrumentMode is pt3-sample. */
  pt3Sample?: PT3SampleMacro;
  /** The AY hardware envelope shape (0-15). */
  ayEnvelopeShape?: number;
  /** Whether the AY noise channel is enabled for this instrument. */
  ayNoiseEnabled?: boolean;
  /** Whether the AY tone channel is enabled for this instrument. */
  ayToneEnabled?: boolean;
  /** The base noise frequency (0-31) for this instrument. Overrides global setting if present. */
  noiseBaseFrequency?: number;
  /** The fixed hardware envelope period (0-65535) for this instrument. Overrides global setting if present. */
  hardwareEnvelopePeriod?: number;
  /** If set, the hardware envelope period tracks the note pitch with this ratio (e.g., 1.0, 2.0). */
  hardwareEnvelopeRatio?: number;
}

/**
 * Represents an SCC wavetable instrument.
 */
export interface SCCInstrument {
  /** The instrument's ID (1-31). */
  id: number;
  /** The name of the instrument. */
  name: string;
  /** Chip this instrument targets. Optional for legacy songs (SCC implied by
   *  the waveform); dual-chip songs tag every instrument explicitly. */
  chip?: 'PSG' | 'SCC';
  /** 32-byte wavetable data. Each value should be between -128 and 127. */
  waveform: number[];
  /** Optional volume for the instrument (0-15). */
  volume?: number;
  /** An array of volume envelope points. */
  volumeEnvelope?: number[];
  /** The loop position for the volume envelope. */
  volumeLoop?: number;
  /** Vibrato amplitude 0=off..5=strong (triangle LFO on the note period). */
  vibratoDepth?: number;
  /** Vibrato phase increment per frame (LFO speed, e.g. 8-32). */
  vibratoSpeed?: number;
  /** Frames to hold after note-on before vibrato begins. */
  vibratoDelay?: number;
  /** Noise mode: the driver rewrites the channel waveform with pseudo-random
   *  bytes every frame while a note is active (real white noise). */
  noiseMode?: boolean;
  /** Morph target waveform (32 samples, -128..127). When set with morphSpeed,
   *  every note-on morphs from the base waveform to this one in 16 steps. */
  morphToWaveform?: number[];
  /** Frames between morph steps (1-255). Total morph = 16 * morphSpeed frames. */
  morphSpeed?: number;
}

/**
 * Represents a PT3 ornament.
 */
export interface PT3Ornament {
  /** The ornament's ID (1-15). */
  id: number;
  /** The name of the ornament. */
  name: string;
  /** An array of pitch offsets. */
  data: number[];
  /** The loop position for the ornament data. */
  loopPosition?: number;
  /** Absolute byte pointer in the original PT3 module, when source-decoded. */
  sourcePointer?: number;
}

/**
 * Represents a single cell in a tracker pattern.
 */
export interface TrackerCell {
  /** The note to play (e.g., "C#5"). */
  note: string | null;
  /** The ID of the instrument to use. */
  instrument: number | null;
  /** The ID of the ornament to apply. */
  ornament: number | null;
  /** The volume for this step (0-15). */
  volume: number | null;
  /** Vortex/PT3 effect command nibble (0..F). Native songs edit this in FX. */
  effectCommand?: number | null;
  /** Raw Vortex command payload as uppercase hexadecimal bytes (CMD column). */
  effectParams?: string | null;
}

/**
 * Represents a single row in a tracker pattern, containing cells for each channel.
 */
export interface TrackerRow {
  [key: string]: TrackerCell;
}

/** One deferred PT3/Vortex command attached to a pattern row. The raw
 * parameters are kept so the source module can be inspected without reducing
 * its semantics to Mideas' legacy tracker model. */
export interface PT3PatternEffectCommand {
  code: number;
  name: 'GLISS' | 'PORTA' | 'SAMPLE_POS' | 'ORNAMENT_POS' | 'VIBRATO' | 'ENV_SLIDE' | 'DELAY' | 'NOP';
  params: number[];
  display: string;
}

/** Source-map information for a decoded PT3 channel row. */
export interface PT3PatternCellSource {
  /** True when PTDECOD consumed commands on this row; false for a note-skip hold row. */
  decoded: boolean;
  /** Offset of the one-byte note/release/D0 row terminator in externalPt3Data. */
  commandOffset?: number;
  noteSkip: number;
  effects: PT3PatternEffectCommand[];
  /** Compact Vortex-style commands such as N08, ENV A:1234 or SPD 03. */
  events: string[];
  /** Original row commands excluding B1 note-skip and the terminal note/D0. */
  prefixBytes: number[];
  /** Exact deferred SPCCOMS payload stored after the row terminator. */
  deferredPayloadBytes: number[];
}

/**
 * Represents a single pattern in a tracker song.
 */
export interface TrackerPattern {
  /** A unique identifier for the pattern. */
  id: string;
  /** The name of the pattern. */
  name: string;
  /** The number of rows in the pattern. */
  numRows: number;
  /** An array of rows that make up the pattern. */
  rows: TrackerRow[];
  /** Byte/source metadata present on patterns decoded from an original PT3. */
  pt3SourceRows?: Array<Partial<Record<'A' | 'B' | 'C', PT3PatternCellSource>>>;
}

/**
 * Represents a complete tracker song asset.
 */
export interface TrackerSongData {
  /** A unique identifier for the song. */
  id: string;
  /** The name of the song asset. */
  name: string;
  /** Playback backend used by the music asset. */
  playbackBackend?: 'native' | 'external-pt3';
  /** The sound chip to target. 'PSG+SCC' = dual-chip song: channels A-C on the
   *  PSG plus channels 1-5 on the SCC, like real Konami SCC games. */
  soundChip: 'PSG' | 'SCC' | 'PSG+SCC';
  /** Dual-chip songs only: when false, the SCC channels 1-5 are inactive
   *  (collapsed in the editor, skipped on export). Defaults to true. */
  sccEnabled?: boolean;
  /** The display title of the song. */
  title?: string;
  /** The author of the song. */
  author?: string;
  /** The beats per minute of the song. */
  bpm: number;
  /** The speed of the song in ticks per row. */
  speed: number;
  /** The global volume of the song (0-15). */
  globalVolume: number;
  /** An array of all patterns in the song. */
  patterns: TrackerPattern[];
  /** An array of pattern indices defining the song's order. */
  order: number[];
  /** The total length of the song in patterns. */
  lengthInPatterns: number;
  /** The position in the order list where the song will loop. */
  restartPosition: number;
  /** An array of all instruments used in the song. */
  instruments: (PT3Instrument | SCCInstrument)[];
  /** An array of all ornaments used in the song. */
  ornaments: PT3Ornament[];
  /** The AY hardware envelope period. */
  ayHardwareEnvelopePeriod?: number;
  /** The AY noise generator period (0-31). */
  ayNoisePeriod?: number;
  /** The currently active pattern index in the order list. */
  currentPatternIndexInOrder: number;
  /** The ID of the currently active pattern. */
  currentPatternId?: string;
  /** The calculated total length of the song in ticks. */
  currentSongLengthTicks?: number;
  /** Optional raw PT3 data (full file or headerless payload) for external PT3 playback. */
  externalPt3Data?: number[];
  /** Whether the external PT3 payload still includes the standard 100-byte PT3 header. */
  externalPt3HasHeader?: boolean;
  /** Reference implementation selected for the external PT3 player integration. */
  externalPt3PlayerId?: 'msxgl-pt3' | 'custom';
}

/**
 * Represents the mapping of a keyboard key to a musical note.
 */
export interface PianoKeyLayoutEntry {
  /** The index of the note name (0-11). */
  noteNameIndex: number;
  /** The base octave for the note. */
  baseOctave: number;
}

/**
 * Represents the rectangular area on the screen covered by a tile bank.
 */
export interface TileBankScreenZone {
  /** The x-coordinate of the zone's top-left corner, in cells. */
  x: number;
  /** The y-coordinate of the zone's top-left corner, in cells. */
  y: number;
  /** The width of the zone, in cells. */
  width: number;
  /** The height of the zone, in cells. */
  height: number;
}

/**
 * Represents the assignment of a tile to a specific character code within a bank.
 */
export interface TileAssignment {
  /** The ID of the tile asset. */
  tileId: string;
  /** The character code assigned to the tile. */
  charCode: number;
}

export interface TileBankOptimizedChar {
  /** Local 8x8 character index inside the tile, row-major. */
  charIndex: number;
  /** Physical MSX character code used by this local character. */
  charCode: number;
  /** Stable visual/logical signature used for deduplication. */
  signature: string;
  /** Whether the visual pattern is empty. */
  isEmpty?: boolean;
}

export interface TileBankTileAssignment {
  /** Base or first physical character code assigned to the tile. */
  charCode: number;
  /** Direct local-char-index -> physical character code map for optimized assignments. */
  charMap?: number[];
  /** Marks assignments produced by the tile bank optimizer. */
  optimized?: boolean;
  /** Metadata for the unique physical chars materialized by this tile assignment. */
  optimizedChars?: TileBankOptimizedChar[];
}

export interface TileBankFontAssignment {
  charCode: number;
  fontCharacters: { character: string; bankCharCode: number; originalCharCode: number }[];
}

/**
 * Represents a single tile bank for managing SCREEN 2 character sets and colors.
 */
export interface TileBankDefinition {
  /** A unique identifier for the tile bank. */
  id: string;
  /** The name of the tile bank. */
  name: string;
  /** The starting address in VRAM for the pattern data. */
  vramPatternStart: number;
  /** The starting address in VRAM for the color data. */
  vramColorStart: number;
  /** The rectangular area on the screen this bank applies to. */
  screenZone: TileBankScreenZone;
  /** The starting character code for this bank's charset. */
  charsetRangeStart: number;
  /** The ending character code for this bank's charset. */
  charsetRangeEnd: number;
  /** The default foreground color index for tiles in this bank. */
  defaultFgColorIndex: number;
  /** The default background color index for tiles in this bank. */
  defaultBgColorIndex: number;
  /** Whether the bank's configuration is locked. */
  isLocked: boolean;
  /** Whether the bank is currently enabled. */
  enabled?: boolean;
  /** A record of tiles assigned to this bank, mapping tile ID to assignment data. */
  assignedTiles: Record<string, TileBankTileAssignment | TileBankFontAssignment>;
}

/**
 * Represents a complete tile bank configuration asset containing all 3 Screen 2 banks.
 */
export interface TileBank {
  /** A unique identifier for the tile bank asset. */
  id: string;
  /** The name of the tile bank asset. */
  name: string;
  /** The three banks that make up Screen 2 (banks 0, 1, 2). */
  banks: TileBankDefinition[];
}

/**
 * Represents a behavior script asset.
 */
export interface BehaviorScript {
  /** A unique identifier for the script. */
  id: string;
  /** The name of the script file. */
  name: string;
  /** The Z80 assembly code for the script. */
  code: string;
}

/**
 * Represents a single attack that a boss can perform.
 */
export interface BossAttack {
  /** A unique identifier for the attack. */
  id: string;
  /** The name of the attack. */
  name: string;
  /** The type of the attack. */
  type: 'Projectile' | 'Boomerang' | 'Rock' | 'Laser' | 'Meteor' | 'Bomb' | 'SineWave' | 'HomingMissile' | 'SlamRocks' | 'FallingBlocks' | 'Melee' | 'Special' | 'Pattern';
  /** The ID of the sprite asset used for the attack's projectile. */
  spriteAssetId?: string;
  /** The ID of the sound effect asset for the attack. */
  soundEffectAssetId?: string;
  /** The amount of damage the attack inflicts. */
  damage: number;
  /** The speed of the attack's projectile. */
  speed?: number;
  /** The projectile travel direction for boss preview/runtime exports. */
  projectileDirection?: 'left' | 'right' | 'up' | 'down';
  /** Horizontal projectile spawn offset from the boss center, in pixels. */
  spawnOffsetX?: number;
  /** Vertical projectile spawn offset from the boss center, in pixels. */
  spawnOffsetY?: number;
  /** Maximum projectile travel distance, in pixels. */
  range?: number;
  /** Arc height in pixels for parabolic attacks such as rocks. */
  arcHeight?: number;
  /** Perpendicular wave amplitude in pixels for sine-wave projectile attacks. */
  waveAmplitude?: number;
  /** Frames per wave phase step for sine-wave projectile attacks. */
  waveFrequencyFrames?: number;
  /** Per-frame steering strength for homing missile attacks. */
  homingTurnStep?: number;
  /** Tile/char asset used to draw a boss laser beam. */
  laserTileAssetId?: string;
  /** Beam length in 8x8 chars for char-based laser attacks. */
  laserLengthChars?: number;
  /** Frames that a laser beam stays active within its cooldown cycle. */
  laserDurationFrames?: number;
  /** The duration of the attack. */
  duration?: number;
  /** The cooldown period after the attack. */
  cooldown?: number;
  /** Number of meteors spawned by a meteor attack. */
  meteorCount?: number;
  /** Horizontal spacing between meteor lanes, in pixels. */
  meteorSpreadX?: number;
  /** Warning frames shown before meteors start falling. */
  meteorWarningFrames?: number;
  /** Number of chars the boss rises before a SlamRocks impact. */
  slamRiseChars?: number;
  /** Frames spent in the raised telegraph pose for SlamRocks. */
  slamWindupFrames?: number;
  /** Frames spent dropping back to the floor for SlamRocks. */
  slamFrames?: number;
  /** Frames to hold on the floor before rocks start falling for SlamRocks. */
  slamHoldFrames?: number;
  /** Tile/char asset written into the screen when a falling block lands. */
  blockTileAssetId?: string;
  /** 8x8 char row where falling blocks become solid screen chars. */
  landingYChar?: number;
  /** Number of bombs spawned by a bomb attack. */
  bombCount?: number;
  /** Horizontal spacing between bomb spawn points, in pixels. */
  bombSpreadX?: number;
  /** Frames before a spawned bomb explodes. */
  bombFuseFrames?: number;
  /** Explosion radius in pixels for preview/runtime collision helpers. */
  explosionRadius?: number;
  /** Frames that the explosion stays active. */
  explosionDurationFrames?: number;
  /** Optional sprite asset shown while the bomb is exploding. */
  explosionSpriteAssetId?: string;
}

/**
 * Represents a weak point on a boss phase.
 */
export interface BossPhaseWeakPoint {
  /** The x-coordinate of the weak point, in tiles. */
  x: number;
  /** The y-coordinate of the weak point, in tiles. */
  y: number;
  /** Damage applied to the boss when this weak point is hit. */
  health: number;
  /** The ID of the sprite to show when the weak point is hit. */
  hitSpriteId?: string;
  /** The ID of the tile to replace the weak point with when destroyed. */
  destroyedTileId?: string;
}

/**
 * A tile coordinate that belongs to an ordered boss neck chain.
 * Segment 0 is the leading tile; each following segment is driven by the
 * previous segment's movement with a configurable delay.
 */
export interface BossNeckSegment {
  /** The x-coordinate of the neck tile, in boss phase tiles. */
  x: number;
  /** The y-coordinate of the neck tile, in boss phase tiles. */
  y: number;
}

/**
 * Defines tile-chain movement for bosses made from background tiles.
 */
export interface BossNeckChain {
  /** Enables or disables the neck-chain movement in this phase. */
  enabled: boolean;
  /** Ordered vector of neck tiles. First tile leads, later tiles follow. */
  segments: BossNeckSegment[];
  /** Maximum horizontal displacement applied to the leading tile, in pixels. */
  amplitudeX: number;
  /** Maximum vertical displacement applied to the leading tile, in pixels. */
  amplitudeY: number;
  /** Animation speed multiplier for the leading tile. */
  speed: number;
  /** Delay in frames between one segment and the next. */
  segmentDelayFrames: number;
  /** How much movement is preserved by each follower segment, 0-1. */
  followStrength: number;
}

/**
 * Defines a boss slam/crush movement for one phase.
 */
export interface BossCrushMovement {
  /** Enables or disables the crush movement in this phase. */
  enabled: boolean;
  /** Direction where the boss moves during the crush. */
  direction: 'down' | 'up' | 'left' | 'right';
  /** Maximum displacement in pixels. */
  distance: number;
  /** Frames spent telegraphing before the fast crush movement starts. */
  windupFrames: number;
  /** Frames spent moving toward the crush target. */
  slamFrames: number;
  /** Frames held at maximum displacement. */
  holdFrames: number;
  /** Frames spent returning to the origin. */
  returnFrames: number;
  /** Extra frames before the cycle repeats. */
  cooldownFrames: number;
}

export interface BossForm {
  /** Unique form ID inside a boss phase. */
  id: string;
  /** Display name for the visual pose/form. */
  name: string;
  /** Tile dimensions for this form. */
  dimensions: { width: number; height: number };
  /** Tile layout used by this form. */
  tileMatrix: (string | null)[][];
  /** Collision layout used by this form. */
  collisionMatrix?: (boolean)[][];
  /** Weak points active while this form is selected. */
  weakPoints?: BossPhaseWeakPoint[];
}

export type BossBehaviorTargetType = 'fixed' | 'playerCurrent' | 'playerPredicted' | 'playerLastKnown' | 'bossRelative';

export interface BossBehaviorTarget {
  /** How the behavior action resolves its target position. */
  type: BossBehaviorTargetType;
  /** Fixed target X coordinate in 8x8 chars. */
  xChar?: number;
  /** Fixed target Y coordinate in 8x8 chars. */
  yChar?: number;
  /** Player prediction distance in frames. */
  framesAhead?: number;
  /** Relative X offset from the boss, in chars. */
  dxChar?: number;
  /** Relative Y offset from the boss, in chars. */
  dyChar?: number;
}

export type BossBehaviorActionType = 'wait' | 'moveTo' | 'attack' | 'slam' | 'protect' | 'shield' | 'setForm' | 'animateForm' | 'loop';

interface BossBehaviorActionBase {
  /** Unique action ID for editor selection and reordering. */
  id: string;
  /** Visual/runtime action type. */
  type: BossBehaviorActionType;
  /** Optional editor label override. */
  label?: string;
}

export interface BossWaitBehaviorAction extends BossBehaviorActionBase {
  type: 'wait';
  frames: number;
}

export interface BossMoveToBehaviorAction extends BossBehaviorActionBase {
  type: 'moveTo';
  target: BossBehaviorTarget;
  durationFrames: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface BossAttackBehaviorAction extends BossBehaviorActionBase {
  type: 'attack';
  attackId?: string;
  target?: BossBehaviorTarget;
  delayAfterFrames?: number;
}

export interface BossSlamBehaviorAction extends BossBehaviorActionBase {
  type: 'slam';
  target: BossBehaviorTarget;
  direction?: 'left' | 'right' | 'up' | 'down' | 'target';
  distanceChars: number;
  windupFrames: number;
  slamFrames: number;
  holdFrames?: number;
  returnFrames: number;
}

export interface BossProtectBehaviorAction extends BossBehaviorActionBase {
  type: 'protect';
  enabled: boolean;
  durationFrames: number;
  damageReductionPercent?: number;
}

export interface BossShieldBehaviorAction extends BossBehaviorActionBase {
  type: 'shield';
  enabled: boolean;
  durationFrames: number;
  hp?: number;
  shieldAssetId?: string;
}

export interface BossSetFormBehaviorAction extends BossBehaviorActionBase {
  type: 'setForm';
  formId?: string;
}

export interface BossAnimateFormBehaviorAction extends BossBehaviorActionBase {
  type: 'animateForm';
  formIds: string[];
  frameDurationFrames: number;
  loops: number;
}

export interface BossLoopBehaviorAction extends BossBehaviorActionBase {
  type: 'loop';
  targetIndex: number;
}

export type BossBehaviorAction =
  | BossWaitBehaviorAction
  | BossMoveToBehaviorAction
  | BossAttackBehaviorAction
  | BossSlamBehaviorAction
  | BossProtectBehaviorAction
  | BossShieldBehaviorAction
  | BossSetFormBehaviorAction
  | BossAnimateFormBehaviorAction
  | BossLoopBehaviorAction;

/**
 * Represents a single phase of a boss fight.
 */
export interface BossPhase {
  /** A unique identifier for the phase. */
  id: string;
  /** The name of the phase. */
  name: string;
  /** The health threshold at which this phase begins. */
  healthThreshold: number;
  /** The method used to build the boss's appearance for this phase. */
  buildType: 'sprite' | 'tile';
  /** The ID of the sprite asset to use if buildType is 'sprite'. */
  spriteAssetId?: string;
  /** The dimensions of the boss in tiles, if buildType is 'tile'. */
  dimensions?: { width: number; height: number };
  /** The ID of the tile bank to use if buildType is 'tile'. */
  tileBankId?: string;
  /** A matrix of tile IDs representing the boss's appearance. */
  tileMatrix?: (string | null)[][];
  /** A matrix representing the collision map of the boss. */
  collisionMatrix?: (boolean)[][];
  /** An array of weak points for this phase. */
  weakPoints?: BossPhaseWeakPoint[];
  /** Optional visual forms/poses available within this phase. */
  forms?: BossForm[];
  /** Initial form ID used by behavior preview/runtime. */
  initialFormId?: string;
  /** Optional ordered neck tile chain for segmented boss movement. */
  neckChain?: BossNeckChain;
  /** Optional slam/crush movement for this boss phase. */
  crushMovement?: BossCrushMovement;
  /** Visual behavior loop executed by this phase. */
  behaviorLoop?: BossBehaviorAction[];
  /** An array of attack IDs that the boss will use in this phase. */
  attackSequence: BossAttack['id'][];
  /** A multiplier for the boss's speed in this phase. */
  speedMultiplier?: number;
  /** A multiplier for the boss's defense in this phase. */
  defenseMultiplier?: number;
}

/**
 * Represents a complete boss asset.
 */
export interface Boss {
  /** A unique identifier for the boss. */
  id: string;
  /** The name of the boss. */
  name: string;
  /** The total health of the boss. */
  totalHealth: number;
  /** An array of all phases for the boss fight. */
  phases: BossPhase[];
  /** An array indicating whether each phase is enabled. */
  phasesEnabled: boolean[];
  /** An array of all possible attacks the boss can use. */
  attacks: BossAttack[];
  /** The ID of the sprite to use for the boss's death explosion. */
  deathExplosionSpriteId?: string;
  /** The ID of the sound effect to play on death. */
  deathSoundId?: string;
  /** ASM runtime update interval in frames. 1 updates every frame; higher values reduce CPU/VRAM load at lower boss speed. */
  runtimeUpdateIntervalFrames?: number;
  /** The ID of the screen map where this boss appears. */
  linkedScreenId?: string | null;
  /** Editor-only boss start X coordinate for behavior/stage preview. */
  behaviorPreviewStartXChar?: number;
  /** Editor-only boss start Y coordinate for behavior/stage preview. */
  behaviorPreviewStartYChar?: number;
  /** Editor-only player X coordinate for behavior/stage preview target resolution. */
  behaviorPreviewPlayerXChar?: number;
  /** Editor-only player Y coordinate for behavior/stage preview target resolution. */
  behaviorPreviewPlayerYChar?: number;
}

/**
 * Represents a boss placement inside a screen map.
 * Coordinates are in 8x8 screen chars/tiles, matching SCREEN 2 name-table cells.
 */
export interface BossInstance {
  /** A unique identifier for this placed boss instance. */
  id: string;
  /** The boss asset ID to spawn. */
  bossAssetId: string;
  /** Boss anchor X coordinate in screen chars. */
  xChar: number;
  /** Boss anchor Y coordinate in screen chars. */
  yChar: number;
  /** Whether this placement is active in runtime exports. */
  enabled: boolean;
  /** Initial phase index to start from. */
  initialPhaseIndex?: number;
}

// --- Main Menu Types ---
/** Represents a single option in the main menu. */
export interface MainMenuOption {
  id: string;
  label: string;
  enabled: boolean;
}

/** Defines the key mappings for main menu navigation. */
export interface MainMenuKeyMapping {
  up: string;
  down: string;
  left: string;
  right: string;
  fire1: string;
  fire2: string;
}

/** Defines the settings for the main menu. */
export interface MainMenuSettings {
  volume: number; // 0-15
}

/** Defines the content for the "Continue" screen. */
export interface MainMenuContinueScreen {
  title: string;
  prompt: string;
}

/** Defines the content for the intro screen. */
export interface MainMenuIntroScreen {
  text: string;
  backgroundAssetId: string | null;
}

/**
 * Represents the complete configuration for the main menu.
 */
export interface MainMenuConfig {
  isEnabled: boolean;
  options: MainMenuOption[];
  keyMapping: MainMenuKeyMapping;
  settings: MainMenuSettings;
  continueScreen: MainMenuContinueScreen;
  introScreen: MainMenuIntroScreen;
  menuScreenAssetId: string | null;
  cursorSpriteAssetId: string | null;
  menuColors: {
    text: MSX1ColorValue;
    background: MSX1ColorValue;
    highlightText: MSX1ColorValue;
    highlightBackground: MSX1ColorValue;
    border?: MSX1ColorValue;
  };
}
// --- End Main Menu Types ---

// --- Presentation Screen Types ---
export interface PresentationScreenConversionConfig {
  dither: 'none';
  backgroundColorIndex: number;
  preferExistingPalette: boolean;
  twoColorsPer8PixelRow: boolean;
  deduplicatePatterns: boolean;
}

export interface PresentationScreenPreview {
  paletteIndices: number[];
  uniqueCharsPerBank: [number, number, number];
  totalUniqueChars: number;
  warning?: string | null;
}

export interface PresentationScreenData {
  nameTable: number[];
  patternBank0: number[];
  patternBank1: number[];
  patternBank2: number[];
  colorBank0: number[];
  colorBank1: number[];
  colorBank2: number[];
  patternCountBank0: number;
  patternCountBank1: number;
  patternCountBank2: number;
}

export interface PresentationScreenCompressionConfig {
  codec: 'ZX0';
  compressNameTable: boolean;
  compressPatterns: boolean;
  compressColors: boolean;
}

export interface PresentationScreenRuntimeConfig {
  showAtBoot: boolean;
  clearSpritesBeforeShow: boolean;
  waitForKey: boolean;
  waitForFrames: number;
  romDataGroup: 'auto' | 'default' | 'page0';
}

export type PresentationScreenBankIndex = 0 | 1 | 2;
export type PresentationScreenEditMode = 'single' | 'shared';

export interface PresentationScreenCellCoordinate {
  x: number;
  y: number;
}

export interface PresentationScreenCellInfo {
  x: number;
  y: number;
  bank: PresentationScreenBankIndex;
  charCode: number;
  charUsageCount: number;
  sharedCells: PresentationScreenCellCoordinate[];
}

export interface PresentationScreenEditableTile {
  cell: PresentationScreenCellCoordinate;
  bank: PresentationScreenBankIndex;
  charCode: number;
  charUsageCount: number;
  patternBytes: number[];
  colorBytes: number[];
}

export interface PresentationScreenConfig {
  enabled: boolean;
  name: string;
  sourceFileName: string | null;
  sourceImageWidth: number;
  sourceImageHeight: number;
  screenMode: 'SCREEN 2';
  paletteMode: 'MSX1';
  conversion: PresentationScreenConversionConfig;
  preview: PresentationScreenPreview;
  data: PresentationScreenData;
  compression: PresentationScreenCompressionConfig;
  runtime: PresentationScreenRuntimeConfig;
  updatedAt?: number | null;
  lastImportError?: string | null;
}
// --- End Presentation Screen Types ---

// --- MSX2 SCREEN 5 Presentation Types ---
export interface Msx2Screen5PresentationRuntimeConfig {
  showAtBoot: boolean;
  clearSpritesBeforeShow: boolean;
  waitForKey: boolean;
  waitForFrames: number;
  vramPage: 0 | 1;
  romDataGroup: 'auto' | 'default' | 'page0';
}

export type Msx2Screen5PresentationHeight = 192 | 212;
export type Msx2Screen5PresentationFitMode = 'cover' | 'contain' | 'stretch';

export interface Msx2Screen5PresentationCompressionConfig {
  codec: 'ZX0';
  enabled: boolean;
  chunkLines: number;
}

export interface Msx2Screen5PresentationConfig {
  enabled: boolean;
  name: string;
  target: 'MSX2';
  screenMode: 'SCREEN 5';
  sourceFileName: string | null;
  sourceImageWidth: number;
  sourceImageHeight: number;
  width: 256;
  height: Msx2Screen5PresentationHeight;
  displayHeight?: Msx2Screen5PresentationHeight;
  fitMode: Msx2Screen5PresentationFitMode;
  backgroundSlot?: 0;
  backgroundHex?: '#000000';
  palette: Screen5PaletteSlot[];
  pixels: number[][];
  packedBitmap: number[];
  visibleImageBytes?: number;
  vramBitmapBytes?: number;
  compression: Msx2Screen5PresentationCompressionConfig;
  runtime: Msx2Screen5PresentationRuntimeConfig;
  updatedAt?: number | null;
  lastImportError?: string | null;
  data?: {
    pixels?: number[][];
    packedBitmap?: number[];
    packedPixels?: number[];
  };
}
// --- End MSX2 SCREEN 5 Presentation Types ---

// --- Dialogue Asset Types ---
export interface DialogueLine {
  id: string;
  speaker?: string;
  text: string;
  waitForInput?: boolean;
  graphic?: DialogueTileGraphicConfig;
}

export interface DialogueBoxTileRefs {
  topLeftTileId?: string;
  topRightTileId?: string;
  bottomLeftTileId?: string;
  bottomRightTileId?: string;
  horizontalTileId?: string;
  verticalTileId?: string;
}

export interface DialogueBoxCharCodes {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  horizontal: number;
  vertical: number;
}

export interface DialogueTileGraphicConfig {
  enabled: boolean;
  side: 'left' | 'right';
  portraitAssetId?: string;
  tileBankAssetId?: string;
  tileIds: string[];
  width: number;
  height: number;
  padding: number;
}

export interface DialogueBoxConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  borderSource: 'generated' | 'tilebank';
  tileBankAssetId?: string;
  borderTiles?: DialogueBoxTileRefs;
  borderCharCodes?: Partial<DialogueBoxCharCodes>;
  fontAssetId?: string;
  graphic?: DialogueTileGraphicConfig;
}

export interface DialogueAsset {
  id: string;
  name: string;
  lines: DialogueLine[];
  box: DialogueBoxConfig;
  exportOptions: {
    maxCharsPerLine: number;
    maxLinesPerBox: number;
    stripUnsupportedChars: boolean;
    charDelayFrames: number;
    mouthToggleEveryChars?: number;
  };
}
// --- End Dialogue Asset Types ---

// --- MSX2 SCREEN 5 Bitmap Dialogue Asset Types ---
// Parallel to the MSX1 DialogueAsset above but pixel-based: no Name Table char
// codes, no tilebanks. Rendered in the SCREEN 5 bitmap-room backend with V9938
// HMMV fills (box) + HMMM glyph/portrait blits (typewriter + mouth animation).

/** A talking-head portrait: two 4bpp frames (mouth closed / mouth open). */
export interface Msx2DialoguePortrait {
  id: string;
  name: string;
  /** Width in pixels, multiple of 8. Default 32. */
  width: number;
  /** Height in pixels, multiple of 8. Default 32. */
  height: number;
  /** Palette-slot pixels (height rows x width cols), mouth closed. */
  closedPixels: number[][];
  /** Mouth-open frame, same dimensions. */
  openPixels: number[][];
}

export interface Msx2DialogueLine {
  id: string;
  speaker?: string;
  text: string;
  /** Portrait shown while this line types. Falls back to defaultPortraitId. */
  portraitId?: string;
  /** Wait for the talk key before advancing to the next line. Default true. */
  waitForInput?: boolean;
}

export interface Msx2DialogueBoxConfig {
  /** Box rect in pixels inside the 256x192 game band. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** SCREEN 5 palette slot for the interior fill. */
  backgroundColor: number;
  /** SCREEN 5 palette slot for the 2px frame. */
  borderColor: number;
  /** SCREEN 5 palette slot for the text glyphs. */
  textColor: number;
  /** Which side of the box the portrait sits on. */
  portraitSide: 'left' | 'right';
  /** Interior padding in pixels between border, portrait and text. */
  padding: number;
}

export interface Msx2DialogueAsset {
  id: string;
  name: string;
  target: 'MSX2';
  lines: Msx2DialogueLine[];
  box: Msx2DialogueBoxConfig;
  portraits: Msx2DialoguePortrait[];
  defaultPortraitId?: string;
  /** msx2hudfont asset used for the text glyphs; falls back to the room's HUD font. */
  fontAssetId?: string;
  exportOptions: {
    /** Frames between typed characters. */
    charDelayFrames: number;
    /** Mouth open/close toggles every N typed characters. 0 = mouth static. */
    mouthToggleEveryChars: number;
    stripUnsupportedChars: boolean;
  };
}

/** Params bag stored on an Msx2Screen4EntityInstance with kind 'npc'. */
export interface Msx2NpcDialogueParams {
  /** msx2dialogue asset played when the player talks to this NPC. */
  dialogueAssetId: string;
  /** Optional room-atlas entry drawn at the NPC cell (baked into the render program). */
  atlasEntryId?: string;
  /** Key that opens/advances the dialogue. Default 'up'. */
  talkKey?: 'up' | 'space';
}
// --- End MSX2 SCREEN 5 Bitmap Dialogue Asset Types ---

// --- Portrait Asset Types ---
export interface PortraitMouthConfig {
  enabled: boolean;
  cellIndex: number;
  openTileId?: string;
}

export interface PortraitAsset {
  id: string;
  name: string;
  widthChars: number;
  heightChars: number;
  tileBankAssetId?: string;
  cells: string[];
  dedupeIdenticalTiles: boolean;
  mouth?: PortraitMouthConfig;
}
// --- End Portrait Asset Types ---

// --- Game Flow Types ---

/** The type of a node in the game flow graph. */
export type GameFlowNodeType = 'Start' | 'SubMenu' | 'Controls' | 'WorldLink' | 'End' | 'Text' | 'TextScroll' | 'TextScrollColor' | 'TextScroll2' | 'Restart' | 'Waypoint' | 'Transition' | 'Group' | 'IfThenElse' | 'Music' | 'Globals' | 'PresentationScreen';

/** The base interface for a game flow node. */
export interface GameFlowNode_Base {
  id: string;
  type: GameFlowNodeType;
  position: { x: number; y: number };
}

/** Represents the starting point of the game flow. */
export interface GameFlowStartNode extends GameFlowNode_Base {
  type: 'Start';
  /** Configuration for initializing global variables at game start */
  initializeGlobals?: GameFlowGlobalInitializationConfig;
  /** Configuration for MSX system initialization */
  systemConfig?: {
    initPSG: boolean;          // Initialize PSG (silence all channels)
    clearSprites: boolean;     // Clear sprite attribute table
    resetVDP: boolean;         // Reset VDP registers to default
    clearVRAM: boolean;        // Clear VRAM (patterns, colors, sprites)
    initialDelayFrames?: number; // Initial delay before continuing (default: 0)
  };
}

export interface GameFlowGlobalInitializationConfig {
  enabled: boolean;
  /** Optional source GlobalVariables asset used by the editor to scope the variable list */
  globalVariablesAssetId?: string;
  /** Variables to initialize with their values. If empty, uses default values from GlobalVariables asset */
  variables?: Array<{
    variableName: string;
    value: number | boolean;
  }>;
}

/** Represents a single option in a submenu node. */
export interface GameFlowSubMenuOption {
  id: string;
  text: string;
  type?: 'normal' | 'controls';
  controlOptions?: ('CURSORS' | 'JOYSTICK' | 'KEYS')[];
  globalVariableName?: string;
}

/** Represents a submenu node in the game flow. */
export interface GameFlowSubMenuNode extends GameFlowNode_Base {
  type: 'SubMenu';
  title: string;
  options: GameFlowSubMenuOption[];
  appearance?: {
    backgroundScreenAssetId?: string;
    cursorSpriteAssetId?: string;
    /** Selector rendering mode for submenu option marker. */
    selectorType?: 'char' | 'sprite';
    /** Backward/alternate aliases accepted by generator. */
    cursorType?: 'char' | 'sprite';
    cursorMode?: 'char' | 'sprite';
    fontAssetId?: string;
    colors: {
      text: string;
      background: string;
      highlightText: string;
      highlightBackground: string;
      border: string;
    };
  };
}

export type GameFlowKeyboardButton1Binding = 'SPC' | 'CTRL';
export type GameFlowKeyboardButton2Binding = 'N' | 'CTRL';
export type GameFlowActionButtonBinding = 'button1' | 'button2';

/** Represents an in-game control configuration menu. */
export interface GameFlowControlsNode extends GameFlowNode_Base {
  type: 'Controls';
  title: string;
  keyboardButton1?: GameFlowKeyboardButton1Binding;
  keyboardButton2?: GameFlowKeyboardButton2Binding;
  jumpActionLabel?: string;
  jumpActionButton?: GameFlowActionButtonBinding;
  actionLabel?: string;
  actionButton?: GameFlowActionButtonBinding;
}

/** Represents a link to a world map in the game flow. */
export interface GameFlowWorldLinkNode extends GameFlowNode_Base {
  type: 'WorldLink';
  worldAssetId: string;
  /** Optional global initialization applied when entering this world */
  initializeGlobals?: GameFlowGlobalInitializationConfig;
}

/** Represents an end point of the game flow (e.g., victory or game over). */
export interface GameFlowEndNode extends GameFlowNode_Base {
  type: 'End';
  endType: 'Victory' | 'GameOver';
  message: string;
}

/** Represents a text screen with message and "Press Fire to continue" prompt. */
export interface GameFlowTextNode extends GameFlowNode_Base {
  type: 'Text';
  title: string;
  message: string;
  appearance?: {
    backgroundScreenAssetId?: string;
    fontAssetId?: string;
    colors: {
      text: string;
      background: string;
      promptText: string;
    };
  };
}

/** Represents a Galious-style text scroll screen. */
export interface GameFlowTextScrollNode extends GameFlowNode_Base {
  type: 'TextScroll';
  title: string;
  text: string;
  fontAssetId?: string;
  backgroundColor: string;
  stripeColor: string;
  /** Frames to wait per scroll pixel in preview, clamped by exporters. */
  speedFrames: number;
}

/** Represents a Galious-style text scroll screen with configurable foreground text color. */
export interface GameFlowTextScrollColorNode extends GameFlowNode_Base {
  type: 'TextScrollColor';
  title: string;
  text: string;
  fontAssetId?: string;
  backgroundColor: string;
  stripeColor: string;
  textColor: string;
  /** Frames to wait per scroll pixel in preview, clamped by exporters. */
  speedFrames: number;
}

/** Represents a SCREEN 2 pattern-table pixel scroll text screen. */
export interface GameFlowTextScroll2Node extends GameFlowNode_Base {
  type: 'TextScroll2';
  title: string;
  text: string;
  fontAssetId?: string;
  backgroundColor: string;
  stripeColor: string;
  /** Frames to wait per scroll pixel in preview, clamped by exporters. */
  speedFrames: number;
}

/** Represents a restart node that loops back to the start of the game. */
export interface GameFlowRestartNode extends GameFlowNode_Base {
  type: 'Restart';
  title: string;
  message: string;
  appearance?: {
    backgroundScreenAssetId?: string;
    colors: {
      text: string;
      background: string;
      promptText: string;
    };
  };
}

/** Represents a waypoint node for visual organization (no game functionality). */
export interface GameFlowWaypointNode extends GameFlowNode_Base {
  type: 'Waypoint';
}

/** Represents a music playback node. */
export interface GameFlowMusicNode extends GameFlowNode_Base {
  type: 'Music';
  /** If true, stop any currently playing music when this node is reached. */
  stop?: boolean;
  trackAssetId?: string;
  loop?: boolean;
  autoPlay?: boolean;
}

/** Represents a screen transition effect node. */
export interface GameFlowTransitionNode extends GameFlowNode_Base {
  type: 'Transition';
  effect: 'cls' | 'dissolve_pixels' | 'dissolve_chars' | 'vertical_lines' | 'horizontal_lines' | 'spiral' | 'fill_white_squares' | 'diagonal_clear' | 'diagonal_inverse' | 'checkerboard' | 'doors' | 'center_curtain' | 'venetian_blinds' | 'radial_wipe' | 'block4_shuffle' | 'zoom_box';
  duration?: number; // milliseconds (optional, for preview timing)
  fillChar?: 254 | 255; // SCREEN 2 char used by name-table wipe effects
}

/** Represents a node that sets or initializes global variables at runtime. */
export interface GameFlowGlobalsNode extends GameFlowNode_Base {
  type: 'Globals';
  /** Optional display name for the node. */
  title?: string;
  /** Asset that provides the available global variables to pick from. */
  globalVariablesAssetId?: string;
  /** List of variable assignments to apply when this node is reached. */
  variables: Array<{
    id: string;
    name: string;
    /** Stored as string in editor; parsed to boolean/number/string at runtime. */
    value: string;
  }>;
}

/** Represents a group node that calls another GameFlow asset (nested GameFlow). */
export interface GameFlowGroupNode extends GameFlowNode_Base {
  type: 'Group';
  gameFlowAssetId?: string; // ID of the GameFlow asset to execute
  name: string; // Display name for the group
}

/** Represents a conditional node (if-then-else) in GameFlow. */
export interface GameFlowIfThenElseNode extends GameFlowNode_Base {
  type: 'IfThenElse';
  /** The global variable to compare (e.g., "Goal") */
  variableName: string;
  /** The value to compare against (e.g., "Completed", "Failure") */
  compareValue: string;
  /** Optional: comparison operator (default: equals) */
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
}

/** Represents a node that displays a Presentation Screen asset. */
export interface GameFlowPresentationScreenNode extends GameFlowNode_Base {
  type: 'PresentationScreen';
  /** ID of the MSX1 PresentationScreen asset to display. */
  presentationScreenAssetId?: string;
}

/** A union type for all possible game flow node types. */
export type GameFlowNode = GameFlowStartNode | GameFlowSubMenuNode | GameFlowControlsNode | GameFlowWorldLinkNode | GameFlowEndNode | GameFlowTextNode | GameFlowTextScrollNode | GameFlowTextScrollColorNode | GameFlowTextScroll2Node | GameFlowRestartNode | GameFlowWaypointNode | GameFlowMusicNode | GameFlowTransitionNode | GameFlowGroupNode | GameFlowIfThenElseNode | GameFlowGlobalsNode | GameFlowPresentationScreenNode;

/** Represents a connection between two nodes in the game flow graph. */
export interface GameFlowConnection {
  id: string;
  from: { nodeId: string; sourceId?: string };
  to: { nodeId: string; };
  waypoints?: Point[];
}

/**
 * Represents a complete game flow graph asset.
 */
export interface GameFlowGraph {
  id: string;
  name: string;
  nodes: GameFlowNode[];
  connections: GameFlowConnection[];
  startNodeId: string;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}

// --- MSX2 Game Flow Types ---

export type Msx2GameFlowNodeType = 'Start' | 'Globals' | 'Screen5Presentation' | 'Screen4Screen' | 'SubMenu' | 'Controls' | 'Text' | 'TextScroll' | 'TextScrollColor' | 'WorldLink' | 'Waypoint' | 'IfThenElse' | 'Music' | 'Transition' | 'Restart' | 'End';

export interface Msx2GameFlowNode_Base {
  id: string;
  type: Msx2GameFlowNodeType;
  position: { x: number; y: number };
}

export interface Msx2GameFlowStartNode extends Msx2GameFlowNode_Base {
  type: 'Start';
}

export interface Msx2GameFlowScreen5PresentationNode extends Msx2GameFlowNode_Base {
  type: 'Screen5Presentation';
  presentationAssetId?: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowScreen4ScreenNode extends Msx2GameFlowNode_Base {
  type: 'Screen4Screen';
  screenAssetId?: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowTextNode extends Msx2GameFlowNode_Base {
  type: 'Text';
  title: string;
  message: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowTextScrollNode extends Msx2GameFlowNode_Base {
  type: 'TextScroll';
  title: string;
  text: string;
  backgroundScreenAssetId?: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowTextScrollColorNode extends Msx2GameFlowNode_Base {
  type: 'TextScrollColor';
  title: string;
  text: string;
  backgroundScreenAssetId?: string;
  textColorIndex?: number;
  backgroundColorIndex?: number;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowSubMenuOption {
  id: string;
  text: string;
}

export interface Msx2GameFlowSubMenuNode extends Msx2GameFlowNode_Base {
  type: 'SubMenu';
  title: string;
  options: Msx2GameFlowSubMenuOption[];
  backgroundScreenAssetId?: string;
}

export interface Msx2GameFlowControlsNode extends Msx2GameFlowNode_Base {
  type: 'Controls';
  title: string;
  keyboardButton1?: GameFlowKeyboardButton1Binding;
  keyboardButton2?: GameFlowKeyboardButton2Binding;
  jumpActionLabel?: string;
  jumpActionButton?: GameFlowActionButtonBinding;
  actionLabel?: string;
  actionButton?: GameFlowActionButtonBinding;
  backgroundScreenAssetId?: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export interface Msx2GameFlowWorldLinkNode extends Msx2GameFlowNode_Base {
  type: 'WorldLink';
  worldAssetId: string;
}

export interface Msx2GameFlowGlobalsNode extends Msx2GameFlowNode_Base {
  type: 'Globals';
  title?: string;
  globalVariablesAssetId?: string;
  variables: Array<{
    id: string;
    name: string;
    value: string;
  }>;
}

export interface Msx2GameFlowIfThenElseNode extends Msx2GameFlowNode_Base {
  type: 'IfThenElse';
  variableName: string;
  compareValue: string;
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
}

export interface Msx2GameFlowMusicNode extends Msx2GameFlowNode_Base {
  type: 'Music';
  stop?: boolean;
  trackAssetId?: string;
  loop?: boolean;
  autoPlay?: boolean;
}

export interface Msx2GameFlowTransitionNode extends Msx2GameFlowNode_Base {
  type: 'Transition';
  effect: 'cls' | 'fade_to_black' | 'screen5_vertical_pixel_wipe' | 'screen5_horizontal_pixel_wipe' | 'screen5_diagonal_pixel_wipe' | 'screen5_mirror_pixel_wipe' | 'dissolve_pixels' | 'dissolve_chars' | 'horizontal_lines' | 'vertical_lines' | 'spiral' | 'fill_white_squares' | 'diagonal_clear' | 'diagonal_inverse' | 'checkerboard' | 'doors' | 'center_curtain' | 'venetian_blinds' | 'radial_wipe' | 'block4_shuffle' | 'zoom_box' | 'raster_bars' | 'raster_split_wipe' | 'raster_scanlines' | 'raster_palette_fade' | 'raster_bands_down' | 'raster_bands_up' | 'raster_center_bands' | 'raster_wave_bands' | 'raster_corner_wipe' | 'raster_diagonal_corner';
  durationFrames?: number;
}

export interface Msx2GameFlowWaypointNode extends Msx2GameFlowNode_Base {
  type: 'Waypoint';
}

export interface Msx2GameFlowRestartNode extends Msx2GameFlowNode_Base {
  type: 'Restart';
  title?: string;
  message?: string;
}

export interface Msx2GameFlowEndNode extends Msx2GameFlowNode_Base {
  type: 'End';
  title?: string;
  message?: string;
  waitForKey?: boolean;
  waitFrames?: number;
}

export type Msx2GameFlowNode =
  | Msx2GameFlowStartNode
  | Msx2GameFlowGlobalsNode
  | Msx2GameFlowScreen5PresentationNode
  | Msx2GameFlowScreen4ScreenNode
  | Msx2GameFlowSubMenuNode
  | Msx2GameFlowControlsNode
  | Msx2GameFlowWorldLinkNode
  | Msx2GameFlowTextNode
  | Msx2GameFlowTextScrollNode
  | Msx2GameFlowTextScrollColorNode
  | Msx2GameFlowWaypointNode
  | Msx2GameFlowIfThenElseNode
  | Msx2GameFlowMusicNode
  | Msx2GameFlowTransitionNode
  | Msx2GameFlowRestartNode
  | Msx2GameFlowEndNode;

export interface Msx2GameFlowConnection {
  id: string;
  from: { nodeId: string; sourceId?: string };
  to: { nodeId: string };
  waypoints?: Point[];
}

export type Msx2GameFlowPurpose = 'screen5-presentation' | 'screen4-runtime' | 'screen4-bitmap-runtime';

export interface Msx2GameFlowGraph {
  id: string;
  name: string;
  target: 'MSX2';
  purpose?: Msx2GameFlowPurpose;
  nodes: Msx2GameFlowNode[];
  connections: Msx2GameFlowConnection[];
  startNodeId: string;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}
// --- End Game Flow Types ---

/**
 * An enumeration of all possible editor types in the application.
 */
export enum EditorType {
  None = "None", Tile = "Tile", Sprite = "Sprite", Screen = "Screen", Code = "Code",
  Attributes = "Attributes", Sound = "Sound", Platformer = "Platformer", WorldMap = "WorldMap",
  Track = "Track", HUD = "HUD", TileBanks = "TileBanks", Font = "Font", HelpDocs = "HelpDocs",
  BehaviorEditor = "BehaviorEditor",
  ComponentDefinitionEditor = "ComponentDefinitionEditor",
  EntityTemplateEditor = "EntityTemplateEditor",
  EnemyLibrary = "EnemyLibrary",
  Boss = "Boss",
  WorldView = "WorldView",
  GameFlow = "GameFlow",
  Dialogue = "Dialogue",
  Msx2Dialogue = "Msx2Dialogue",
  Portrait = "Portrait",
  MainMenu = "MainMenu",
  PresentationScreen = "PresentationScreen",
  StateMachine = "StateMachine",
  GlobalVariables = "GlobalVariables",
  Palette = "Palette",
  Msx2Sprite = "Msx2Sprite",
  Msx2Bitmap = "Msx2Bitmap",
  Msx2BitmapTile = "Msx2BitmapTile",
  Msx2BitmapStamp = "Msx2BitmapStamp",
  Msx2BitmapTerrain = "Msx2BitmapTerrain",
  Msx2Screen = "Msx2Screen",
  Msx2BitmapRoom = "Msx2BitmapRoom",
  Msx2Player = "Msx2Player",
  Msx2Enemy = "Msx2Enemy",
  Msx2Boss = "Msx2Boss",
  Msx2BossPath = "Msx2BossPath",
  Msx2Shoot = "Msx2Shoot",
  Msx2HudFont = "Msx2HudFont",
  Msx2HudEditor = "Msx2HudEditor",
  Msx2Presentation = "Msx2Presentation",
  Msx2GameFlow = "Msx2GameFlow",
  PngMsxChars = "PngMsxChars",
}

/**
 * Represents a generic project asset, which can be of any asset type.
 */
export interface ProjectAsset {
  /** A unique identifier for the asset. */
  id: string;
  /** The name of the asset. */
  name: string;
  /** The type of the asset. */
  type: 'tile' | 'sprite' | 'msx2sprite' | 'msx2bitmap' | 'msx2bitmaptile' | 'msx2bitmapstamp' | 'msx2bitmapterrain' | 'msx2screen' | 'msx2bitmaproom' | 'msx2player' | 'msx2enemy' | 'msx2boss' | 'msx2bosspath' | 'msx2shoot' | 'msx2hudfont' | 'msx2hud' | 'msx2presentation' | 'msx2gameflow' | 'boss' | 'screenmap' | 'code' | 'sound' | 'worldmap' | 'track' | 'behavior' | 'componentdefinition' | 'entitytemplate' | 'gameflow' | 'dialogue' | 'msx2dialogue' | 'portrait' | 'statemachine' | 'font' | 'tilebank' | 'globalvariables' | 'palette' | 'presentationscreen';
  /** The data associated with the asset, which varies by type. */
  data?: Tile | Sprite | Msx2Sprite | Msx2Bitmap | BitmapTileScreen5 | Msx2BitmapStampAsset | Msx2BitmapTerrainAsset | Msx2Screen4TileScreen | Msx2Screen5BitmapRoom | Msx2PlayerDefinition | EnemyDefinition | Msx2BossDefinition | Msx2BossPath | Msx2ShootDefinition | Msx2HudFontAsset | Msx2HudAsset | Msx2Screen5PresentationConfig | Msx2GameFlowGraph | ScreenMap | string | WorldMapGraph | PSGSoundData | TrackerSongData | BehaviorScript | ComponentDefinition | EntityTemplate | Boss | GameFlowGraph | DialogueAsset | Msx2DialogueAsset | PortraitAsset | StateMachine | MSXFontAsset | TileBank | GlobalVariablesAsset | PaletteAsset | PresentationScreenConfig;
}

export interface Point { x: number; y: number; }
export interface SymmetrySettings { horizontal: boolean; vertical: boolean; diagonalMain: boolean; diagonalAnti: boolean; quadMirror: boolean; }
export type MSXCharacterPattern = number[];
export type MSXFont = Record<number, MSXCharacterPattern>;
export type MSXFontRowColorAttributes = Array<{ fg: MSX1ColorValue, bg: MSX1ColorValue }>;
export type MSXFontColorAttributes = Record<number, MSXFontRowColorAttributes>;

/**
 * Represents a complete font asset including patterns and color attributes.
 */
export interface MSXFontAsset {
  /** The font pattern data mapping character codes to patterns. */
  fontData: MSXFont;
  /** The color attributes for SCREEN 2 mode. */
  fontColorAttributes: MSXFontColorAttributes;
}

export interface Msx2HudFontAsset {
  /** Fixed target for this asset family. */
  target: 'MSX2';
  /** VDP mode used by the native MSX2 room backend. */
  vdpMode: 'SCREEN4' | 'SCREEN5';
  /** First SCREEN 4 character code reserved for the HUD font. */
  baseChar: number;
  /** Supported characters in asset order. */
  characters: string;
  /** One 8-byte 1bpp pattern per supported character. */
  patterns: Record<string, number[]>;
  /** Optional SCREEN 5 palette asset used by bitmap glyphs and previews. */
  paletteAssetId?: string;
  /** SCREEN 5 background slot used as the glyph mask "off" color. */
  screen5BackgroundSlot?: number;
  /** SCREEN 5 4bpp bitmap glyphs: one 8x8 palette-slot matrix per character. */
  bitmapPatterns?: Record<string, number[][]>;
  /** SCREEN 4 color byte per glyph row: fg nibble << 4 | bg nibble. */
  colorByte: number;
  /** Optional note for authors. */
  notes?: string;
}

/**
 * Represents a global variables asset containing custom project-specific variables.
 */
export interface GlobalVariablesAsset {
  /** List of custom global variables for this project */
  customVariables: MideasGlobalVariable[];
}

export interface PaletteAsset {
  /** Palette slots (MSX2 V9938 style). */
  slots: Screen5PaletteSlot[];
  /** Optional notes about usage. */
  notes?: string;
  /** Intended palette mode. */
  mode: 'SCREEN4' | 'SCREEN5';
  /** Origin metadata for generated/imported palettes. */
  source?: 'manual' | 'auto-generated-from-png' | 'duplicated' | 'imported' | 'auto-generated-from-screen5-bitmap-tile';
  /** Strong link to the tile that caused this palette to be created. */
  createdFromTileId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DataFormat = 'hex' | 'decimal';
export type ExportRomMode = 'auto' | 'simple32k' | 'plain48k' | 'megarom';

export interface Snippet { id: string; name: string; code: string; }

// MockEntityType is now replaced by EntityTemplate for actual use, but kept for reference if needed elsewhere temporarily
export interface MockEntityType {
  id: string;
  name: string;
  icon?: string;
  defaultSpriteAssetId?: string;
}

export interface HelpDocArticle { id: string; title: string; content: string; tags?: string[]; }
export interface HelpDocSection { id: string; title: string; articles: HelpDocArticle[]; }
export type DrawingTool = 'pencil' | 'floodfill' | 'dither';
export const DITHER_BRUSH_DIAMETERS = [1, 3, 5, 7] as const;
export type DitherBrushDiameter = typeof DITHER_BRUSH_DIAMETERS[number];
export type ScreenEditorTool = 'draw' | 'erase' | 'select' | 'placeEntity' | 'defineEffectZone' | 'stamp'; // Added 'stamp'
export interface ScreenSelectionRect { x: number; y: number; width: number; height: number; }

/**
 * Represents a reusable tile pattern (stamp) for the Screen Editor.
 * Allows users to save and reuse common tile arrangements.
 */
export interface TileStamp {
  /** Unique identifier for the stamp. */
  id: string;
  /** User-friendly name for the stamp. */
  name: string;
  /** Width of the stamp in tiles. */
  width: number;
  /** Height of the stamp in tiles. */
  height: number;
  /** The tile data for this stamp (2D array of ScreenTile). */
  tiles: ScreenTile[][];
  /** Optional preview thumbnail data URL. */
  thumbnailDataUrl?: string;
}

export const SOLIDITY_TYPES = [
  { id: 0, name: "NoSolid (Passable)", isSolid: false },
  { id: 1, name: "Solid (Wall/Ground)", isSolid: true },
  { id: 2, name: "Platform (Top-Solid)", isSolid: true },
  { id: 3, name: "Slope (Solid)", isSolid: true },
] as const;
export type SolidityTypeId = typeof SOLIDITY_TYPES[number]['id'];

export const PROPERTY_FLAGS = {
  isBreakable: { bit: 0, label: "Breakable" },
  isMovable: { bit: 1, label: "Movable" },
  causesDamage: { bit: 2, label: "Deadly" },
  isInteractiveSwitch: { bit: 3, label: "Interactable" },
} as const;
export type PropertyFlagKey = keyof typeof PROPERTY_FLAGS;

export const TILE_INTERACTION_TYPES = [
  { id: 0, key: 'none', label: 'None' },
  { id: 1, key: 'collect_gem', label: 'Collect Gem' },
  { id: 2, key: 'collect_item', label: 'Collect Item' },
  { id: 3, key: 'add_energy', label: 'Add Energy' },
  { id: 4, key: 'lever_toggle', label: 'Lever Toggle' },
  { id: 5, key: 'button_press', label: 'Button Press' },
  { id: 6, key: 'jumper', label: 'Jumper' },
  { id: 7, key: 'ladder', label: 'Ladder' },
] as const;
export type TileInteractionType = typeof TILE_INTERACTION_TYPES[number]['key'];

export interface LayoutBlockExportData {
  mode: Extract<ScreenBlockExportMode, 'blocks2x2' | 'blocks4x4'>;
  blockWidth: number;
  blockHeight: number;
  catalogEntryCount: number;
  catalogLengthBytes: number;
  mapLengthBytes: number;
  optimizedLengthBytes: number;
  catalogBytes: number[];
  mapIndices: number[];
  mapWidth: number;
  mapHeight: number;
}
export interface LayoutASMExportData {
  mapName: string;
  mapWidth: number;
  mapHeight: number;
  mapIndices: number[];
  referenceComments: string[];
  dataFormat: DataFormat;
  exportMode?: ScreenBlockExportMode;
  blockData?: LayoutBlockExportData | null;
}
export interface BehaviorMapASMExportData { mapName: string; mapWidth: number; mapHeight: number; behaviorMapData: number[]; dataFormat: DataFormat; }
export interface PletterExportData { mapName: string; mapWidth: number; mapHeight: number; pletterDataBytes: number[]; tilePartReferences: { byteValue: number; tileId: string | null; subTileX?: number; subTileY?: number, name?: string }[]; }
export interface SuperRLEExportData { mapName: string; mapWidth: number; mapHeight: number; originalSize: number; compressedSize: number; superRLEDataBytes: number[]; tilePartReferences?: { byteValue: number; tileId: string | null; subTileX?: number; subTileY?: number, name?: string }[]; compressionMethodName: 'SuperRLE'; }
export interface OptimizedRLEExportData { mapName: string; mapWidth: number; mapHeight: number; originalSize: number; compressedSize: number; optimizedRLEPackets: number[]; decompressorAsm: string; compressionMethodName: 'OptimizedRLE'; }
export type ContextMenuItem =
  | {
    isSeparator?: false;
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  }
  | {
    isSeparator: true;
  };

// --- Texture Generator Types ---
export type TextureGeneratorType = 'Rock' | 'Brick' | 'Ladder' | 'CellBars' | 'Ice' | 'Grass' | 'StylizedGrass' | 'Frame';

export interface RockGeneratorParams {
  baseColor: MSXColorValue;
  highlightColor: MSXColorValue;
  shadowColor: MSXColorValue;
  density: number; // 0-100
  seamless: boolean;
}

export interface BrickGeneratorParams {
  brickColor: MSXColorValue;
  mortarColor: MSXColorValue;
  brickWidth: number; // in pixels
  brickHeight: number; // in pixels
  mortarThickness: number; // in pixels
  rowOffset: number; // 0.0 to 1.0
  edgeVariation: number; // 0-100
}

export interface LadderGeneratorParams {
  railColor: MSXColorValue;
  rungColor: MSXColorValue;
  backgroundColor: MSXColorValue;
  railWidth: number; // 1 or 2
  rungHeight: number; // 1 or 2
  rungSpacing: number; // e.g., 2-8
  railInset: number; // e.g., 0-3
  style: 'solid' | 'dashed';
}

export interface CellBarsGeneratorParams {
  barColor: MSXColorValue;
  backgroundColor: MSXColorValue;
  barCount: number;
  barThickness: number;
  hasOutline: boolean;
}

export interface IceGeneratorParams {
  baseColor: MSXColorValue;
  crackColor: MSXColorValue;
  shineColor: MSXColorValue;
  crackDensity: number; // 0.0 to 1.0
}

export interface GrassGeneratorParams {
  baseGrassColor: MSXColorValue;
  shadowGrassColor: MSXColorValue;
  detailColor: MSXColorValue;
  detailProbability: number; // 0.0 to 1.0
}

export interface StylizedGrassGeneratorParams {
  lightGrassColor: MSXColorValue;
  darkGrassColor: MSXColorValue;
  bladeDensity: number; // 0.1 to 1.0
  style: 'wavy' | 'straight' | 'random';
}

export interface FrameGeneratorParams {
  frameColor: MSXColorValue;
  backgroundColor: MSXColorValue;
  thickness: number; // 1-8 pixels
  style: 'simple' | 'double' | 'decorative' | 'braided' | 'chain' | 'carved';
  corners: 'square' | 'rounded' | 'fancy';
}

export interface AllGeneratorParams {
  Rock: RockGeneratorParams;
  Brick: BrickGeneratorParams;
  Ladder: LadderGeneratorParams;
  CellBars: CellBarsGeneratorParams;
  Ice: IceGeneratorParams;
  Grass: GrassGeneratorParams;
  StylizedGrass: StylizedGrassGeneratorParams;
  Frame: FrameGeneratorParams;
}
// --- End Texture Generator Types ---

// --- App-specific Types ---
export interface CopiedTileData {
  data: PixelData;
  lineAttributes?: LineColorAttribute[][];
  width: number;
  height: number;
}

export interface CopiedBossPhaseData {
  tileMatrix: (string | null)[][];
  collisionMatrix: (boolean)[][];
  dimensions: { width: number; height: number };
  forms?: BossForm[];
  initialFormId?: string;
  neckChain?: BossNeckChain;
  crushMovement?: BossCrushMovement;
  behaviorLoop?: BossBehaviorAction[];
}


export interface WaypointPickerState {
  isPicking: boolean;
  entityInstanceId: string | null;
  componentDefId: string | null;
  waypointPrefix: 'waypoint1' | 'waypoint2';
}

// --- Centralized History System ---
export type HistoryActionType = 'ASSETS_UPDATE' | 'TILE_BANKS_UPDATE' | 'FONT_UPDATE' | 'FONT_COLOR_UPDATE' | 'COMPONENT_DEFINITIONS_UPDATE' | 'ENTITY_TEMPLATES_UPDATE' | 'ENEMY_DEFINITIONS_UPDATE' | 'MAIN_MENU_UPDATE' | 'PRESENTATION_SCREEN_UPDATE';

export interface HistoryAction {
  type: HistoryActionType;
  payload: {
    before: any;
    after: any;
  }
}

export interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
}
// --- End Centralized History System ---
