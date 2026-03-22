"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScreen2TileBankLabelBase = getScreen2TileBankLabelBase;
exports.getScreen2TileBankPatternLoaderLabel = getScreen2TileBankPatternLoaderLabel;
exports.getScreen2TileBankColorLoaderLabel = getScreen2TileBankColorLoaderLabel;
exports.buildReferencedScreen2TileBanks = buildReferencedScreen2TileBanks;
const tileUtils_1 = require("../../../components/utils/tileUtils");
function sanitizeAsmFragment(value) {
    return String(value || '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'default';
}
function buildEmptyPayload() {
    return {
        startChar: 0,
        byteCount: 0,
        patternBytes: [],
        colorBytes: [],
    };
}
function buildBankPayload(bankDef, tileById) {
    const placements = [];
    for (const [tileId, assignment] of Object.entries(bankDef?.assignedTiles || {})) {
        const tile = tileById.get(tileId);
        if (!tile)
            continue;
        const startChar = Number(assignment?.charCode);
        if (!Number.isFinite(startChar))
            continue;
        const patternBytes = Array.from((0, tileUtils_1.generateTilePatternBytes)(tile, 'SCREEN 2 (Graphics I)'));
        if (patternBytes.length === 0)
            continue;
        const colorData = (0, tileUtils_1.generateTileColorBytes)(tile);
        const colorBytes = colorData
            ? Array.from(colorData)
            : new Array(patternBytes.length).fill(0xF0);
        const totalChars = Math.ceil(tile.width / 8) * Math.ceil(tile.height / 8);
        if (startChar < 0 || startChar + totalChars > 256) {
            console.warn(`Skipping out-of-range tile bank assignment for tile ${tile.name} at char ${startChar}`);
            continue;
        }
        placements.push({
            tileId,
            startChar,
            totalChars,
            patternBytes,
            colorBytes,
        });
    }
    if (placements.length === 0) {
        return buildEmptyPayload();
    }
    let minChar = 255;
    let maxChar = 0;
    for (const placement of placements) {
        minChar = Math.min(minChar, placement.startChar);
        maxChar = Math.max(maxChar, placement.startChar + placement.totalChars - 1);
    }
    const byteCount = ((maxChar - minChar) + 1) * 8;
    const patternBytes = new Array(byteCount).fill(0);
    const colorBytes = new Array(byteCount).fill(0xF0);
    for (const placement of placements) {
        const offset = (placement.startChar - minChar) * 8;
        for (let i = 0; i < placement.patternBytes.length; i++) {
            patternBytes[offset + i] = placement.patternBytes[i];
            colorBytes[offset + i] = placement.colorBytes[i] ?? 0xF0;
        }
    }
    return {
        startChar: minChar,
        byteCount,
        patternBytes,
        colorBytes,
    };
}
function getScreen2TileBankLabelBase(tileBankId) {
    return `tilebank_${sanitizeAsmFragment(tileBankId)}`;
}
function getScreen2TileBankPatternLoaderLabel(tileBankId) {
    return `load_${getScreen2TileBankLabelBase(tileBankId)}_patterns_to_vram`;
}
function getScreen2TileBankColorLoaderLabel(tileBankId) {
    return `load_${getScreen2TileBankLabelBase(tileBankId)}_colors_to_vram`;
}
function buildReferencedScreen2TileBanks(analysis) {
    const tileById = new Map((analysis.tiles || []).map((tile) => [tile.id, tile]));
    const referencedTileBankIds = Array.from(new Set((analysis.screenMaps || [])
        .map((screen) => String(screen?.tileBankAssetId || '').trim())
        .filter(Boolean)));
    return referencedTileBankIds
        .map((tileBankId) => {
        const tileBank = (analysis.tileBanks || []).find((candidate) => candidate?.id === tileBankId);
        if (!tileBank?.banks?.length) {
            return null;
        }
        return {
            tileBankId,
            labelBase: getScreen2TileBankLabelBase(tileBankId),
            banks: [0, 1, 2].map((index) => buildBankPayload(tileBank.banks[index], tileById)),
        };
    })
        .filter((runtime) => runtime !== null);
}
