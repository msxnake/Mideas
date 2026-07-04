/**
 * Autotile (terrain) core for SCREEN 5 bitmap rooms.
 *
 * A terrain maps neighbour masks to atlas entries so the terrain brush chooses corners,
 * edges and centres automatically while painting. Editor-only: the result is written into
 * the ordinary `tileGrid` (atlas index + 1 per cell), so the MSX2 room generator, the
 * runtime engine and the ROM output are untouched.
 *
 * Masks are 8-bit from day one so the 16-tile blob template can grow into the 47-tile
 * Wang template without a data migration:
 *   bit0 N, bit1 E, bit2 S, bit3 W, bit4 NE, bit5 SE, bit6 SW, bit7 NW
 * (bit set = that neighbour belongs to the same terrain). blob16 canonicalisation drops
 * the diagonals; wang47 keeps a diagonal only when both adjacent cardinals are set
 * (standard Wang blob reduction -> 47 canonical masks).
 */

import { Msx2BitmapAutoTerrain, Msx2BitmapAutoTerrainVariant, Msx2BitmapRoomAtlasEntry } from '../types';

export const AUTOTILE_BIT = {
  n: 1, e: 2, s: 4, w: 8,
  ne: 16, se: 32, sw: 64, nw: 128,
} as const;

/** Neighbour offsets in bit order: bit i corresponds to AUTOTILE_NEIGHBOR_OFFSETS[i]. */
export const AUTOTILE_NEIGHBOR_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },  // N
  { dx: 1, dy: 0 },   // E
  { dx: 0, dy: 1 },   // S
  { dx: -1, dy: 0 },  // W
  { dx: 1, dy: -1 },  // NE
  { dx: 1, dy: 1 },   // SE
  { dx: -1, dy: 1 },  // SW
  { dx: -1, dy: -1 }, // NW
];

/**
 * Standard 4x4 blob16 template layout (row-major), expressed as cardinal masks.
 * Matches the classic autotile template image:
 *   row 0: TL corner, top edge,    TR corner, vertical top cap
 *   row 1: left edge, centre,      right edge, vertical middle
 *   row 2: BL corner, bottom edge, BR corner, vertical bottom cap
 *   row 3: H left cap, H middle,   H right cap, isolated
 */
export const BLOB16_LAYOUT_MASKS: ReadonlyArray<number> = [
  6, 14, 12, 4,
  7, 15, 13, 5,
  3, 11, 9, 1,
  2, 10, 8, 0,
];

/** Human labels for the blob16 layout positions, for import previews/tooltips. */
export const BLOB16_LAYOUT_LABELS: ReadonlyArray<string> = [
  'esquina NO', 'borde N', 'esquina NE', 'tapa N',
  'borde O', 'centro', 'borde E', 'tubo vertical',
  'esquina SO', 'borde S', 'esquina SE', 'tapa S',
  'tapa O', 'tubo horizontal', 'tapa E', 'aislado',
];

/**
 * The 47 canonical wang47 masks in ascending numeric order. A mask is canonical when every
 * diagonal bit it carries has both adjacent cardinals set (i.e. canonicalize(m) === m).
 * This ascending order IS the import template layout: 8 columns x 6 rows, row-major, with
 * the 48th (last) cell unused. Artists paint over the downloadable guide PNG, so the order
 * only needs to be deterministic, not visually mnemonic.
 */
export const WANG47_CANONICAL_MASKS: ReadonlyArray<number> = (() => {
  const out: number[] = [];
  for (let mask = 0; mask < 256; mask++) {
    if (canonicalizeAutotileMask(mask, 'wang47') === mask) out.push(mask);
  }
  return out;
})();

export interface AutotileTemplateSpec {
  template: Msx2BitmapAutoTerrain['template'];
  columns: number;
  rows: number;
  /** Canonical mask per template cell (row-major); null = unused filler cell. */
  masks: ReadonlyArray<number | null>;
  /** Expected source image size in px (cells x 16). */
  width: number;
  height: number;
}

/** Import-template geometry + cell->mask table for each supported template. */
export function autotileTemplateSpec(template: Msx2BitmapAutoTerrain['template']): AutotileTemplateSpec {
  if (template === 'wang47') {
    return {
      template,
      columns: 8,
      rows: 6,
      masks: [...WANG47_CANONICAL_MASKS, null],
      width: 8 * 16,
      height: 6 * 16,
    };
  }
  return { template: 'blob16', columns: 4, rows: 4, masks: BLOB16_LAYOUT_MASKS, width: 64, height: 64 };
}

