

export type MSXColorValue = string; // Hex string
export type MSX1ColorValue = string; // Hex string for MSX1 palette colors

export interface MSXColor {
  name: string;
  hex: MSXColorValue;
}

export interface MSX1Color {
  name: string;
  hex: MSX1ColorValue;
  index: number; // MSX1 palette index 0-15
}

export type PixelData = MSXColorValue[][]; // Grid of color hex values

export interface LineColorAttribute {
  fg: MSX1ColorValue; // Foreground color for an 8-pixel segment
  bg: MSX1ColorValue; // Background color for an 8-pixel segment
}

export interface TileLogicalProperties {
  mapId: number;       // 0-255, primary byte for encoded properties.
                       // High nibble = familyId (solidity type), Low nibble = instanceId (property flags).
  familyId: number;    // 0-15, derived from mapId. Represents solidity category (e.g., NoSolid, Solid, Platform, Slope).
  instanceId: number;  // 0-15, derived from mapId. Represents property flags (e.g., Breakable, Movable).

  isSolid: boolean;             // Derived from familyId. True if Solid, Platform, or Slope.
  isBreakable: boolean;         // Derived from instanceId (e.g., bit 0).
  isMovable?: boolean;          // Derived from instanceId (e.g., bit 1).
  causesDamage?: boolean;       // Derived from instanceId (e.g., bit 2 - "Deadly").
  isInteractiveSwitch?: boolean;// Derived from instanceId (e.g., bit 3 - "Interactable").
}

export interface Tile {
  id: string;
  name: string;
  width: number; 
  height: number; 
  data: PixelData; 
  lineAttributes?: LineColorAttribute[][]; 
  logicalProperties: TileLogicalProperties; 
}

export interface SpriteFrame {
  id: string;
  data: PixelData; 
}

export type ExplosionType = "Radial" | "Fragmentada" | "Implosión";
export const EXPLOSION_SPRITE_SIZES = [16, 24, 32] as const;
export type ExplosionSpriteSize = typeof EXPLOSION_SPRITE_SIZES[number];

export interface ExplosionParams {
  type: ExplosionType;
  size: ExplosionSpriteSize;
  numFrames: number;
  intensity: number; 
  jitter: number;    
  numSimultaneousColors: 1 | 2 | 3 | 4;
  numFragments?: number; 
  fragmentSpeedVariation?: number; 
}

export type FacingDirection = 'neutral' | 'right' | 'left' | 'up' | 'down';

export interface Sprite {
  id: string;
  name: string;
  size: { width: number; height: number }; 
  spritePalette: [MSXColorValue, MSXColorValue, MSXColorValue, MSXColorValue];
  backgroundColor: MSXColorValue;
  frames: SpriteFrame[];
  currentFrameIndex: number;
  attributes?: Record<string, any>;
  facingDirection?: FacingDirection;
  mirroredHorizontally?: boolean;
  mirroredVertically?: boolean;
}

export interface ScreenTile {
  tileId: string | null; 
  subTileX?: number;      
  subTileY?: number;      
}

export type ScreenLayerData = ScreenTile[][]; 

export enum HUDElementType {
  Score = "Score", HighScore = "HighScore", Lives = "Lives", EnergyBar = "EnergyBar",
  ItemDisplay = "ItemDisplay", SceneName = "SceneName", MiniMap = "MiniMap",
  CoinCounter = "CoinCounter", BossEnergyBar = "BossEnergyBar", PhaseIndicator = "PhaseIndicator",
  AttackAlert = "AttackAlert", TextBox = "TextBox", NumericField = "NumericField", CustomCounter = "CustomCounter",
}

export interface HUDElementProperties_Base {
  name: string;
  text?: string; 
  position: { x: number; y: number }; 
  visible: boolean;
  details?: Record<string, any>; 
  memoryAddress?: string;
}

export interface HUDElement extends HUDElementProperties_Base {
  id: string;
  type: HUDElementType;
}

export interface HUDConfiguration {
  elements: HUDElement[];
}

// --- ECS Core Types ---
export interface ComponentPropertyDefinition {
  name: string;
  type: 'byte' | 'word' | 'boolean' | 'string' | 'color' | 'sprite_ref' | 'sound_ref' | 'behavior_script_ref' | 'entity_template_ref';
  defaultValue?: any;
  description?: string;
}

export interface ComponentDefinition {
  id: string; // Unique ID for this component definition (e.g., "comp_position")
  name: string; // User-friendly name (e.g., "Position")
  properties: ComponentPropertyDefinition[];
  description?: string;
}

export interface EntityTemplateComponent {
  definitionId: string; // ID of the ComponentDefinition
  defaultValues: Record<string, any>; // PropertyName: value
}

export interface EntityTemplate {
  id: string; // Unique ID for this template (e.g., "tpl_player")
  name: string; // User-friendly name (e.g., "Player", "Goomba")
  icon?: string; // Optional icon for the EntityTypeListPanel
  components: EntityTemplateComponent[];
  description?: string;
}

