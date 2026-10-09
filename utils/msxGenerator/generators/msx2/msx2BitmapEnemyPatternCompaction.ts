import type { BitmapEnemyRoomData } from './msx2BitmapEnemyGenerator';
import { compactMsx2SpritePatterns } from './msx2SpritePatternCompaction';

/**
 * Share identical 16x16 planes across frames, cells, colours and enemies in a room.
 * Colours, geometry and hardware-slot counts never participate in the pattern key.
 * A room packs its unique patterns contiguously; its frame/facing lookup is staged
 * in RAM so the SAT writer never has to switch a MegaROM bank. Identical room packs
 * also share their ROM payload. Keep the original path when VRAM would not shrink
 * or when lookup/room duplication would increase the cold ROM payload.
 */
export function compactBitmapEnemyPatterns(data: BitmapEnemyRoomData): BitmapEnemyRoomData {
  if (!data.maxSlots || data.compactPatterns) return data;
  const variants = data.slimeEnabled ? 4 : 2;
  const stride = 22 + (data.slimeEnabled ? 1 : 0) + (data.gearEnabled ? 2 : 0)
    + (data.fly8Enabled ? 1 : 0) + (data.scriptedEnabled ? 1 : 0);
  const slotVariants = Array.from({ length: data.maxSlots }, (_, slot) => data.patternVariantCounts?.[slot] || variants);
  const slotMapOffsets: number[] = [];
  let mapBytes = 0;
  for (const count of slotVariants) {
    slotMapOffsets.push(mapBytes);
    mapBytes += Math.max(1, data.maxFrames) * count;
  }
  const packs: Array<{ bytes: number[]; patternGroups: number; patternPool: number }> = [];
  const roomPacks: number[] = [];
  const knownPacks = new Map<string, number>();
  const rooms: Array<{ patterns: number[]; groups: number[]; mapIndices: number[] }> = [];
  for (const table of data.roomTables) {
    const source: number[] = [];
    const mapIndices: number[] = [];
    for (let slot = 0; slot < Math.min(table[0], data.maxSlots); slot++) {
      const record = 1 + slot * stride;
      const frameCount = table[record + 10];
      const patternBase = table[record + 8];
      for (let frame = 0; frame < frameCount; frame++) {
        for (let variant = 0; variant < slotVariants[slot]; variant++) {
          const offset = (patternBase + frame * variants + variant) * 32;
          const pattern = data.patternBytes.slice(offset, offset + 32);
          if (pattern.length !== 32) throw new Error('SCREEN 5 enemy pattern reference is outside its sprite bank.');
          source.push(...pattern);
          mapIndices.push(slotMapOffsets[slot] + frame * slotVariants[slot] + variant);
        }
      }
    }
    const compact = compactMsx2SpritePatterns(source);
    rooms.push({ ...compact, mapIndices });
  }
  // A room using a subset of another room's art can share that pattern pool.
  // Its map still selects its own frames/slots. Largest rooms seed the pools so
  // a later empty or smaller room does not duplicate the same ROM artwork.
  const patternPools: number[][] = [];
  const poolKeys: Array<Map<string, number>> = [];
  const roomPools: number[] = [];
  const keysFor = (bytes: number[]) => Array.from({ length: bytes.length / 32 }, (_, i) => bytes.slice(i * 32, i * 32 + 32).join(','));
  const roomOrder = rooms.map((_, i) => i).sort((a, b) => rooms[b].patterns.length - rooms[a].patterns.length);
  for (const room of roomOrder) {
    const keys = keysFor(rooms[room].patterns);
    let pool = poolKeys.findIndex(known => keys.every(key => known.has(key)));
    if (pool < 0) {
      pool = patternPools.length;
      patternPools.push(rooms[room].patterns);
      poolKeys.push(new Map(keys.map((key, i) => [key, i])));
    }
    roomPools[room] = pool;
  }
  for (const [room, compact] of rooms.entries()) {
    const patternPool = roomPools[room];
    const keys = keysFor(compact.patterns);
    const map = new Array(mapBytes).fill(0);
    compact.groups.forEach((group, index) => { map[compact.mapIndices[index]] = poolKeys[patternPool].get(keys[group])!; });
    const patterns = patternPools[patternPool];
    const bytes = [...map, ...patterns];
    const key = `${patternPool}:${compact.patterns.length ? patterns.length : 0}:${map.join(',')}`;
    let pack = knownPacks.get(key);
    if (pack === undefined) {
      pack = packs.length;
      knownPacks.set(key, pack);
      packs.push({ bytes, patternGroups: compact.patterns.length ? patterns.length / 32 : 0, patternPool });
    }
    roomPacks.push(pack);
  }
  const originalPatternGroups = data.patternGroupCount
    ?? data.maxSlots * Math.max(1, data.maxFrames) * variants;
  const patternGroupCount = Math.max(0, ...packs.map(pack => pack.patternGroups));
  if (patternGroupCount >= originalPatternGroups
    || packs.length * mapBytes + patternPools.reduce((sum, bytes) => sum + bytes.length, 0) > data.patternBytes.length) return data;
  return {
    ...data,
    patternGroupCount,
    compactPatterns: { mapBytes, slotMapOffsets, roomPacks, packs, patternPools,
      originalPatternGroups, originalPatternBytes: data.patternBytes.length },
  };
}
