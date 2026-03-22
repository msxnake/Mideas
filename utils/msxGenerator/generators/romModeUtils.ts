export function usesMapperBanking(romMode: string): boolean {
  return romMode !== 'simple32k' && romMode !== 'plain48k';
}
