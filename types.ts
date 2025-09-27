

import { StateMachine } from './statemachine.types';

/** A string representing a color in hex format (e.g., "#RRGGBB"). */
export type MSXColorValue = string;
/** A string representing a color from the MSX1 palette in hex format. */
export type MSX1ColorValue = string;

/**
 * Represents a color in the MSX SCREEN 5 palette.
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
}

/**
 * Represents a single frame of a sprite's animation.
 */
export interface SpriteFrame {
  /** A unique identifier for the frame. */
  id: string;
  /** The pixel data for the frame. */
  data: PixelData; 
}

/** The type of explosion to generate. */
export type ExplosionType = "Radial" | "Fragmentada" | "Implosión";
/** An array of possible sprite sizes for generated explosions. */
export const EXPLOSION_SPRITE_SIZES = [16, 24, 32] as const;
/** The size of a sprite for a generated explosion. */
export type ExplosionSpriteSize = typeof EXPLOSION_SPRITE_SIZES[number];

/**
 * Parameters for generating an explosion sprite animation.
 */
export interface ExplosionParams {
  /** The type of explosion. */
  type: ExplosionType;
  /** The size of the explosion sprite. */
  size: ExplosionSpriteSize;
  /** The number of frames in the animation. */
  numFrames: number;
  /** The intensity of the explosion. */
  intensity: number; 
  /** The amount of jitter or randomness. */
  jitter: number;    
  /** The number of simultaneous colors to use. */
  numSimultaneousColors: 1 | 2 | 3 | 4;
  /** The number of fragments for fragmented explosions. */
  numFragments?: number; 
  /** The variation in fragment speed. */
  fragmentSpeedVariation?: number; 
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

/**
 * Represents the HUD configuration with proper MSX Screen 2 sector management.
 */
export interface HUDConfiguration {
  /** An array of all HUD elements. */
  elements: HUDElement[];
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
  type: 'byte' | 'word' | 'boolean' | 'string' | 'color' | 'sprite_ref' | 'sound_ref' | 'behavior_script_ref' | 'entity_template_ref' | 'statemachine_ref';
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
  /** An optional icon for display in the editor UI. */
  icon?: string;
  /** An array of components that make up this template. */
  components: EntityTemplateComponent[];
  /** A description of the entity template. */
  description?: string;
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
  /** A map of component property overrides for this instance. */
  componentOverrides: Record<string, Record<string, any>>;
  /** The position of the instance on the screen map, in cells. */
  position: { x: number; y: number };
}
// --- End ECS Core Types ---

// --- Effect Zone Types ---
/** A constant object defining the available flags for an effect zone. */
export const EFFECT_ZONE_FLAGS = {
  water:          { bit: 0, label: "Water Effect", maskValue: 0b00000001, color: 'rgba(50, 100, 200, 0.4)' },
  customGravity:  { bit: 1, label: "Custom Gravity", maskValue: 0b00000010, color: 'rgba(150, 50, 200, 0.4)' },
  icePhysics:     { bit: 2, label: "Ice Physics", maskValue: 0b00000100, color: 'rgba(100, 200, 255, 0.4)' },
  spriteConceal:  { bit: 3, label: "Sprite Concealment", maskValue: 0b00001000, color: 'rgba(100, 100, 100, 0.4)' },
} as const;

/** A type representing the keys of the EFFECT_ZONE_FLAGS object. */
export type EffectZoneFlagKey = keyof typeof EFFECT_ZONE_FLAGS;

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
  /** A bitmask representing the active effects for this zone. */
  mask: number;
  /** A description of the effect zone's purpose. */
  description?: string;
}
// --- End Effect Zone Types ---

/**
 * Represents a screen map asset, containing tile layers and entity instances.
 */
export interface ScreenMap {
  /** A unique identifier for the screen map. */
  id:string;
  /** The name of the screen map. */
  name: string;
  /** The width of the map in tiles. */
  width: number; 
  /** The height of the map in tiles. */
  height: number; 
  /** The different layers of the screen map. */
  layers: {
    background: ScreenLayerData;
    collision: ScreenLayerData;
    effects: ScreenLayerData;
    entities: EntityInstance[]; 
  };
  /** An array of rectangular effect zones on the map. */
  effectZones?: EffectZone[];
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
}

