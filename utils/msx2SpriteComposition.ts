import { Msx2Sprite, Msx2SuperSpritePart, PixelData } from '../types';

export type ResolvedMsx2SpritePart = Msx2SuperSpritePart & { sourceX: number; sourceY: number };

const integer = (value: unknown, fallback: number) => Number.isFinite(Number(value))
  ? Math.trunc(Number(value)) : fallback;

/** Source coordinates never follow an edited destination offset. Old assets retain their atlas grid. */
export function resolveMsx2SpriteParts(sprite: Pick<Msx2Sprite, 'size' | 'superSpriteParts'>): ResolvedMsx2SpritePart[] {
  const columns = Math.max(1, Math.ceil(sprite.size.width / 16));
  const rows = Math.max(1, Math.ceil(sprite.size.height / 16));
  const parts: Msx2SuperSpritePart[] = sprite.superSpriteParts?.length ? sprite.superSpriteParts : Array.from({ length: columns * rows }, (_, index) => ({
    id: `part_${index}`, label: String.fromCharCode(65 + index),
    offsetX: (index % columns) * 16, offsetY: Math.floor(index / columns) * 16,
    width: 16 as const, height: 16 as const,
  }));
  return parts.map((part, index) => ({
    ...part,
    width: 16 as const, height: 16 as const,
    sourceX: Math.max(0, integer(part.sourceX, (index % columns) * 16)),
    sourceY: Math.max(0, integer(part.sourceY, Math.floor(index / columns) * 16)),
    offsetX: Math.max(-255, Math.min(255, integer(part.offsetX, (index % columns) * 16))),
    offsetY: Math.max(-255, Math.min(255, integer(part.offsetY, Math.floor(index / columns) * 16))),
  }));
}

export function composeMsx2SpriteFrame(sprite: Msx2Sprite, frameIndex = sprite.currentFrameIndex || 0, mirrored = false) {
  const frame = sprite.frames?.[frameIndex] || sprite.frames?.[0];
  const parts = resolveMsx2SpriteParts(sprite).map(part => ({
    ...part, offsetX: mirrored ? sprite.size.width - 16 - part.offsetX : part.offsetX,
  }));
  const originX = Math.min(0, ...parts.map(part => part.offsetX));
  const originY = Math.min(0, ...parts.map(part => part.offsetY));
  const width = Math.max(sprite.size.width, ...parts.map(part => part.offsetX + 16)) - originX;
  const height = Math.max(sprite.size.height, ...parts.map(part => part.offsetY + 16)) - originY;
  const pixels: PixelData = Array.from({ length: height }, () => Array(width).fill(sprite.backgroundColor));
  const visible = (color: string | undefined) => !!color
    && color.toUpperCase() !== String(sprite.backgroundColor).toUpperCase()
    && color.toUpperCase() !== 'RGBA(0,0,0,0)' && color !== 'transparent';
  // Lower part index wins an overlap, matching the hardware sprite priority.
  parts.forEach(part => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const color = frame?.data?.[part.sourceY + y]?.[part.sourceX + (mirrored ? 15 - x : x)];
      const destination = pixels[part.offsetY - originY + y];
      const targetX = part.offsetX - originX + x;
      if (color !== undefined && visible(String(color)) && !visible(String(destination[targetX]))) destination[targetX] = color;
    }
  });
  return { pixels, width, height, originX, originY, parts };
}

/** Every allocated hardware layer occupies all sixteen scanlines, even blank pattern rows. */
export function msx2SpriteScanlineCounts(parts: Pick<Msx2SuperSpritePart, 'offsetY'>[], layerCounts: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  parts.forEach((part, index) => {
    for (let y = part.offsetY; y < part.offsetY + 16; y++) {
      counts.set(y, (counts.get(y) || 0) + (layerCounts[index] || 0));
    }
  });
  return counts;
}

/** Preserve authoring priority when destinations cross or a cell is empty in frame zero. */
export function orderMsx2SpriteCells<T extends { x: number; y: number }>(sprite: Msx2Sprite, cells: T[]): T[] {
  const parts = resolveMsx2SpriteParts(sprite);
  const order = (cell: T) => {
    const index = parts.findIndex(part => part.offsetX === cell.x && part.offsetY === cell.y);
    return index < 0 ? parts.length : index;
  };
  return [...cells].sort((a, b) => order(a) - order(b));
}
