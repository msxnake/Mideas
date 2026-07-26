/**
 * @fileoverview Which palette a SCREEN 5 bitmap room is really drawn with.
 *
 * A room belongs to a world, and the world may point at a shared `palette`
 * asset (`WorldMapGraph.paletteAssetId`). That shared palette is the one the
 * generator bakes into the ROM, so it WINS over the copy stored on the room.
 *
 * Reading only `room.palette` makes editors draw atlas tiles in colours the
 * game never shows: rooms keep an older private palette long after the world
 * moved to a shared one. Every editor that previews atlas pixels outside the
 * room editor should resolve through here.
 */
import { PaletteAsset, ProjectAsset, Screen5PaletteSlot, WorldMapGraph } from '../types';
import { ensureScreen5PaletteSlots } from './msx2PaletteUtils';

export interface WorldPaletteResolution {
  /** roomAssetId -> the shared palette of the world that room belongs to. */
  byRoom: Map<string, Screen5PaletteSlot[]>;
  /**
   * The single shared palette, when the project has exactly one. Assets that
   * are not tied to a room (bitmap stamps) can only be resolved unambiguously
   * in that case, which is the normal single-world project.
   */
  shared?: Screen5PaletteSlot[];
}

/**
 * Map every room to its world's shared palette.
 *
 * Rooms whose world defines no palette asset are absent from `byRoom`; callers
 * fall back to the room's own slots.
 */
export function resolveWorldPalettes(allAssets: ProjectAsset[]): WorldPaletteResolution {
  const byRoom = new Map<string, Screen5PaletteSlot[]>();
  const distinct: Screen5PaletteSlot[][] = [];

  for (const asset of allAssets) {
    if (asset.type !== 'worldmap') continue;
    const graph = asset.data as WorldMapGraph | undefined;
    const paletteAssetId = graph?.paletteAssetId;
    if (!paletteAssetId) continue;
    const paletteAsset = allAssets.find(a => a.id === paletteAssetId && a.type === 'palette');
    const slots = (paletteAsset?.data as PaletteAsset | undefined)?.slots;
    if (!slots?.length) continue;

    const resolved = ensureScreen5PaletteSlots(slots).slots;
    distinct.push(resolved);
    for (const node of graph?.nodes || []) {
      if (node?.screenAssetId) byRoom.set(node.screenAssetId, resolved);
    }
  }

  return { byRoom, shared: distinct.length === 1 ? distinct[0] : undefined };
}