export interface EntityInstance {
  id: string; // Unique instance ID
  entityTemplateId: string; // ID of the EntityTemplate this instance is based on
  name: string; // Display name for this instance
  // Overrides for component property values from the template.
  // Structure: { [componentDefinitionId: string]: { [propertyName: string]: any } }
  componentOverrides: Record<string, Record<string, any>>;
  position: { x: number; y: number }; // Position in screen map cells (editor placement)
}
// --- End ECS Core Types ---

// --- Effect Zone Types ---
export const EFFECT_ZONE_FLAGS = {
  water:          { bit: 0, label: "Water Effect", maskValue: 0b00000001, color: 'rgba(50, 100, 200, 0.4)' },
  customGravity:  { bit: 1, label: "Custom Gravity", maskValue: 0b00000010, color: 'rgba(150, 50, 200, 0.4)' },
  icePhysics:     { bit: 2, label: "Ice Physics", maskValue: 0b00000100, color: 'rgba(100, 200, 255, 0.4)' },
  spriteConceal:  { bit: 3, label: "Sprite Concealment", maskValue: 0b00001000, color: 'rgba(100, 100, 100, 0.4)' },
  // Example for future expansion
  // noCollision:    { bit: 4, label: "Disable Collision", maskValue: 0b00010000, color: 'rgba(200,200,50,0.4)' },
  // triggerEvent:   { bit: 5, label: "Trigger Event", maskValue: 0b00100000, color: 'rgba(255,165,0,0.4)'},
} as const;

export type EffectZoneFlagKey = keyof typeof EFFECT_ZONE_FLAGS;

export interface EffectZone {
  id: string;
  name: string;
  rect: { x: number; y: number; width: number; height: number }; // In grid cells
  mask: number; // byte
  description?: string;
}
// --- End Effect Zone Types ---


export interface ScreenMap {
  id:string;
  name: string;
  width: number; 
  height: number; 
  layers: {
    background: ScreenLayerData;
    collision: ScreenLayerData;
    effects: ScreenLayerData; // This will be de-emphasized in favor of effectZones for new functionality
    entities: EntityInstance[]; 
  };
  effectZones?: EffectZone[]; // New: For rectangular effect zones
  activeAreaX?: number; 
  activeAreaY?: number; 
  activeAreaWidth?: number; 
  activeAreaHeight?: number; 
  hudConfiguration?: HUDConfiguration; 
}

export type ScreenEditorLayerName = keyof ScreenMap['layers'] | 'entities' | 'effects';

export interface CopiedScreenData { // For multi-layer "Clone Grid"
  layers: {
    background: ScreenLayerData;
    collision: ScreenLayerData;
    effects: ScreenLayerData;
  };
  effectZones?: EffectZone[]; // Also copy effect zones if present
  activeAreaX: number;
  activeAreaY: number;
  activeAreaWidth: number;
  activeAreaHeight: number;
  hudConfiguration?: HUDConfiguration; 
  referencedTiles: Tile[]; 
}

export interface CopiedLayerData { // For single layer "Copy Layer"
  layerName: 'background' | 'collision' | 'effects';
  data: ScreenLayerData; // Data is for the active area at time of copy
}


export type ConnectionDirection = 'north' | 'south' | 'east' | 'west';

export interface WorldMapScreenNode {
  id: string; 
  screenAssetId: string; 
  name: string; 
  position: { x: number; y: number }; 
  zone?: string; 
}

export interface WorldMapConnection {
  id: string; 
  fromNodeId: string;
  toNodeId: string;
  fromDirection: ConnectionDirection; 
  toDirection: ConnectionDirection;   
}