/** Reduces a raw 8-bit neighbour mask to the canonical key used by the terrain mapping. */
export function canonicalizeAutotileMask(mask: number, template: Msx2BitmapAutoTerrain['template']): number {
  const cardinals = mask & 0x0f;
  if (template === 'blob16') return cardinals;
  // wang47: a diagonal only matters when both adjacent cardinals are also terrain.
  let out = cardinals;
  if ((cardinals & (AUTOTILE_BIT.n | AUTOTILE_BIT.e)) === (AUTOTILE_BIT.n | AUTOTILE_BIT.e)) out |= mask & AUTOTILE_BIT.ne;
  if ((cardinals & (AUTOTILE_BIT.s | AUTOTILE_BIT.e)) === (AUTOTILE_BIT.s | AUTOTILE_BIT.e)) out |= mask & AUTOTILE_BIT.se;
  if ((cardinals & (AUTOTILE_BIT.s | AUTOTILE_BIT.w)) === (AUTOTILE_BIT.s | AUTOTILE_BIT.w)) out |= mask & AUTOTILE_BIT.sw;
  if ((cardinals & (AUTOTILE_BIT.n | AUTOTILE_BIT.w)) === (AUTOTILE_BIT.n | AUTOTILE_BIT.w)) out |= mask & AUTOTILE_BIT.nw;
  return out;
}

/**
 * Set of atlas entry ids that count as "this terrain" when reading neighbours.
 * Includes variant tiles: a grassier centre must still read as terrain to its neighbours.
 */
export const terrainAtlasEntryIds = (terrain: Msx2BitmapAutoTerrain): Set<string> => {
  const ids = new Set(Object.values(terrain.mapping || {}));
  Object.values(terrain.variants || {}).forEach(list =>
    (list || []).forEach(variant => ids.add(variant.entryId))
  );
  return ids;
};

/** Spanish position label for the cardinal part of a mask (bit set = neighbour present). */
const CARDINAL_MASK_LABELS: Record<number, string> = {
  0: 'aislado', 1: 'tapa S', 2: 'tapa O', 3: 'esquina SO', 4: 'tapa N', 5: 'tubo vertical',
  6: 'esquina NO', 7: 'borde O', 8: 'tapa E', 9: 'esquina SE', 10: 'tubo horizontal',
  11: 'borde S', 12: 'esquina NE', 13: 'borde E', 14: 'borde N', 15: 'centro',
};

/**
 * Human label for a canonical mask, for variant pickers/tooltips. For wang47, masks whose
 * allowed diagonals are not all present get an inner-corner count suffix.
 */
export function describeAutotileMask(mask: number, template: Msx2BitmapAutoTerrain['template']): string {
  const cardinals = mask & 0x0f;
  const base = CARDINAL_MASK_LABELS[cardinals] ?? `m${cardinals}`;
  if (template === 'blob16') return base;
  const full = canonicalizeAutotileMask(cardinals | 0xf0, 'wang47');
  const missing = ((full & 0xf0) ^ (mask & 0xf0)) & 0xf0;
  let notches = 0;
  for (let bit = 16; bit <= 128; bit <<= 1) if (missing & bit) notches++;
  return notches > 0 ? `${base} (${notches} esq. int.)` : base;
}

/**
 * Resolves the atlas entry id for a raw neighbour mask. Falls back from the canonical
 * mask to its cardinal reduction and finally to the centre tile, so partially-mapped
 * terrains (e.g. a wang47 mapping missing a rare corner) still paint something sensible.
 */
export function resolveTerrainEntryId(terrain: Msx2BitmapAutoTerrain, mask: number): string | undefined {
  const mapping = terrain.mapping || {};
  const canonical = canonicalizeAutotileMask(mask, terrain.template);
  return mapping[canonical] ?? mapping[canonical & 0x0f] ?? mapping[15];
}

export interface TerrainPaintCell { x: number; y: number }

export interface TerrainPaintResult {
  grid: number[][];
  /** Cells whose value changed; `entry` is the atlas entry now occupying each (null = erased). */
  changed: Array<{ x: number; y: number; entry: Msx2BitmapRoomAtlasEntry | null }>;
}

/**
 * Paints (or erases) terrain membership on `cells` and re-resolves the autotile of every
 * affected cell plus its 8 neighbours that belong to the same terrain. Pure: returns a new
 * grid; the caller persists it (and per-cell collision/behavior flags from `changed`).
 *
 * `edgesAreTerrain` controls whether out-of-bounds neighbours (screen borders) count as
 * terrain (true = borders render "solid", continuing into the adjacent room).
 *
 * Random variants: if the terrain defines `variants` for a cell's canonical mask, the tile
 * is rolled by weight (`random`, default Math.random) — but ONLY when the cell's current
 * tile is not already valid for that mask. Healing neighbours or repainting the same area
 * therefore never reshuffles decoration; erase + repaint re-rolls.
 */
