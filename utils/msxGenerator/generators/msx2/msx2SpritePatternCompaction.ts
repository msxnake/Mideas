/** A mode-2 16x16 pattern is four 8x8 quadrants, independently of its colours. */
export function compactMsx2SpritePatterns(bytes: readonly number[]): {
  patterns: number[];
  groups: number[];
} {
  if (bytes.length % 32) throw new Error('MSX2 sprite patterns must contain complete 32-byte groups.');
  const patterns: number[] = [];
  const groups: number[] = [];
  const known = new Map<string, number>();
  for (let offset = 0; offset < bytes.length; offset += 32) {
    const pattern = bytes.slice(offset, offset + 32).map(byte => byte & 0xff);
    const key = pattern.join(',');
    let group = known.get(key);
    if (group === undefined) {
      group = patterns.length / 32;
      known.set(key, group);
      patterns.push(...pattern);
    }
    groups.push(group);
  }
  return { patterns, groups };
}
