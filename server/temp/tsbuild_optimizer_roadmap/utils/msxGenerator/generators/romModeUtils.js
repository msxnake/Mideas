"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usesMapperBanking = usesMapperBanking;
function usesMapperBanking(romMode) {
    return romMode !== 'simple32k' && romMode !== 'plain48k';
}