export interface WorldMapGraph {
  id: string;
  name: string;
  nodes: WorldMapScreenNode[];
  connections: WorldMapConnection[];
  startScreenNodeId: string | null; 
  gridSize: number; 
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface PSGSoundChannelStep {
  id: string; 
  tonePeriod: number; 
  volume: number; 
  toneEnabled: boolean;
  noiseEnabled: boolean;
  useEnvelope: boolean; 
  durationMs: number; 
}

export interface PSGSoundChannelState {
  id: 'A' | 'B' | 'C';
  steps: PSGSoundChannelStep[];
  loop: boolean; 
}

export interface PSGSoundData {
  id: string; 
  name: string; 
  tempoBPM: number; 
  channels: [PSGSoundChannelState, PSGSoundChannelState, PSGSoundChannelState];
  noisePeriod: number; 
  envelopePeriod: number; 
  envelopeShape: number; 
  masterVolume: number; 
}

export type PT3ChannelId = 'A' | 'B' | 'C';

export interface PT3Instrument {
  id: number; 
  name: string;
  volumeEnvelope?: number[]; 
  toneEnvelope?: number[];   
  volumeLoop?: number;
  toneLoop?: number;
  sampleData?: any; 
  ayEnvelopeShape?: number; 
  ayNoiseEnabled?: boolean;
  ayToneEnabled?: boolean;
}

export interface PT3Ornament {
  id: number; 
  name: string;
  data: number[]; 
  loopPosition?: number;
}

export interface TrackerCell {
  note: string | null; 
  instrument: number | null; 
  ornament: number | null; 
  volume: number | null; 
}

export interface TrackerRow {
  A: TrackerCell;
  B: TrackerCell;
  C: TrackerCell;
}

export interface TrackerPattern {
  id: string;
  name: string;
  numRows: number; 
  rows: TrackerRow[];
}

export interface TrackerSongData {
  id: string;
  name: string;
  title?: string; 
  author?: string; 
  bpm: number; 
  speed: number; 
  globalVolume: number; 
  patterns: TrackerPattern[];
  order: number[]; 
  lengthInPatterns: number; 
  restartPosition: number; 
  instruments: PT3Instrument[];
  ornaments: PT3Ornament[];
  ayHardwareEnvelopePeriod?: number; 
  currentPatternIndexInOrder: number; 
  currentPatternId?: string; 
  currentSongLengthTicks?: number; 
}

export interface PianoKeyLayoutEntry {
  noteNameIndex: number; 
  baseOctave: number;    
}

export interface TileBankScreenZone {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
}

export interface TileAssignment {
  tileId: string; 
  charCode: number; 
}
export interface TileBank {
  id: string; 
  name: string; 
  vramPatternStart: number; 
  vramColorStart: number;   
  screenZone: TileBankScreenZone;
  charsetRangeStart: number;
  charsetRangeEnd: number;   
  defaultFgColorIndex: number; 
  defaultBgColorIndex: number; 
  isLocked: boolean;         
  enabled?: boolean;         
  assignedTiles: Record<string, { charCode: number }>; 
}

export interface BehaviorScript {
  id: string;
  name: string;
  code: string; 
}

export interface BossAttack {
  id: string;
  name: string;
  type: 'Projectile' | 'Melee' | 'Special' | 'Pattern';
  spriteAssetId?: string;
  soundEffectAssetId?: string;
  damage: number;
  speed?: number; 
  duration?: number; 
  cooldown?: number; 
}

export interface BossPhaseWeakPoint {
  x: number; // tile coordinate
  y: number; // tile coordinate
  health: number;
  hitSpriteId?: string;
  destroyedTileId?: string;
}

export interface BossPhase {
  id:string;
  name: string;
  healthThreshold: number; 
  
  buildType: 'sprite' | 'tile';
  spriteAssetId?: string; 
  
  dimensions?: { width: number; height: number };
  tileBankId?: string;
  tileMatrix?: (string | null)[][];
  collisionMatrix?: (boolean)[][];
  weakPoints?: BossPhaseWeakPoint[];

  attackSequence: BossAttack['id'][];
  speedMultiplier?: number;
  defenseMultiplier?: number;
}

export interface Boss {
  id: string;
  name: string;
  totalHealth: number;
  phases: BossPhase[];
  attacks: BossAttack[];
  deathExplosionSpriteId?: string;
  deathSoundId?: string;
}

// --- Main Menu Types ---
export interface MainMenuOption {
  id: string;
  label: string;
  enabled: boolean;
}

export interface MainMenuKeyMapping {
  up: string;
  down: string;
  left: string;
  right: string;
  fire1: string;
  fire2: string;
}

export interface MainMenuSettings {
  volume: number; // 0-15
}

export interface MainMenuContinueScreen {
  title: string;
  prompt: string;
}

export interface MainMenuIntroScreen {
  text: string;
  backgroundAssetId: string | null; // Can be a tile, sprite, or screenmap
}

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

export enum EditorType {
  None = "None", Tile = "Tile", Sprite = "Sprite", Screen = "Screen", Code = "Code",
  Attributes = "Attributes", Sound = "Sound", Platformer = "Platformer", WorldMap = "WorldMap",
  Track = "Track", HUD = "HUD", TileBanks = "TileBanks", Font = "Font", HelpDocs = "HelpDocs",
  BehaviorEditor = "BehaviorEditor",
  ComponentDefinitionEditor = "ComponentDefinitionEditor",
  EntityTemplateEditor = "EntityTemplateEditor",
  Boss = "Boss",
  WorldView = "WorldView",
  MainMenu = "MainMenu",
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'tile' | 'sprite' | 'boss' | 'screenmap' | 'code' | 'sound' | 'worldmap' | 'track' | 'behavior' | 'componentdefinition' | 'entitytemplate';
  data?: Tile | Sprite | ScreenMap | string | WorldMapGraph | PSGSoundData | TrackerSongData | BehaviorScript | ComponentDefinition | EntityTemplate | Boss;
}

export interface Point { x: number; y: number; }
export interface SymmetrySettings { horizontal: boolean; vertical: boolean; diagonalMain: boolean; diagonalAnti: boolean; quadMirror: boolean; }
export type MSXCharacterPattern = number[]; 
export type MSXFont = Record<number, MSXCharacterPattern>; 
export type MSXFontRowColorAttributes = Array<{fg: MSX1ColorValue, bg: MSX1ColorValue}>; 
export type MSXFontColorAttributes = Record<number, MSXFontRowColorAttributes>; 
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