export function applyTerrainToGrid(params: {
  grid: number[][];
  entries: Msx2BitmapRoomAtlasEntry[];
  terrain: Msx2BitmapAutoTerrain;
  cells: TerrainPaintCell[];
  erase?: boolean;
  edgesAreTerrain?: boolean;
  /** Injectable RNG in [0,1) for deterministic tests. */
  random?: () => number;
}): TerrainPaintResult {
  const { grid, entries, terrain, cells, erase = false, edgesAreTerrain = true, random = Math.random } = params;
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const next = grid.map(row => [...row]);
  const changed: TerrainPaintResult['changed'] = [];
  if (height === 0 || width === 0 || cells.length === 0) return { grid: next, changed };

  const terrainIds = terrainAtlasEntryIds(terrain);
  const entryIndexById = new Map(entries.map((entry, index) => [entry.id, index]));
  const key = (x: number, y: number) => y * width + x;

  // Painted cells override the stored grid while resolving membership.
  const painted = new Set<number>();
  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height) continue;
    painted.add(key(cell.x, cell.y));
  }
  if (painted.size === 0) return { grid: next, changed };

  const isMember = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return edgesAreTerrain;
    if (painted.has(key(x, y))) return !erase;
    const value = next[y]?.[x] ?? 0;
    if (value <= 0) return false;
    const entry = entries[value - 1];
    return Boolean(entry && terrainIds.has(entry.id));
  };

  // Dirty set: painted cells plus all 8 neighbours of each.
  const dirty = new Map<number, TerrainPaintCell>();
  painted.forEach(k => {
    const x = k % width;
    const y = Math.floor(k / width);
    dirty.set(k, { x, y });
    for (const { dx, dy } of AUTOTILE_NEIGHBOR_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      dirty.set(key(nx, ny), { x: nx, y: ny });
    }
  });

  dirty.forEach(({ x, y }) => {
    const wasValue = next[y][x];
    if (!isMember(x, y)) {
      // Only erased painted cells are cleared; foreign tiles around the stroke stay put.
      if (erase && painted.has(key(x, y)) && wasValue !== 0) {
        next[y][x] = 0;
        changed.push({ x, y, entry: null });
      }
      return;
    }
    let mask = 0;
    AUTOTILE_NEIGHBOR_OFFSETS.forEach(({ dx, dy }, bit) => {
      if (isMember(x + dx, y + dy)) mask |= 1 << bit;
    });
    const baseId = resolveTerrainEntryId(terrain, mask);
    if (baseId === undefined) return;
    const canonical = canonicalizeAutotileMask(mask, terrain.template);
    const variants: Msx2BitmapAutoTerrainVariant[] =
      (terrain.variants?.[canonical] || []).filter(variant => entryIndexById.has(variant.entryId));
    // Stability rule: keep the current tile when it is already valid for this mask
    // (base or any variant), so healing/repainting never reshuffles rolled decoration.
    const currentId = wasValue > 0 ? entries[wasValue - 1]?.id : undefined;
    if (currentId !== undefined && (currentId === baseId || variants.some(variant => variant.entryId === currentId))) return;
    let chosenId = baseId;
    if (variants.length > 0) {
      let roll = random() * 100;
      for (const variant of variants) {
        roll -= Math.max(0, Number(variant.percent) || 0);
        if (roll < 0) {
          chosenId = variant.entryId;
          break;
        }
      }
    }
    const index = entryIndexById.get(chosenId);
    if (index === undefined) return;
    if (next[y][x] !== index + 1) {
      next[y][x] = index + 1;
      changed.push({ x, y, entry: entries[index] });
    }
  });

  return { grid: next, changed };
}

/** Finds the terrain (if any) whose mapping contains the atlas entry occupying a grid value. */
export function findTerrainForGridValue(
  terrains: Msx2BitmapAutoTerrain[] | undefined,
  entries: Msx2BitmapRoomAtlasEntry[],
  gridValue: number,
): Msx2BitmapAutoTerrain | null {
  if (!terrains?.length || gridValue <= 0) return null;
  const entryId = entries[gridValue - 1]?.id;
  if (!entryId) return null;
  return terrains.find(terrain => terrainAtlasEntryIds(terrain).has(entryId)) ?? null;
}

/**
 * Drops mapping keys that reference atlas entries no longer present. Terrains left with an
 * empty mapping are removed. Returns the same array instance when nothing changed.
 */
export function pruneTerrainsForEntries(
  terrains: Msx2BitmapAutoTerrain[] | undefined,
  entries: Msx2BitmapRoomAtlasEntry[],
): Msx2BitmapAutoTerrain[] | undefined {
  if (!terrains?.length) return terrains;
  const validIds = new Set(entries.map(entry => entry.id));
  let dirty = false;
  const pruned = terrains
    .map(terrain => {
      const keptMapping = Object.entries(terrain.mapping || {}).filter(([, id]) => validIds.has(id));
      const mappingChanged = keptMapping.length !== Object.keys(terrain.mapping || {}).length;
      let variantsChanged = false;
      const keptVariants: Record<number, Msx2BitmapAutoTerrainVariant[]> = {};
      Object.entries(terrain.variants || {}).forEach(([mask, list]) => {
        const kept = (list || []).filter(variant => validIds.has(variant.entryId));
        if (kept.length !== (list || []).length) variantsChanged = true;
        if (kept.length > 0) keptVariants[Number(mask)] = kept;
      });
      if (!mappingChanged && !variantsChanged) return terrain;
      dirty = true;
      return {
        ...terrain,
        mapping: Object.fromEntries(keptMapping) as Record<number, string>,
        ...(Object.keys(keptVariants).length > 0 ? { variants: keptVariants } : { variants: undefined }),
      };
    })
    .filter(terrain => {
      if (Object.keys(terrain.mapping || {}).length > 0) return true;
      dirty = true;
      return false;
    });
  return dirty ? pruned : terrains;
}
