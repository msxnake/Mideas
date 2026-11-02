/**
 * AI Game Sketch exporter (MSX1 / SCREEN 2 projects).
 *
 * Produces an engine-neutral "blueprint" of a Mideas game that an AI (or a
 * human) can use to rebuild it in Godot, HTML5, MSX2, etc.:
 *   README_AI.md            - guide/prompt for the AI that rebuilds the game
 *   game_sketch.json        - index: design, entities, rules, flow, assets
 *   screens/*.json          - per-screen tile grids, collision map, entities
 *   rules/*.md|json         - state machines (natural + pseudocode + mermaid), game flow, glossary
 *   graphics/x1|xN/...      - PNGs (original pixels and upscaled versions)
 *   audio/music|sfx|instruments + AUDIO_SPEC.md
 *   code/*.asm              - legacy Z80 behaviour scripts (reference only)
 *
 * Pure function (no DOM): returns a list of files that the caller zips.
 */
import type {
  ComponentDefinition,
  EntityInstance,
  EntityTemplate,
  GameFlowGraph,
  GameFlowNode,
  GlobalVariablesAsset,
  MSXFont,
  MSXFontColorAttributes,
  ProjectAsset,
  PSGSoundData,
  ScreenMap,
  ScreenTile,
  Sprite,
  Tile,
  TileLogicalProperties,
  TrackerSongData,
  WorldMapGraph,
} from '../../types';
import type { StateMachine } from '../../statemachine.types';
import { MSX1_PALETTE } from '../../constants';
import {
  RgbaImage,
  ScaleMethod,
  blit,
  createImage,
  encodePng,
  fillImage,
  imageFromPixelData,
  parseCssColor,
  scaleImage,
  setPixel,
} from './png';
import {
  NameResolver,
  SketchStateMachine,
  buildStateMachineSketch,
  keyLabel,
  stateMachineToMarkdown,
} from './rulesToText';
import {
  ACTION_GLOSSARY,
  ART_STYLE_RULES,
  COMPONENT_SEMANTICS,
  CONDITION_GLOSSARY,
  ENEMY_BEHAVIOR_GLOSSARY,
  ENGINE_RULES,
  MSX1_SOURCE_PLATFORM,
  TARGET_HINTS,
} from './knowledge';
import { AUDIO_SPEC_MD, buildInstrumentsSketch, buildSfxSketch, buildSongSketch } from './audioSketch';
import { WAV_SAMPLE_RATE, encodeWav16, renderSfxToWav, renderSongToWav, resolvePlayableSong, type PrerenderedSong } from './audioRender';
import { buildReadmeAi } from './readmeAi';

export const GAME_SKETCH_SCHEMA = 'mideas.game_sketch.v1';

export interface GameSketchOptions {
  /** Extra integer upscale (1 = only original pixels). */
  scale: number;
  scaleMethod: ScaleMethod;
  /** Render songs and sound effects to WAV (default true). */
  audioWav: boolean;
}

export interface GameSketchInput {
  assets: ProjectAsset[];
  currentProjectName: string | null;
  currentScreenMode: string;
  componentDefinitions: ComponentDefinition[];
  entityTemplates: EntityTemplate[];
  msxFont?: MSXFont;
  msxFontColorAttributes?: MSXFontColorAttributes;
  options?: Partial<GameSketchOptions>;
  /** Songs already rendered elsewhere (PT3 via the real player, see pt3CowbellRender.ts), keyed by asset id. */
  prerenderedSongs?: Record<string, PrerenderedSong>;
  /** Injected for deterministic tests. */
  now?: Date;
}

export interface GameSketchFile {
  path: string;
  content: string | Uint8Array;
}

export interface GameSketchResult {
  rootFolder: string;
  files: GameSketchFile[];
  sketch: any;
  warnings: string[];
}

const CELL = 8;
const SCREEN_COLS = 32;
const SCREEN_ROWS = 24;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  const base = String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'item';
}

function makeUniqueSlugger() {
  const used = new Set<string>();
  return (name: string) => {
    const base = slugify(name);
    let s = base;
    let i = 2;
    while (used.has(s)) s = `${base}_${i++}`;
    used.add(s);
    return s;
  };
}

function normId(s: unknown): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const paletteByHex = new Map(MSX1_PALETTE.map(c => [c.hex.toUpperCase(), c]));

function colorName(hex: string | undefined | null): string | null {
  if (!hex) return null;
  const c = paletteByHex.get(String(hex).toUpperCase());
  if (c) return c.index === 0 ? null : c.name;
  const [, , , a] = parseCssColor(hex);
  return a === 0 ? null : String(hex);
}

function paletteHex(index: number | undefined, fallback = 1): string {
  const e = MSX1_PALETTE.find(c => c.index === index) ?? MSX1_PALETTE.find(c => c.index === fallback)!;
  return e.hex;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function charProps(tile: Tile | undefined, sx: number, sy: number): TileLogicalProperties | undefined {
  if (!tile) return undefined;
  return tile.charLogicalProperties?.[`${Math.max(0, sx)},${Math.max(0, sy)}`] || tile.logicalProperties;
}

function propsSummary(p: TileLogicalProperties | undefined) {
  if (!p) return { solid: false };
  const out: Record<string, any> = { solid: !!p.isSolid };
  if (p.causesDamage) out.deadly = true;
  if (p.isBreakable) out.breakable = true;
  if (p.isMovable) out.movable = true;
  if (p.isInteractiveSwitch || p.isInteractable) out.interactive = true;
  if (p.isSolid && p.familyId === 2) out.oneWayPlatform = true;
  if (p.interactionType === ('ladder' as any)) out.ladder = true;
  if (p.interactionType && p.interactionType !== ('none' as any)) out.interaction = { type: p.interactionType, value: p.interactionValue ?? null, target: p.interactionTarget ?? null };
  return out;
}

/** One char per cell. Blocking chars (isSolid in Play mode): # B X D =  (see COLLISION_LEGEND). */
function collisionChar(p: TileLogicalProperties | undefined, present: boolean): string {
  if (!present || !p) return '.';
  if (p.isSolid) {
    // Play mode: one-way (familyId 2) wins over everything; solidity wins over ladder.
    if (p.familyId === 2) return '=';
    if (p.causesDamage) return 'X';
    if (p.isBreakable) return 'B';
    if (p.isInteractiveSwitch || p.isInteractable) return 'D';
    return '#';
  }
  if (p.interactionType === ('ladder' as any)) return 'H';
  if (p.causesDamage) return '!';
  if (p.isBreakable) return 'b';
  if (p.isInteractiveSwitch || p.isInteractable) return 'I';
  if (p.isMovable) return 'M';
  return '-';
}

const COLLISION_LEGEND = {
  '.': 'empty, passable',
  '#': 'solid (blocks)',
  '=': 'one-way platform: solid only when landing from above (may also be deadly, see tileLegend)',
  B: 'solid and breakable (blocks)',
  X: 'solid and deadly (blocks; deadly only for entities with the Deadly Tiles component)',
  D: 'solid and interactive, e.g. door/switch (blocks)',
  H: 'ladder (passable; cancels gravity)',
  '!': 'deadly, passable (deadly when the hitbox centre is on it, ONLY for entities with the Deadly Tiles component, see deadlyTilesEnabled)',
  b: 'breakable, passable',
  I: 'interactive, passable',
  M: 'movable, passable',
  '-': 'tile present but passable',
};
const BLOCKING_CHARS = '#=BXD';

/** Applies the SCREEN 2 per-line colour attribute correction used by the editor/Play renderer. */
function tileCellImage(tile: Tile, sx: number, sy: number): RgbaImage {
  const img = createImage(CELL, CELL);
  for (let py = 0; py < CELL; py++) {
    for (let px = 0; px < CELL; px++) {
      const fx = sx * CELL + px;
      const fy = sy * CELL + py;
      if (fy >= tile.height || fx >= tile.width) continue;
      let color = tile.data?.[fy]?.[fx] as unknown as string | undefined;
      if (color === undefined) continue;
      const attr = tile.lineAttributes?.[fy]?.[Math.floor(fx / 8)];
      if (attr && color !== attr.fg && color !== attr.bg) color = attr.fg as any;
      setPixel(img, px, py, parseCssColor(color));
    }
  }
  return img;
}

function tileFullImage(tile: Tile): RgbaImage {
  const cols = Math.max(1, Math.ceil(tile.width / CELL));
  const rows = Math.max(1, Math.ceil(tile.height / CELL));
  const img = createImage(tile.width, tile.height);
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) blit(img, tileCellImage(tile, cx, cy), cx * CELL, cy * CELL);
  return img;
}

