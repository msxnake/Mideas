export function usesMapperBanking(romMode) {
    return romMode !== 'simple32k' && romMode !== 'plain48k';
}
