/**
 * @fileoverview The project's distinct SCREEN 5 atlas tiles, ready to preview.
 *
 * Rooms in a world share one atlas, so every room lists the same entries. Any
 * picker that walks rooms and pushes each entry therefore shows the same tile
 * once per room: in the boss fixture that is 1459 thumbnails for 115 tiles.
 *
 * Deduplicating is safe because an entry id names the same rectangle in every
 * room that lists it, and callers store the id alone — picking any copy yields
 * the identical value.
 */
import { Msx2Screen5BitmapRoom, ProjectAsset, Screen5PaletteSlot } from '../types';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from './msx2PaletteUtils';
import { resolveWorldPalettes } from './msx2WorldPalette';

/**
 * One atlas tile, with enough of its atlas bitmap to be drawn: an entry is just
 * a rectangle (sx,sy,w,h) inside the shared atlas.
 */
export interface AtlasEntryRef {
  id: string;
  label: string;
  w: number;
  h: number;
  /** A room the tile appears in, for the tooltip. The tile is not owned by it. */
  roomName: string;
  /** How many rooms list this tile; > 1 is normal for a shared world atlas. */
  roomCount: number;
  sx: number;
  sy: number;
  pixels: number[][];
  palette: Screen5PaletteSlot[];
}

/**
 * Every distinct atlas tile across the project's bitmap rooms.
 *
 * Keyed by entry id; the first sighting wins and later rooms only bump
 * `roomCount`. Pixels are drawn with the world's shared palette when there is
 * one, falling back to the room's own slots (see {@link resolveWorldPalettes}).
 */
export function collectAtlasEntries(allAssets: ProjectAsset[]): AtlasEntryRef[] {
  const { byRoom } = resolveWorldPalettes(allAssets);
  const byId = new Map<string, AtlasEntryRef>();

  for (const asset of allAssets) {
    if (asset.type !== 'msx2bitmaproom') continue;
    const room = asset.data as Msx2Screen5BitmapRoom | undefined;
    const atlas = room?.atlas;
    if (!atlas) continue;

    // The world's shared palette is what the game runs with; the room's own
    // slots are only a fallback for rooms outside a palette-carrying world.
    const palette = byRoom.get(asset.id)
      || (room?.palette?.length ? ensureScreen5PaletteSlots(room.palette).slots : createDefaultScreen5PaletteSlots());

    for (const entry of atlas.entries || []) {
      if (!entry?.id) continue;
      const id = String(entry.id);
      const seen = byId.get(id);
      if (seen) {
        seen.roomCount += 1;
        continue;
      }
      byId.set(id, {
        id,
        label: `${entry.name || entry.id} (${entry.w}x${entry.h})`,
        w: Number(entry.w) || 0,
        h: Number(entry.h) || 0,
        roomName: asset.name,
        roomCount: 1,
        sx: Number(entry.sx) || 0,
        sy: Number(entry.sy) || 0,
        pixels: atlas.pixels || [],
        palette,
      });
    }
  }

  return Array.from(byId.values());
}