function isPlayerTemplate(tpl: EntityTemplate, defsById: Map<string, ComponentDefinition>): boolean {
  const name = normId(tpl.name);
  const id = normId(tpl.id);
  if (name.includes('fakeplayer') || id.includes('fakeplayer')) return false;
  if (tpl.isPlayer) return true;
  if (name === 'player' || id === 'player' || id === 'tplplayer') return true;
  return tpl.components.some(c => {
    const n = normId(c.definitionId) + '|' + normId(defsById.get(c.definitionId)?.name);
    return n.includes('playerinput') || n.includes('platformercontrol');
  });
}

function componentKey(def: ComponentDefinition | undefined, definitionId: string): string {
  const n = normId(def?.name || definitionId.replace(/^comp_/, ''));
  return n;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

export function buildGameSketch(rawInput: GameSketchInput): GameSketchResult {
  let input = rawInput;
  const scale = Math.max(1, Math.min(8, Math.floor(num(input.options?.scale, 1))));
  const scaleMethod: ScaleMethod = input.options?.scaleMethod === 'nearest' ? 'nearest' : 'smooth';
  const scales = scale > 1 ? [1, scale] : [1];
  const audioWav = input.options?.audioWav !== false;
  const warnings: string[] = [];
  const files: GameSketchFile[] = [];
  const projectName = input.currentProjectName || 'Mideas_Project';
  const rootFolder = `${slugify(projectName)}_ai_sketch`;
  const exportedAt = (input.now ?? new Date()).toISOString();

  const assets = input.assets || [];
  const byType = <T extends object>(t: ProjectAsset['type']) => assets.filter(a => a.type === t && a.data) as unknown as Array<Omit<ProjectAsset, 'data'> & { data: T }>;

  // Normalise legacy/partial data once, so a single old asset can never abort the export.
  const pixelsToCss = (pixels: unknown): string[][] =>
    Array.isArray(pixels)
      ? pixels.map(row => (Array.isArray(row) ? row.map(v => (typeof v === 'number' ? (v === 0 ? 'rgba(0,0,0,0)' : paletteHex(v, 1)) : (v as string))) : []))
      : [];
  const tiles = byType<Tile>('tile').filter(a => {
    const ok = Array.isArray(a.data.data) && num(a.data.width) > 0 && num(a.data.height) > 0;
    if (!ok) warnings.push(`Tile "${a.name}" uses an old format without pixel data/size; it was skipped.`);
    return ok;
  }).map(a => ({ ...a, data: { ...a.data, data: pixelsToCss(a.data.data) as any } }));
  const sprites = byType<Sprite>('sprite').map(a => ({
    ...a,
    data: { ...a.data, frames: (Array.isArray(a.data.frames) ? a.data.frames : []).map(f => ({ ...f, data: pixelsToCss(f?.data) as any })) },
  }));
  const screenAssets = byType<ScreenMap>('screenmap').map(a => ({
    ...a,
    data: { ...a.data, layers: { background: [], collision: [], effects: [], entities: [], ...(a.data.layers || {}) } as ScreenMap['layers'] },
  }));
  const worldAssets = byType<WorldMapGraph>('worldmap').map(a => ({ ...a, data: { ...a.data, nodes: a.data.nodes ?? [], connections: a.data.connections ?? [] } }));
  const flowAssets = byType<GameFlowGraph>('gameflow').map(a => ({ ...a, data: { ...a.data, nodes: a.data.nodes ?? [], connections: a.data.connections ?? [] } }));
  const smAssets = byType<StateMachine>('statemachine').map(a => ({ ...a, data: { ...a.data, states: a.data.states ?? [], transitions: a.data.transitions ?? [] } }));
  const songAssets = byType<TrackerSongData>('track').map(a => ({
    ...a,
    data: { ...a.data, patterns: a.data.patterns ?? [], order: a.data.order ?? [], instruments: a.data.instruments ?? [], ornaments: (a.data.ornaments ?? []).map(o => ({ ...o, data: o.data ?? [] })) },
  }));
  const sfxAssets = byType<PSGSoundData>('sound');
  const globalsAssets = byType<GlobalVariablesAsset>('globalvariables');
  const codeAssets = assets.filter(a => (a.type === 'code' || a.type === 'behavior') && a.data);

  const tileById = new Map<string, Tile>();
  tiles.forEach(a => { tileById.set(a.data.id || a.id, a.data); tileById.set(a.id, a.data); });
  const spriteById = new Map<string, Sprite>();
  sprites.forEach(a => { spriteById.set(a.data.id || a.id, a.data); spriteById.set(a.id, a.data); });
  input = {
    ...input,
    componentDefinitions: (input.componentDefinitions || []).map(d => ({ ...d, properties: d.properties ?? [] })),
    entityTemplates: (input.entityTemplates || []).map(t => ({ ...t, components: t.components ?? [] })),
  };
  const defsById = new Map(input.componentDefinitions.map(d => [d.id, d]));
  const tplById = new Map(input.entityTemplates.map(t => [t.id, t]));

  // Global name resolver (ids -> readable names)
  const names = new Map<string, string>();
  assets.forEach(a => names.set(a.id, a.name));
  tiles.forEach(a => a.data.id && names.set(a.data.id, a.name));
  sprites.forEach(a => a.data.id && names.set(a.data.id, a.name));
  input.entityTemplates.forEach(t => names.set(t.id, t.name));
  flowAssets.forEach(f => f.data.nodes.forEach(n => names.set(n.id, `${n.type}${(n as any).title ? `: ${(n as any).title}` : (n as any).name ? `: ${(n as any).name}` : ''}`)));
  const resolver: NameResolver = { name: id => (typeof id === 'string' ? names.get(id) ?? null : null) };

  const addPng = (path: string, img: RgbaImage) => files.push({ path, content: encodePng(img) });
  /** Writes x1 + scaled versions, returns { x1: path, xN: path }. */
  const addScaledPng = (relPath: string, img: RgbaImage): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const s of scales) {
      const p = `graphics/x${s}/${relPath}`;
      addPng(p, s === 1 ? img : scaleImage(img, s, scaleMethod));
      out[`x${s}`] = p;
    }
    return out;
  };

  // --- palette --------------------------------------------------------------
  const palette = MSX1_PALETTE.map(c => ({ index: c.index, name: c.name, hex: c.index === 0 ? null : c.hex, transparent: c.index === 0 }));
  files.push({ path: 'graphics/palette.json', content: JSON.stringify({ schema: 'mideas.sketch.palette.v1', system: 'MSX1 TMS9918A fixed palette', colors: palette }, null, 2) });

  // --- usage maps (who uses what) -----------------------------------------
  const spriteUsedBy = new Map<string, Set<string>>();
  const smUsedBy = new Map<string, Set<string>>();
  const markUse = (map: Map<string, Set<string>>, id: string, by: string) => {
    if (!map.has(id)) map.set(id, new Set());
    map.get(id)!.add(by);
  };
  const scanValues = (values: Record<string, any>, by: string) => {
    for (const v of Object.values(values || {})) {
      if (typeof v !== 'string') continue;
      if (spriteById.has(v)) markUse(spriteUsedBy, v, by);
      if (smAssets.some(s => s.id === v || s.data.id === v)) markUse(smUsedBy, v, by);
    }
  };
  input.entityTemplates.forEach(t => t.components.forEach(c => scanValues(c.defaultValues, t.name)));
  screenAssets.forEach(s => (s.data.layers?.entities || []).forEach(e => {
    const tname = tplById.get(e.entityTemplateId)?.name ?? e.name;
    Object.values(e.componentOverrides || {}).forEach(v => scanValues(v, tname));
  }));
  smAssets.forEach(sm => (sm.data.states || []).forEach(st => (st.onEnter || []).forEach(a => {
    const sp = a.params?.sprite;
    const hit = sprites.find(s => s.name === sp || s.id === sp);
    if (hit) markUse(spriteUsedBy, hit.data.id || hit.id, `state machine "${sm.name}"`);
  })));

  // --- tiles ----------------------------------------------------------------
  const tileSlug = makeUniqueSlugger();
  tileSlug('tileset_atlas'); // reserved for graphics/xN/tiles/tileset_atlas.png
  const atlasCells: Array<{ index: number; tileId: string; tileName: string; subTile: [number, number]; atlasX: number; atlasY: number; properties: Record<string, any> }> = [];
  const atlasIndexByKey = new Map<string, number>();
  const ATLAS_COLS = 16;
  const tilesSketch = tiles.map(a => {
    const t = a.data;
    const id = t.id || a.id;
    const img = tileFullImage(t);
    const image = addScaledPng(`tiles/${tileSlug(a.name)}.png`, img);
    const cols = Math.max(1, Math.ceil(t.width / CELL));
    const rows = Math.max(1, Math.ceil(t.height / CELL));
    const perChar: Record<string, any> = {};
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const key = `${id}|${cx}|${cy}`;
      const props = propsSummary(charProps(t, cx, cy));
      const index = atlasCells.length + 1; // 0 = empty cell
      atlasIndexByKey.set(key, index);
      if (a.id !== id) atlasIndexByKey.set(`${a.id}|${cx}|${cy}`, index); // screens may reference the asset id
      atlasCells.push({ index, tileId: id, tileName: a.name, subTile: [cx, cy], atlasX: ((index - 1) % ATLAS_COLS) * CELL, atlasY: Math.floor((index - 1) / ATLAS_COLS) * CELL, properties: props });
      if (t.charLogicalProperties?.[`${cx},${cy}`]) perChar[`${cx},${cy}`] = props;
    }
    const colors = Array.from(new Set((t.data || []).flat().map(c => colorName(c as any)).filter(Boolean))) as string[];
    const props = propsSummary(t.logicalProperties);
    const anim = t.animation?.enabled || t.isAnimated ? {
      mode: t.animation?.mode ?? t.animationMode ?? 'frames',
      groupId: t.animation?.groupId ?? t.animationGroup ?? null,
      frameIndex: t.animation?.frameIndex ?? t.animationFrameIndex ?? 0,
      framesPerStep: t.animation?.speed ?? t.animationSpeed ?? null,
      transform: t.animation?.transform ?? null,
    } : null;
    const roleWords = [props.solid ? 'solid' : 'decorative (non-solid)', props.deadly ? 'deadly' : '', props.breakable ? 'breakable' : '', props.interactive ? 'interactive' : ''].filter(Boolean).join(', ');
    return {
      id,
      name: a.name,
      sizePx: [t.width, t.height],
      sizeCells: [cols, rows],
      image,
      colors,
      properties: props,
      ...(Object.keys(perChar).length ? { perCellProperties: perChar } : {}),
      ...(anim ? { animation: anim } : {}),
      description: `${t.width}x${t.height} px tile "${a.name}", ${roleWords}; colours: ${colors.join(', ') || 'none'}.`,
    };
  });

  // tileset atlas (8x8 cells)
  if (atlasCells.length) {
    const rows = Math.ceil(atlasCells.length / ATLAS_COLS);
    const atlas = createImage(ATLAS_COLS * CELL, rows * CELL);
    atlasCells.forEach(c => {
      const t = tileById.get(c.tileId);
      if (t) blit(atlas, tileCellImage(t, c.subTile[0], c.subTile[1]), c.atlasX, c.atlasY);
    });
    const atlasImages = addScaledPng('tiles/tileset_atlas.png', atlas);
    files.push({
      path: 'graphics/tileset_atlas.json',
      content: JSON.stringify({
        schema: 'mideas.sketch.tileset_atlas.v1',
        cellSizePx: CELL,
        columns: ATLAS_COLS,
        images: atlasImages,
        note: 'Every 8x8 cell of every tile asset. Screens reference cells by "index" (0 = empty). atlasX/atlasY are in x1 pixels (multiply by N for graphics/xN).',
        cells: atlasCells,
      }, null, 2),
    });
  }

  // --- sprites --------------------------------------------------------------
  const spriteSlug = makeUniqueSlugger();
  const spritesSketch = sprites.map(a => {
    const s = a.data;
    const id = s.id || a.id;
    const w = s.size?.width || 16;
    const h = s.size?.height || 16;
    const slug = spriteSlug(a.name);
    const frames = (s.frames || []).map((f, i) => {
      const img = imageFromPixelData(f.data as any, w, h);
      return { img, paths: addScaledPng(`sprites/${slug}/frame_${String(i).padStart(2, '0')}.png`, img) };
    });
    let sheet: Record<string, string> | null = null;
    if (frames.length) {
      const strip = createImage(w * frames.length, h);
      frames.forEach((f, i) => blit(strip, f.img, i * w, 0));
      sheet = addScaledPng(`sprites/${slug}/sheet.png`, strip);
    }
    const colors = Array.from(new Set((s.frames || []).flatMap(f => (f.data || []).flat()).map(c => colorName(c as any)).filter(Boolean))) as string[];
    const usedBy = Array.from(spriteUsedBy.get(id) ?? []);
    const hitbox = s.hitbox ? { x: s.hitbox.offsetX, y: s.hitbox.offsetY, width: s.hitbox.width, height: s.hitbox.height } : { x: 0, y: 0, width: w, height: h };
    return {
      id,
      name: a.name,
      sizePx: [w, h],
      frameCount: frames.length,
      frameDurationMs: s.animationSpeedMs ?? 200,
      frameDurationSource: s.animationSpeedMs !== undefined ? 'sprite.animationSpeedMs' : 'Play mode default (200 ms)',
      loops: s.loops ?? true,
      facing: s.facingDirection ?? 'neutral',
      mirroredByDefault: { horizontal: !!s.mirroredHorizontally, vertical: !!s.mirroredVertically },
      hitbox,
      colors,
      images: { frames: frames.map(f => f.paths), sheet, sheetLayout: 'horizontal strip, frame i at x = i * width' },
      usedBy,
      description: `${w}x${h} sprite "${a.name}" with ${frames.length} animation frame(s)${s.animationSpeedMs ? ` at ${s.animationSpeedMs} ms/frame` : ''}, drawn facing ${s.facingDirection ?? 'neutral'}; colours: ${colors.join(', ') || 'none'}${usedBy.length ? `; used by ${usedBy.join(', ')}` : ''}.`,
    };
  });

  // --- fonts ----------------------------------------------------------------
  const fontsSketch: any[] = [];
  const renderFont = (font: MSXFont | undefined, colorsAttr: MSXFontColorAttributes | undefined, slug: string, label: string) => {
    if (!font) return;
    const atlas = createImage(16 * CELL, 16 * CELL);
    let defined = 0;
    for (let code = 0; code < 256; code++) {
      const pat = (font as any)[code] as number[] | undefined;
      if (!pat) continue;
      defined++;
      const ox = (code % 16) * CELL;
      const oy = Math.floor(code / 16) * CELL;
      for (let row = 0; row < 8; row++) {
        const bits = pat[row] ?? 0;
        const rowColors = (colorsAttr as any)?.[code]?.[row];
        const fg = parseCssColor(rowColors?.fg ?? '#FFFFFF');
        for (let bit = 0; bit < 8; bit++) if (bits & (0x80 >> bit)) setPixel(atlas, ox + bit, oy + row, fg[3] ? fg : [255, 255, 255, 255]);
      }
    }
    if (!defined) return;
    fontsSketch.push({
      name: label,
      images: addScaledPng(`fonts/${slug}.png`, atlas),
      layout: '16x16 grid of 8x8 glyphs, glyph for character code c at (c % 16, floor(c / 16)). Codes follow ASCII for 32..127.',
      definedGlyphs: defined,
    });
  };
  renderFont(input.msxFont, input.msxFontColorAttributes, 'project_font', 'Project font (used by menus, text screens and HUD)');
  const fontSlug = makeUniqueSlugger();
  byType<any>('font').forEach(f => renderFont(f.data?.fontData, f.data?.fontColorAttributes, `font_${fontSlug(f.name)}`, `Font asset "${f.name}" (id ${f.id})`));

  // --- entities -------------------------------------------------------------
  const resolveComponents = (tpl: EntityTemplate | undefined, overrides: Record<string, Record<string, any>> = {}) => {
    const out: Record<string, any> = {};
    for (const c of tpl?.components ?? []) {
      const def = defsById.get(c.definitionId);
      const values: Record<string, any> = {};
      (def?.properties || []).forEach(p => { if (p.defaultValue !== undefined) values[p.name] = p.defaultValue; });
      Object.assign(values, c.defaultValues || {}, overrides[c.definitionId] || {});
      out[def?.name || c.definitionId] = values;
    }
    return out;
  };

  const usedDefIds = new Set<string>();
  input.entityTemplates.forEach(t => t.components.forEach(c => usedDefIds.add(c.definitionId)));
  const componentsSketch = input.componentDefinitions.filter(d => usedDefIds.has(d.id)).map(d => {
    const sem = COMPONENT_SEMANTICS[componentKey(d, d.id)];
    return {
      id: d.id,
      name: d.name,
      meaning: sem?.meaning ?? d.description ?? '(custom component: infer from its property names)',
      ...(sem?.formulas ? { formulas: sem.formulas } : {}),
      ...(sem?.ignoredProperties ? { ignoredByPlayMode: sem.ignoredProperties } : {}),
      properties: d.properties.map(p => ({ name: p.name, type: p.type, default: p.defaultValue ?? null, ...(p.description ? { description: p.description } : {}) })),
    };
  });

  const placedTemplateIds = new Set<string>();
  screenAssets.forEach(s => (s.data.layers?.entities || []).forEach(e => placedTemplateIds.add(e.entityTemplateId)));

  const roleOf = (tpl: EntityTemplate): string => {
    if (normId(tpl.name) === 'nucleo') return 'spawn_anchor (not spawned, see engineRules.nucleo)';
    if (isPlayerTemplate(tpl, defsById)) return 'player';
    const comps = tpl.components.map(c => componentKey(defsById.get(c.definitionId), c.definitionId));
    const vals = resolveComponents(tpl);
    const collision = Object.entries(vals).find(([k]) => normId(k) === 'collision')?.[1] as any;
    const layer = num(collision?.collisionLayer, 0);
    if (comps.includes('collectible')) return 'collectible';
    if (comps.includes('spawner')) return 'spawner';
    if (comps.includes('box')) return 'pushable_box';
    if (layer === 4 || normId(tpl.name).includes('bullet')) return 'player_projectile';
    if (layer === 16) return 'enemy_projectile';
    if (layer === 2 || comps.includes('aibehavior') || normId(tpl.name).includes('enemy')) return 'enemy';
    if (layer === 8 || (collision?.isStatic && comps.includes('patrol'))) return 'platform';
    return 'object';
  };

  const templatesSketch = input.entityTemplates
    .filter(t => !t.target || t.target === 'MSX1' || t.target === 'COMMON')
    .map(t => {
      const components = resolveComponents(t);
      const smIds = Object.values(components).flatMap(v => Object.values(v as any)).filter(v => typeof v === 'string' && smAssets.some(s => s.id === v || s.data.id === v)) as string[];
      const spriteIds = Object.values(components).flatMap(v => Object.values(v as any)).filter(v => typeof v === 'string' && spriteById.has(v as string)) as string[];
      const role = roleOf(t);
      return {
        id: t.id,
        name: t.name,
        role,
        placedInScreens: placedTemplateIds.has(t.id),
        components,
        sprites: spriteIds.map(id => ({ id, name: names.get(id) ?? id })),
        deadlyTilesEnabled: t.components.some(c => normId(c.definitionId).includes('deadlytiles') || normId(defsById.get(c.definitionId)?.name).includes('deadlytiles')),
        stateMachines: smIds.map(id => ({ id, name: names.get(id) ?? id })),
        description: `${t.name}: ${role.replace(/_/g, ' ')} built from components ${Object.keys(components).join(', ') || '(none)'}${t.description ? `. ${t.description}` : ''}.`,
      };
    });

  // --- state machines -------------------------------------------------------
  const smSketches: SketchStateMachine[] = smAssets.map(a => buildStateMachineSketch(Object.assign({}, a.data as StateMachine, { id: a.data.id || a.id, name: a.name }), resolver));
  const smUsage = (sm: SketchStateMachine): string[] => {
    const assetId = smAssets.find(a => a.data.id === sm.id || a.id === sm.id)?.id ?? '';
    return Array.from(new Set<string>([...Array.from(smUsedBy.get(sm.id) ?? []), ...Array.from(smUsedBy.get(assetId) ?? [])]));
  };

  // --- screens --------------------------------------------------------------
  const screenSlug = makeUniqueSlugger();
  const screenIndex: any[] = [];
  const screenSlugById = new Map<string, string>();
  for (const a of screenAssets) {
    const s = a.data;
    const slug = screenSlug(a.name);
    screenSlugById.set(a.id, slug);
    if (s.id) screenSlugById.set(s.id, slug);
    const cols = s.width || SCREEN_COLS;
    const rows = s.height || SCREEN_ROWS;
    const bgHex = paletteHex(s.backgroundColor, 1);

    // rendered image (background layer, like Play mode)
    const img = createImage(cols * CELL, rows * CELL);
    fillImage(img, parseCssColor(bgHex));
    const legend = new Map<number, any>();
    const missingTiles = new Map<string, { x: number; y: number; count: number }>();
    const layerGrid = (layer: ScreenTile[][] | undefined) => {
      const grid: number[][] = [];
      for (let y = 0; y < rows; y++) {
        const r: number[] = [];
        for (let x = 0; x < cols; x++) {
          const cell = layer?.[y]?.[x];
          if (!cell?.tileId) { r.push(0); continue; }
          const sx = cell.subTileX ?? 0;
          const sy = cell.subTileY ?? 0;
          const idx = atlasIndexByKey.get(`${cell.tileId}|${sx}|${sy}`);
          if (idx === undefined) {
            if (!missingTiles.has(cell.tileId)) missingTiles.set(cell.tileId, { x, y, count: 0 });
            missingTiles.get(cell.tileId)!.count++;
            r.push(0);
            continue;
          }
          if (!legend.has(idx)) {
            const ac = atlasCells[idx - 1];
            legend.set(idx, { atlasIndex: idx, tileId: ac.tileId, tileName: ac.tileName, subTile: ac.subTile, properties: ac.properties });
          }
          r.push(idx);
        }
        grid.push(r);
      }
      return grid;
    };
    const background = layerGrid(s.layers?.background);
    const collisionLayer = layerGrid(s.layers?.collision);
    const effectsLayer = layerGrid(s.layers?.effects);
    missingTiles.forEach((m, tileId) => warnings.push(`Screen "${a.name}" references missing tile ${tileId} in ${m.count} cell(s) (first at ${m.x},${m.y}); exported as empty.`));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const cell = s.layers?.background?.[y]?.[x];
      const t = cell?.tileId ? tileById.get(cell.tileId) : undefined;
      if (t) blit(img, tileCellImage(t, cell!.subTileX ?? 0, cell!.subTileY ?? 0), x * CELL, y * CELL);
    }
    const image = addScaledPng(`screens/${slug}.png`, img);

    // collision ASCII map
    const behaviorSource = s.behaviorConfig?.source ?? 'collisionLayer';
    const srcLayer = behaviorSource === 'backgroundChars' ? s.layers?.background : s.layers?.collision;
    const collisionMap: string[] = [];
    for (let y = 0; y < rows; y++) {
      let line = '';
      for (let x = 0; x < cols; x++) {
        const cell = srcLayer?.[y]?.[x];
        line += collisionChar(cell?.tileId ? charProps(tileById.get(cell.tileId), cell.subTileX ?? 0, cell.subTileY ?? 0) : undefined, !!cell?.tileId);
      }
      collisionMap.push(line);
    }

    const entities = (s.layers?.entities || []).map((e: EntityInstance) => {
      const tpl = tplById.get(e.entityTemplateId);
      if (!tpl) warnings.push(`Screen "${a.name}": entity "${e.name}" uses missing template ${e.entityTemplateId}.`);
      const resolved = resolveComponents(tpl, e.componentOverrides || {});
      // Play spawns placed entities at cell*8, or at Patrol waypoint1 when set; Position x/y is ignored.
      // Play only reads template defaultValues + instance overrides (never the component definition
      // defaults), so waypoints that only exist as definition defaults do not count.
      const patrolTplComp = tpl?.components.find(c => normId(defsById.get(c.definitionId)?.name || c.definitionId).includes('patrol'));
      const patrol = patrolTplComp ? { ...(patrolTplComp.defaultValues || {}), ...((e.componentOverrides || {})[patrolTplComp.definitionId] || {}) } as any : null;
      const spawn = patrol && patrol.waypoint1_x !== undefined && patrol.waypoint1_y !== undefined
        ? { x: Number(patrol.waypoint1_x), y: Number(patrol.waypoint1_y), source: 'Patrol.waypoint1' }
        : { x: e.position.x * CELL, y: e.position.y * CELL, source: 'cell * 8' };
      for (const key of Object.keys(resolved)) if (normId(key) === 'position') delete resolved[key];
      return {
        id: e.id,
        name: e.name,
        templateId: e.entityTemplateId,
        templateName: tpl?.name ?? null,
        role: tpl ? roleOf(tpl) : 'unknown',
        cell: { x: e.position.x, y: e.position.y },
        pixel: { x: e.position.x * CELL, y: e.position.y * CELL },
        spawnPixel: spawn,
        overrides: e.componentOverrides || {},
        resolvedComponents: resolved,
        ...(e.jobRate && e.jobRate !== 100 ? { updateRatePercent: e.jobRate } : {}),
      };
    });

    const hud = s.hudConfiguration?.elements?.length ? {
      elements: s.hudConfiguration.elements.map(el => ({ type: el.type, name: el.name, text: el.text ?? null, pixel: el.position, visible: el.visible, details: el.details ?? {} })),
      hasImportedFrame: !!s.hudConfiguration.importedFrame,
    } : null;

    const activeArea = { x: s.activeAreaX ?? 0, y: s.activeAreaY ?? 0, width: s.activeAreaWidth ?? cols, height: s.activeAreaHeight ?? rows, unit: 'cells' };
    const screenJson = {
      schema: 'mideas.sketch.screen.v1',
      id: s.id || a.id,
      assetId: a.id,
      name: a.name,
      kind: s.screenKind ?? 'playable',
      engine: s.screenEngine ?? ((s.screenKind ?? 'playable') === 'playable' ? 'player' : 'fakePlayer'),
      sizeCells: [cols, rows],
      sizePx: [cols * CELL, rows * CELL],
      backgroundColor: { index: s.backgroundColor ?? 1, hex: bgHex },
      borderColor: s.borderColor !== undefined ? { index: s.borderColor, hex: paletteHex(s.borderColor) } : null,
      activeArea,
      image,
      tileLegend: Array.from(legend.values()).sort((x, y) => x.atlasIndex - y.atlasIndex),
      layers: {
        note: 'Each number is an index into graphics/tileset_atlas.json cells (0 = empty). Row-major [y][x], 32x24 cells of 8x8 px.',
        background: background,
        collision: collisionLayer,
        effects: effectsLayer,
      },
      collisionSource: behaviorSource === 'backgroundChars' ? 'background layer tiles' : 'collision layer tiles',
      collisionMap: {
        legend: COLLISION_LEGEND,
        blockingChars: BLOCKING_CHARS,
        rows: collisionMap,
      },
      entities,
      effectZones: (s.effectZones || []).map(z => ({
        name: z.name,
        type: z.effectType ?? 'secretZone',
        rectCells: z.rect,
        rectPx: { x: z.rect.x * CELL, y: z.rect.y * CELL, width: z.rect.width * CELL, height: z.rect.height * CELL },
        params: z.params ?? {},
        ...(z.description ? { description: z.description } : {}),
      })),
      hud,
    };
    files.push({ path: `screens/${slug}.json`, content: JSON.stringify(screenJson, null, 2) });
    const solidCount = collisionMap.join('').split('').filter(ch => BLOCKING_CHARS.includes(ch)).length;
    screenIndex.push({
      id: screenJson.id,
      assetId: a.id,
      name: a.name,
      kind: screenJson.kind,
      file: `screens/${slug}.json`,
      image,
      entityCount: entities.length,
      summary: `${a.name}: ${entities.length} entities (${Array.from(new Set(entities.map(e => e.templateName).filter(Boolean))).join(', ') || 'none'}), ${solidCount} solid cells${hud ? `, HUD with ${hud.elements.length} elements` : ''}.`,
    });
  }

  // --- worlds ---------------------------------------------------------------
  const worldsSketch = worldAssets.map(w => {
    const nodeById = new Map(w.data.nodes.map(n => [n.id, n]));
    const screenName = (nodeId: string) => {
      const n = nodeById.get(nodeId);
      return n ? names.get(n.screenAssetId) ?? n.name : nodeId;
    };
    const lines = ['flowchart LR'];
    const mid = new Map(w.data.nodes.map((n, i) => [n.id, `s${i}`] as const));
    w.data.nodes.forEach(n => lines.push(`    ${mid.get(n.id)}["${String(names.get(n.screenAssetId) ?? n.name).replace(/"/g, "'")}"]`));
    w.data.connections.forEach(c => {
      if (mid.has(c.fromNodeId) && mid.has(c.toNodeId)) lines.push(`    ${mid.get(c.fromNodeId)} -- ${c.fromDirection} --> ${mid.get(c.toNodeId)}`);
    });
    return {
      id: w.id,
      name: w.name,
      startScreen: w.data.startScreenNodeId ? screenName(w.data.startScreenNodeId) : null,
      screens: w.data.nodes.map(n => ({ nodeId: n.id, screenAssetId: n.screenAssetId, screenName: names.get(n.screenAssetId) ?? n.name, file: screenSlugById.has(n.screenAssetId) ? `screens/${screenSlugById.get(n.screenAssetId)}.json` : null, editorPosition: n.position, ...(n.zone ? { zone: n.zone } : {}) })),
      connections: w.data.connections.map(c => ({
        from: screenName(c.fromNodeId),
        exitThrough: c.fromDirection,
        to: screenName(c.toNodeId),
        enterFrom: c.toDirection,
        transition: c.transitionMode ?? 'preserve (keep the other coordinate)',
        ifBlocked: c.ifBlocked ?? 'deny',
        ...(c.entryPoint ? { entryPointPx: c.entryPoint } : {}),
        natural: `Leaving "${screenName(c.fromNodeId)}" through its ${c.fromDirection} border enters "${screenName(c.toNodeId)}" from its ${c.toDirection} border${c.transitionMode?.startsWith('preserve') || !c.transitionMode ? ' keeping the other coordinate' : ''}; and the reverse: leaving "${screenName(c.toNodeId)}" through its ${c.toDirection} border enters "${screenName(c.fromNodeId)}".`,
      })),
      navigation: 'Flip-screen, connections are bidirectional. Exact algorithm (active area, entry position, 300 ms lock, limit_on walls): game_sketch.json > engineRules.screenExits.',
      mermaid: lines.join('\n'),
    };
  });

  // --- game flow ------------------------------------------------------------
  const describeNode = (n: GameFlowNode): string => {
    const x = n as any;
    switch (n.type) {
      case 'Start': return 'Entry point of the game.';
      case 'SubMenu': return `Menu "${x.title}" with options: ${(x.options || []).map((o: any) => `"${o.text}"`).join(', ')}. Each option follows its own output connection.`;
      case 'Controls': return `Controls/redefine screen "${x.title}" (MSX keyboard: button 1 = ${x.keyboardButton1 ?? 'SPC'}, button 2 = ${x.keyboardButton2 ?? 'N'}; the same key is used by Play mode and the ROM, see engineRules.inputs).`;
      case 'WorldLink': return `GAMEPLAY: play the world "${names.get(x.worldAssetId) ?? x.worldAssetId}" starting at its start screen until a rule exits the world (EXIT_CURRENT_WORLD) or jumps to another node (CHANGE_GAME_FLOW_NODE). Running out of lives does not end it by itself.`;
      case 'End': return `${x.endType === 'Victory' ? 'VICTORY' : 'GAME OVER'} ending: "${x.message}".`;
      case 'Text': return `Text screen "${x.title}": "${x.message}". Waits for fire/space.`;
      case 'TextScroll':
      case 'TextScrollColor':
      case 'TextScroll2': return `Scrolling text "${x.title}" (${x.speedFrames} frames per step): "${String(x.text || '').slice(0, 300)}".`;
      case 'Restart': return `Restart / game-over screen "${x.title}": "${x.message}", then the game restarts.`;
      case 'Waypoint': return 'Routing point (no visual).';
      case 'Music': return x.stop ? 'Stop the music.' : `Play music "${names.get(x.trackAssetId) ?? x.trackAssetId}"${x.loop === false ? ' once' : ' in a loop'}.`;
      case 'Transition': return `Screen transition effect "${x.effect}"${x.duration ? ` (${x.duration} ms)` : ''}.`;
      case 'Group': return `Run the sub flow "${names.get(x.gameFlowAssetId) ?? x.name}".`;
      case 'IfThenElse': return `Branch: if global ${x.variableName} ${x.operator ?? '=='} "${x.compareValue}" follow the "then" output, otherwise the "else" output.`;
      case 'Globals': return `Initialise global variables: ${(x.variables || []).map((v: any) => `${v.name} = ${v.value}`).join(', ') || '(none)'}.`;
      case 'PresentationScreen': return `Show presentation screen "${names.get(x.presentationScreenAssetId) ?? x.presentationScreenAssetId}".`;
      default: return `${(n as any).type} node.`;
    }
  };
  const flowsSketch = flowAssets.map(f => {
    const g = f.data;
    const lines = ['flowchart TD'];
    const mid = new Map(g.nodes.map((n, i) => [n.id, `n${i}`] as const));
    g.nodes.forEach(n => lines.push(`    ${mid.get(n.id)}["${String(names.get(n.id) ?? n.type).replace(/"/g, "'").slice(0, 50)}"]`));
    g.connections.forEach(c => {
      if (!mid.has(c.from?.nodeId) || !mid.has(c.to?.nodeId)) return;
      lines.push(`    ${mid.get(c.from.nodeId)} -->${c.from.sourceId ? `|${String(c.from.sourceId).replace(/[|"]/g, '')}|` : ''} ${mid.get(c.to.nodeId)}`);
    });
    // Order nodes as the player meets them: breadth-first from the start node,
    // then any node not reachable from it (kept, but flagged).
    const order: string[] = [];
    const seen = new Set<string>();
    const queue = [g.startNodeId ?? g.nodes.find(n => n.type === 'Start')?.id].filter(Boolean) as string[];
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      order.push(id);
      g.connections.filter(c => c.from.nodeId === id).forEach(c => queue.push(c.to.nodeId));
    }
    const rank = new Map(order.map((id, i) => [id, i]));
    const sortedNodes = [...g.nodes].sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));
    return {
      id: f.id,
      name: f.name,
      startNodeId: g.startNodeId,
      nodes: sortedNodes.map(n => {
        const { id, type, position, ...data } = n as any;
        return { id, type, label: names.get(id) ?? type, reachableFromStart: seen.has(id), natural: describeNode(n), data };
      }),
      connections: g.connections.map(c => ({ from: c.from.nodeId, port: c.from.sourceId ?? null, to: c.to.nodeId, natural: `${names.get(c.from.nodeId) ?? c.from.nodeId}${c.from.sourceId ? ` [${c.from.sourceId}]` : ''} -> ${names.get(c.to.nodeId) ?? c.to.nodeId}` })),
      mermaid: lines.join('\n'),
    };
  });

  // --- globals --------------------------------------------------------------
  const globalsSketch = globalsAssets.flatMap(g => (g.data.customVariables || []).map((v: any) => ({
    name: v.name, type: v.type ?? 'byte', description: v.description || null, category: v.category ?? null, values: v.values ?? [],
  })));

  // --- audio ----------------------------------------------------------------
  const audioSlug = makeUniqueSlugger();
  const musicIndex = songAssets.map(a => {
    const slug = audioSlug(a.name);
    const playable = resolvePlayableSong(a.data);
    playable.notes.forEach(n => n.includes('could not') && warnings.push(`Song "${a.name}": ${n}`));
    const hasRows = (playable.song.order?.length ?? 0) > 0 && (playable.song.patterns?.length ?? 0) > 0;
    const song: any = buildSongSketch(playable.song, a.id, a.name);
    if (playable.decodedFromPt3) song.notes.push('Patterns and instruments were decoded from the embedded PT3 module (instrumentMode "pt3-sample").');
    const inst = buildInstrumentsSketch(playable.song);
    const instPath = `audio/instruments/${slug}_instruments.json`;
    song.instrumentsFile = instPath;
    let wav: any = null;
    const pre = input.prerenderedSongs?.[a.id];
    if (audioWav && playable.song.soundChip === 'SCC') warnings.push(`Song "${a.name}": SCC-only song, no WAV (the SCC chip is not rendered yet); rebuild it from its JSON.`);
    if (pre?.error) warnings.push(`Song "${a.name}": ${pre.error}`);
    if (audioWav && pre && !pre.error) {
      const wavPath = `audio/music/${slug}.wav`;
      const loop = pre.loopStartSample !== null && pre.loopStartSample < pre.samples.length ? { start: pre.loopStartSample, end: pre.samples.length } : null;
      files.push({ path: wavPath, content: encodeWav16(pre.samples, pre.sampleRate, loop) });
      wav = {
        file: wavPath,
        format: `PCM 16-bit mono ${pre.sampleRate} Hz`,
        engine: pre.engine,
        durationMs: Math.round((pre.samples.length / pre.sampleRate) * 1000),
        loop: loop ? { startSample: loop.start, endSample: loop.end, startMs: Math.round((loop.start / pre.sampleRate) * 1000), embeddedSmplChunk: true } : null,
        notes: pre.notes,
      };
      pre.notes.forEach(n => warnings.push(`Song "${a.name}": ${n}`));
    } else if (audioWav && hasRows && playable.song.soundChip !== 'SCC') {
      try {
        const r = renderSongToWav(playable.song);
        const wavPath = `audio/music/${slug}.wav`;
        files.push({ path: wavPath, content: r.wav });
        wav = {
          file: wavPath,
          format: `PCM 16-bit mono ${r.sampleRate} Hz`,
          engine: 'Mideas AYRegisterSynthesizer with Play mode timing',
          durationMs: r.durationMs,
          loop: r.loopStartSample !== null ? { startSample: r.loopStartSample, endSample: r.loopEndSample, startMs: Math.round((r.loopStartSample / r.sampleRate) * 1000), embeddedSmplChunk: true } : null,
          notes: r.notes,
        };
        r.notes.forEach(n => warnings.push(`Song "${a.name}": ${n}`));
      } catch (err) {
        warnings.push(`Song "${a.name}": WAV rendering failed (${(err as Error)?.message ?? err}).`);
      }
    }
    (song as any).wav = wav;
    files.push({ path: `audio/music/${slug}.json`, content: JSON.stringify(song, null, 2) });
    files.push({ path: instPath, content: JSON.stringify(inst, null, 2) });
    return { id: a.id, name: a.name, title: song.title, chip: song.soundChip, durationSeconds: song.timing.approxSongDurationSeconds, file: `audio/music/${slug}.json`, wavFile: wav?.file ?? null, loop: wav?.loop ?? null, instrumentsFile: instPath };
  });
  const sfxIndex = sfxAssets.map(a => {
    const slug = audioSlug(a.name);
    const sfx: any = buildSfxSketch(a.data, a.id, a.name);
    sfx.wavFile = null;
    if (audioWav) {
      try {
        const r = renderSfxToWav(a.data);
        sfx.wavFile = `audio/sfx/${slug}.wav`;
        files.push({ path: sfx.wavFile, content: r.wav });
        if (r.notes.length) sfx.wavNotes = r.notes;
      } catch (err) {
        warnings.push(`Sound effect "${a.name}": WAV rendering failed (${(err as Error)?.message ?? err}).`);
      }
    }
    files.push({ path: `audio/sfx/${slug}.json`, content: JSON.stringify(sfx, null, 2) });
    return { id: a.id, name: a.name, durationMs: sfx.durationMs, file: `audio/sfx/${slug}.json`, wavFile: sfx.wavFile };
  });
  if (musicIndex.length || sfxIndex.length) files.push({ path: 'audio/AUDIO_SPEC.md', content: AUDIO_SPEC_MD });

  // --- code (legacy z80 behaviours) ----------------------------------------
  const codeSlug = makeUniqueSlugger();
  const codeIndex = codeAssets.map(a => {
    const code = typeof a.data === 'string' ? a.data : (a.data as any)?.code ?? '';
    const path = `code/${codeSlug(a.name)}.asm`;
    files.push({ path, content: String(code) });
    return { id: a.id, name: a.name, file: path, note: 'Z80 assembly used by the original MSX build. Read it to infer the behaviour; do not port it literally.' };
  });

  // --- summary / genre guess -----------------------------------------------
  const playerTpls = templatesSketch.filter(t => t.role === 'player' && t.placedInScreens);
  const allCompKeys = new Set(playerTpls.flatMap(t => Object.keys(t.components).map(normId)));
  const genre = allCompKeys.has('pacmanmovement') || allCompKeys.has('pacmanmovementv2') ? 'maze (Pac-Man like)'
    : allCompKeys.has('jump') && allCompKeys.has('gravity') ? 'platformer (flip-screen)'
    : allCompKeys.has('shoot') && !allCompKeys.has('gravity') ? 'shooter'
    : allCompKeys.has('cursors') ? 'top-down / free movement'
    : 'unknown (infer from screens and rules)';
  const keys = new Set<string>();
  const collectKeys = (c: any) => {
    if (!c) return;
    if ((c.type === 'KEY_PRESSED' || c.type === 'KEY_RELEASED' || c.type === 'KEY_AND_MOVEMENT') && c.params?.key) keys.add(String(c.params.key));
    (c.conditions || []).forEach(collectKeys);
  };
  smAssets.forEach(sm => sm.data.transitions.forEach(t => collectKeys(t.conditions)));
  const controls = [
    ...(playerTpls.length ? [allCompKeys.has('cursors') ? 'Cursor keys / joystick: move the player (Cursors component).' : 'The player has no Cursors component: Mideas Play mode does not move it (its movement component is declared but not implemented; see engineRules.playVsRom).'] : []),
    ...(allCompKeys.has('jump') ? ['SPACE (joystick button 1): jump.'] : []),
    ...(allCompKeys.has('shoot') ? ['X (or the Shoot.fireKey; N in char mode): fire.'] : []),
    ...(allCompKeys.has('carry') ? ['Z (or DOWN + fire): pick up / drop a box.'] : []),
    ...Array.from(new Set(Array.from(keys).map(keyLabel))).map(k => `Key ${k}: used by state machine rules (see rules/state_machines.md).`),
  ];

  const notIncluded: Record<string, number> = {};
  (['boss', 'dialogue', 'portrait', 'presentationscreen'] as const).forEach(t => {
    const n = assets.filter(a => a.type === t).length;
    if (n) notIncluded[t] = n;
  });

  // --- rules files ----------------------------------------------------------
  const smMd = ['# State machines (game rules)', '', 'Rules are CONDITIONS checked every frame (60 per second). Exception: ON_WALL_COLLISION reads queued wall events that stay pending until a transition of the entity fires (see rules/glossary.json).', 'Each rule is given in plain English, then as engine-neutral pseudocode. The exact original data is in game_sketch.json > stateMachines[].transitions[].raw.', ''];
  smSketches.forEach(sm => smMd.push(stateMachineToMarkdown(sm, smUsage(sm))));
  if (!smSketches.length) smMd.push('_This project has no state machines. Behaviour comes from components (see game_sketch.json > entities)._');
  files.push({ path: 'rules/state_machines.md', content: smMd.join('\n') });

  const flowMd = ['# Game flow', '', 'The game flow is the top-level sequence of screens: menus, intro texts, gameplay (WorldLink), game over, victory.', ''];
  flowsSketch.forEach(f => {
    flowMd.push(`## ${f.name}`, '', '```mermaid', f.mermaid, '```', '');
    f.nodes.forEach(n => flowMd.push(`- **${n.label}** (\`${n.id}\`): ${n.natural}`));
    flowMd.push('', '### Connections', ...f.connections.map(c => `- ${c.natural}`), '');
  });
  worldsSketch.forEach(w => {
    flowMd.push(`## World map: ${w.name}`, '', `Start screen: **${w.startScreen ?? '(none)'}**. ${w.navigation}`, '', '```mermaid', w.mermaid, '```', '');
    w.connections.forEach(c => flowMd.push(`- ${c.natural}`));
    flowMd.push('');
  });
  files.push({ path: 'rules/game_flow.md', content: flowMd.join('\n') });
  files.push({
    path: 'rules/glossary.json',
    content: JSON.stringify({ schema: 'mideas.sketch.glossary.v1', conditions: CONDITION_GLOSSARY, actions: ACTION_GLOSSARY, components: COMPONENT_SEMANTICS, enemyBehaviors: ENEMY_BEHAVIOR_GLOSSARY }, null, 2),
  });

  // --- main index -----------------------------------------------------------
  const sketch = {
    schema: GAME_SKETCH_SCHEMA,
    exportedAt,
    generator: 'Mideas MSX - Files > Export > Sketch IA',
    readFirst: 'README_AI.md',
    project: { name: projectName, screenMode: input.currentScreenMode, sourcePlatform: MSX1_SOURCE_PLATFORM },
    summary: {
      genreGuess: genre,
      players: playerTpls.map(t => t.name),
      controls,
      counts: { screens: screenIndex.length, worlds: worldsSketch.length, tiles: tilesSketch.length, sprites: spritesSketch.length, entityTemplates: templatesSketch.length, stateMachines: smSketches.length, songs: musicIndex.length, soundEffects: sfxIndex.length },
    },
    coordinateSystem: {
      logicalResolution: [256, 192],
      cellSizePx: CELL,
      gridCells: [SCREEN_COLS, SCREEN_ROWS],
      origin: 'top-left, y grows downwards',
      units: 'All positions/sizes/speeds are in logical (x1) pixels; speeds in pixels per frame; 1 frame = 1/60 s.',
      entityPosition: 'Each placed entity spawns at its spawnPixel (cell * 8, or Patrol waypoint1), top-left of the sprite; `pixel` is only the editor cell * 8.',
    },
    graphics: {
      scales: scales.map(s => `x${s}`),
      scaleMethod: scale > 1 ? (scaleMethod === 'smooth' ? 'Scale2x/Scale3x pixel-art filter (no new colours)' : 'nearest neighbour') : 'none',
      palette: 'graphics/palette.json',
      tilesetAtlas: atlasCells.length ? 'graphics/tileset_atlas.json' : null,
      styleRules: ART_STYLE_RULES,
      tiles: tilesSketch,
      sprites: spritesSketch,
      fonts: fontsSketch,
    },
    screens: screenIndex,
    worlds: worldsSketch,
    gameFlows: flowsSketch.map(f => ({ ...f, mermaid: undefined, doc: 'rules/game_flow.md' })),
    entities: {
      howItWorks: 'Entity-Component-System: an entity template is a list of components with values; screens place instances of templates (with per-instance overrides). Systems run every frame: input -> movement/physics -> tile collision -> entity collision -> state machines -> animation -> render.',
      collisionLayers: COMPONENT_SEMANTICS.collision.formulas,
      components: componentsSketch,
      templates: templatesSketch,
    },
    stateMachines: smSketches.map(sm => ({ ...sm, usedBy: smUsage(sm), doc: 'rules/state_machines.md' })),
    globals: globalsSketch,
    audio: {
      spec: musicIndex.length || sfxIndex.length ? 'audio/AUDIO_SPEC.md' : null,
      wav: audioWav ? {
        format: `PCM 16-bit mono ${WAV_SAMPLE_RATE} Hz`,
        renderedWith: 'PT3 songs: the real ZXPT3 Z80 player + Cowbell AYChip (as the tracker plays PT3). Native Mideas songs: the Mideas AY emulation with Play mode timing. Songs are peak-normalized to 0.9.',
        songs: 'Rendered with the Mideas Play mode timing, once from order[0] to the end. The loop region (order[restartPosition] to the end) is stored in a RIFF "smpl" chunk: Godot 4 loops it automatically (import option Loop Mode = "Detect From WAV", the default).',
        soundEffects: 'One-shot, no loop.',
      } : null,
      music: musicIndex,
      soundEffects: sfxIndex,
    },
    code: codeIndex,
    engineRules: ENGINE_RULES,
    targetHints: TARGET_HINTS,
    notIncludedInThisVersion: Object.keys(notIncluded).length ? { assets: notIncluded, note: 'These asset types exist in the project but are not described in sketch v1.' } : null,
    warnings,
  };

  files.push({ path: 'game_sketch.json', content: JSON.stringify(sketch, null, 2) });
  files.push({ path: 'README_AI.md', content: buildReadmeAi(sketch) });

  return { rootFolder, files, sketch, warnings };
}