/** A type representing the possible layer names in the screen editor. */
export type ScreenEditorLayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

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
  /** The effect zones within the copied area. */
  effectZones?: EffectZone[];
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
}

/**
 * Represents a world map graph, connecting multiple screen maps.
 */
export interface WorldMapGraph {
  /** A unique identifier for the world map. */
  id: string;
  /** The name of the world map. */
  name: string;
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

/**
 * Represents a PT3 instrument.
 */
export interface PT3Instrument {
  /** The instrument's ID (1-31). */
  id: number; 
  /** The name of the instrument. */
  name: string;
  /** An array of volume envelope points. */
  volumeEnvelope?: number[]; 
  /** An array of tone envelope points (pitch offsets). */
  toneEnvelope?: number[];   
  /** The loop position for the volume envelope. */
  volumeLoop?: number;
  /** The loop position for the tone envelope. */
  toneLoop?: number;
  /** (Not implemented) Sample data for the instrument. */
  sampleData?: any; 
  /** The AY hardware envelope shape (0-15). */
  ayEnvelopeShape?: number; 
  /** Whether the AY noise channel is enabled for this instrument. */
  ayNoiseEnabled?: boolean;
  /** Whether the AY tone channel is enabled for this instrument. */
  ayToneEnabled?: boolean;
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
}

/**
 * Represents a single row in a tracker pattern, containing cells for each channel.
 */
export interface TrackerRow {
  A: TrackerCell;
  B: TrackerCell;
  C: TrackerCell;
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
}

/**
 * Represents a complete tracker song asset.
 */
export interface TrackerSongData {
  /** A unique identifier for the song. */
  id: string;
  /** The name of the song asset. */
  name: string;
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
  instruments: PT3Instrument[];
  /** An array of all ornaments used in the song. */
  ornaments: PT3Ornament[];
  /** The AY hardware envelope period. */
  ayHardwareEnvelopePeriod?: number; 
  /** The currently active pattern index in the order list. */
  currentPatternIndexInOrder: number; 
  /** The ID of the currently active pattern. */
  currentPatternId?: string; 
  /** The calculated total length of the song in ticks. */
  currentSongLengthTicks?: number; 
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
  assignedTiles: Record<string, { charCode: number } | { charCode: number; fontCharacters: { character: string; bankCharCode: number; originalCharCode: number }[] }>;
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
  type: 'Projectile' | 'Melee' | 'Special' | 'Pattern';
  /** The ID of the sprite asset used for the attack's projectile. */
  spriteAssetId?: string;
  /** The ID of the sound effect asset for the attack. */
  soundEffectAssetId?: string;
  /** The amount of damage the attack inflicts. */
  damage: number;
  /** The speed of the attack's projectile. */
  speed?: number; 
  /** The duration of the attack. */
  duration?: number; 
  /** The cooldown period after the attack. */
  cooldown?: number; 
}

/**
 * Represents a weak point on a boss phase.
 */
export interface BossPhaseWeakPoint {
  /** The x-coordinate of the weak point, in tiles. */
  x: number;
  /** The y-coordinate of the weak point, in tiles. */
  y: number;
  /** The health of the weak point. */
  health: number;
  /** The ID of the sprite to show when the weak point is hit. */
  hitSpriteId?: string;
  /** The ID of the tile to replace the weak point with when destroyed. */
  destroyedTileId?: string;
}

/**
 * Represents a single phase of a boss fight.
 */
export interface BossPhase {
  /** A unique identifier for the phase. */
  id:string;
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
  /** The ID of the screen map where this boss appears. */
  linkedScreenId?: string | null;
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

// --- Game Flow Types ---

/** The type of a node in the game flow graph. */
export type GameFlowNodeType = 'Start' | 'SubMenu' | 'WorldLink' | 'End';

/** The base interface for a game flow node. */
export interface GameFlowNode_Base {
  id: string;
  type: GameFlowNodeType;
  position: { x: number; y: number };
}

/** Represents the starting point of the game flow. */
export interface GameFlowStartNode extends GameFlowNode_Base {
  type: 'Start';
}

/** Represents a single option in a submenu node. */
export interface GameFlowSubMenuOption {
  id: string;
  text: string;
}

/** Represents a submenu node in the game flow. */
export interface GameFlowSubMenuNode extends GameFlowNode_Base {
  type: 'SubMenu';
  title: string;
  options: GameFlowSubMenuOption[];
  appearance?: {
    backgroundScreenAssetId?: string;
    cursorSpriteAssetId?: string;
    colors: {
      text: string;
      background: string;
      highlightText: string;
      highlightBackground: string;
      border: string;
    };
  };
}

/** Represents a link to a world map in the game flow. */
export interface GameFlowWorldLinkNode extends GameFlowNode_Base {
  type: 'WorldLink';
  worldAssetId: string;
}

/** Represents an end point of the game flow (e.g., victory or game over). */
export interface GameFlowEndNode extends GameFlowNode_Base {
  type: 'End';
  endType: 'Victory' | 'GameOver';
  message: string;
}

/** A union type for all possible game flow node types. */
export type GameFlowNode = GameFlowStartNode | GameFlowSubMenuNode | GameFlowWorldLinkNode | GameFlowEndNode;

/** Represents a connection between two nodes in the game flow graph. */
export interface GameFlowConnection {
  id: string;
  from: { nodeId: string; sourceId?: string };
  to: { nodeId: string; };
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
  Boss = "Boss",
  WorldView = "WorldView",
  GameFlow = "GameFlow",
  MainMenu = "MainMenu",
  StateMachine = "StateMachine",
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
  type: 'tile' | 'sprite' | 'boss' | 'screenmap' | 'code' | 'sound' | 'worldmap' | 'track' | 'behavior' | 'componentdefinition' | 'entitytemplate' | 'gameflow' | 'statemachine' | 'font' | 'tilebank';
  /** The data associated with the asset, which varies by type. */
  data?: Tile | Sprite | ScreenMap | string | WorldMapGraph | PSGSoundData | TrackerSongData | BehaviorScript | ComponentDefinition | EntityTemplate | Boss | GameFlowGraph | StateMachine | MSXFontAsset | TileBank;
}

export interface Point { x: number; y: number; }
export interface SymmetrySettings { horizontal: boolean; vertical: boolean; diagonalMain: boolean; diagonalAnti: boolean; quadMirror: boolean; }
export type MSXCharacterPattern = number[]; 
export type MSXFont = Record<number, MSXCharacterPattern>;
export type MSXFontRowColorAttributes = Array<{fg: MSX1ColorValue, bg: MSX1ColorValue}>;
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

export type DataFormat = 'hex' | 'decimal';

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
export type ScreenEditorTool = 'draw' | 'erase' | 'select' | 'placeEntity' | 'defineEffectZone'; // Added 'defineEffectZone'
export interface ScreenSelectionRect { x: number; y: number; width: number; height: number; }

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

export interface LayoutASMExportData { mapName: string; mapWidth: number; mapHeight: number; mapIndices: number[]; referenceComments: string[]; dataFormat: DataFormat; }
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
export type TextureGeneratorType = 'Rock' | 'Brick' | 'Ladder' | 'CellBars' | 'Ice' | 'Grass' | 'StylizedGrass';

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

export interface AllGeneratorParams {
    Rock: RockGeneratorParams;
    Brick: BrickGeneratorParams;
    Ladder: LadderGeneratorParams;
    CellBars: CellBarsGeneratorParams;
    Ice: IceGeneratorParams;
    Grass: GrassGeneratorParams;
    StylizedGrass: StylizedGrassGeneratorParams;
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
}


export interface WaypointPickerState {
  isPicking: boolean;
  entityInstanceId: string | null;
  componentDefId: string | null;
  waypointPrefix: 'waypoint1' | 'waypoint2';
}

// --- Centralized History System ---
export type HistoryActionType = 'ASSETS_UPDATE' | 'TILE_BANKS_UPDATE' | 'FONT_UPDATE' | 'FONT_COLOR_UPDATE' | 'COMPONENT_DEFINITIONS_UPDATE' | 'ENTITY_TEMPLATES_UPDATE' | 'MAIN_MENU_UPDATE';

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
