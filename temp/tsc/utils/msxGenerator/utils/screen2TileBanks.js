import { generateTileColorBytes, generateTilePatternBytes } from '../../../components/utils/tileUtils';
const RUNTIME_SCREEN2_FONT_RESERVED_START = 128;
const RUNTIME_SCREEN2_CHAR_MAX = 255;
function sanitizeAsmFragment(value) {
    return String(value || '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'default';
}
function sanitizeAsmFragmentUpper(value) {
    return sanitizeAsmFragment(value).toUpperCase();
}
function buildEmptyPayload() {
    return {
        startChar: 0,
        byteCount: 0,
        patternBytes: [],
        colorBytes: [],
    };
}
function projectUsesFontCharRange(analysis) {
    const hasMenus = analysis.gameFlow?.nodes?.some((node) => node?.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some((screen) => screen.layers?.text || screen.textElements?.length > 0);
    const hasHudText = analysis.screenMaps?.some((screen) => Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0);
    return !!(hasMenus || hasText || hasHudText);
}
function buildTileOrderIndex(analysis) {
    return new Map((analysis.tiles || []).map((tile, index) => [String(tile?.id || ''), index]));
}
function buildFallbackRuntimeBankDefinitions(analysis) {
    if (!analysis.tiles || analysis.tiles.length === 0) {
        return undefined;
    }
    const assignedTiles = {};
    let nextCharCode = RUNTIME_SCREEN2_FONT_RESERVED_START;
    for (const tileAsset of analysis.tiles) {
        if (!tileAsset?.id)
            continue;
        const charsWide = Math.ceil(tileAsset.width / 8);
        const charsHigh = Math.ceil(tileAsset.height / 8);
        const charsPerTile = charsWide * charsHigh;
        if ((nextCharCode + charsPerTile - 1) > RUNTIME_SCREEN2_CHAR_MAX) {
            console.warn(`Skipping runtime tile mapping for ${tileAsset.name || tileAsset.id}: exceeds SCREEN 2 range`);
            continue;
        }
        assignedTiles[tileAsset.id] = {
            charCode: nextCharCode,
            assignedAt: Date.now(),
        };
        nextCharCode += charsPerTile;
    }
    const runtimeBank = {
        assignedTiles,
        charsetRangeStart: RUNTIME_SCREEN2_FONT_RESERVED_START,
        charsetRangeEnd: RUNTIME_SCREEN2_CHAR_MAX,
        enabled: true,
    };
    return [runtimeBank, runtimeBank, runtimeBank];
}
function normalizeRuntimeBankDefinitions(rawBanks, analysis) {
    const tileById = new Map((analysis.tiles || []).map((tile) => [String(tile?.id || ''), tile]));
    const tileOrderIndex = buildTileOrderIndex(analysis);
    const reserveFontRange = projectUsesFontCharRange(analysis);
    const sourceBanks = rawBanks?.length ? rawBanks : buildFallbackRuntimeBankDefinitions(analysis);
    if (!sourceBanks?.length) {
        return undefined;
    }
    return [0, 1, 2].map((bankIndex) => {
        const sourceBank = (sourceBanks[bankIndex] || sourceBanks[0] || {});
        const assignedTiles = {};
        const entryList = Object.entries(sourceBank.assignedTiles || {})
            .filter(([tileId, assignment]) => tileById.has(String(tileId)) || Array.isArray(assignment?.fontCharacters))
            .sort(([tileIdA, assignmentA], [tileIdB, assignmentB]) => {
            const isFontA = Array.isArray(assignmentA?.fontCharacters);
            const isFontB = Array.isArray(assignmentB?.fontCharacters);
            if (isFontA !== isFontB) {
                return isFontA ? -1 : 1;
            }
            const charCodeA = Number(assignmentA?.charCode);
            const charCodeB = Number(assignmentB?.charCode);
            if (Number.isFinite(charCodeA) && Number.isFinite(charCodeB) && charCodeA !== charCodeB) {
                return charCodeA - charCodeB;
            }
            return (tileOrderIndex.get(String(tileIdA)) ?? Number.MAX_SAFE_INTEGER)
                - (tileOrderIndex.get(String(tileIdB)) ?? Number.MAX_SAFE_INTEGER);
        });
        let nextCharCode = reserveFontRange
            ? RUNTIME_SCREEN2_FONT_RESERVED_START
            : Math.max(0, Math.min(RUNTIME_SCREEN2_CHAR_MAX, Number(sourceBank.charsetRangeStart) || 0));
        let hasFontAssignments = false;
        for (const [tileId, assignment] of entryList) {
            if (Array.isArray(assignment?.fontCharacters)) {
                assignedTiles[String(tileId)] = {
                    ...assignment,
                };
                hasFontAssignments = true;
                continue;
            }
            const tile = tileById.get(String(tileId));
            if (!tile)
                continue;
            const charsWide = Math.ceil(tile.width / 8);
            const charsHigh = Math.ceil(tile.height / 8);
            const charsPerTile = charsWide * charsHigh;
            if ((nextCharCode + charsPerTile - 1) > RUNTIME_SCREEN2_CHAR_MAX) {
                console.warn(`Skipping runtime tile bank assignment for ${tile.name || tile.id}: exceeds SCREEN 2 range`);
                continue;
            }
            assignedTiles[String(tileId)] = {
                ...assignment,
                charCode: nextCharCode,
            };
            nextCharCode += charsPerTile;
        }
        return {
            ...sourceBank,
            assignedTiles,
            charsetRangeStart: hasFontAssignments
                ? 0
                : reserveFontRange
                    ? RUNTIME_SCREEN2_FONT_RESERVED_START
                    : Math.max(0, Math.min(RUNTIME_SCREEN2_CHAR_MAX, Number(sourceBank.charsetRangeStart) || 0)),
            charsetRangeEnd: RUNTIME_SCREEN2_CHAR_MAX,
            enabled: sourceBank.enabled ?? true,
        };
    });
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
        const patternBytes = Array.from(generateTilePatternBytes(tile, 'SCREEN 2 (Graphics I)'));
        if (patternBytes.length === 0)
            continue;
        const colorData = generateTileColorBytes(tile);
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
export function getScreen2TileBankLabelBase(tileBankId) {
    return `tilebank_${sanitizeAsmFragment(tileBankId)}`;
}
export function getScreen2TileBankIdLabel(tileBankId) {
    return `SCREEN2_TILEBANK_${sanitizeAsmFragmentUpper(tileBankId)}_ID`;
}
export function getScreen2TileBankPatternLoaderLabel(tileBankId) {
    return `load_${getScreen2TileBankLabelBase(tileBankId)}_patterns_to_vram`;
}
export function getScreen2TileBankColorLoaderLabel(tileBankId) {
    return `load_${getScreen2TileBankLabelBase(tileBankId)}_colors_to_vram`;
}
export function resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId) {
    const normalizedTileBankId = String(tileBankId || '').trim();
    const rawBanks = normalizedTileBankId
        ? (analysis.tileBanks || []).find((candidate) => candidate?.id === normalizedTileBankId)?.banks
        : undefined;
    return normalizeRuntimeBankDefinitions(rawBanks, analysis);
}
export function resolveRuntimeScreen2TileBankCharCode(analysis, tileBankId, tileId, row, subTileX = 0, subTileY = 0) {
    if (!tileBankId || !tileId) {
        return 0;
    }
    const banks = resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId);
    const bankIndex = Math.max(0, Math.min(2, Math.floor((row || 0) / 8)));
    const bank = (banks?.[bankIndex] || banks?.[0]);
    const assignment = bank?.assignedTiles?.[tileId];
    if (Array.isArray(assignment?.fontCharacters)) {
        const fontChar = assignment.fontCharacters[Math.max(0, subTileX)];
        const bankCharCode = Number(fontChar?.bankCharCode);
        if (!Number.isFinite(bankCharCode)) {
            return 0;
        }
        return bankCharCode & 0xFF;
    }
    const tile = (analysis.tiles || []).find((candidate) => candidate?.id === tileId);
    if (!tile || typeof assignment?.charCode !== 'number') {
        return 0;
    }
    const widthInChars = Math.max(1, Math.ceil(tile.width / 8));
    const charCode = assignment.charCode + (Math.max(0, subTileY) * widthInChars) + Math.max(0, subTileX);
    if (charCode < (bank.charsetRangeStart ?? 0) || charCode > (bank.charsetRangeEnd ?? RUNTIME_SCREEN2_CHAR_MAX)) {
        return 0;
    }
    return charCode & 0xFF;
}
export function buildReferencedScreen2TileBanks(analysis) {
    const tileById = new Map((analysis.tiles || []).map((tile) => [tile.id, tile]));
    const referencedTileBankIds = Array.from(new Set((analysis.screenMaps || [])
        .map((screen) => String(screen?.tileBankAssetId || '').trim())
        .filter(Boolean)));
    return referencedTileBankIds
        .map((tileBankId) => {
        const runtimeBanks = resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId);
        if (!runtimeBanks?.length) {
            return null;
        }
        return {
            tileBankId,
            labelBase: getScreen2TileBankLabelBase(tileBankId),
            banks: [0, 1, 2].map((index) => buildBankPayload(runtimeBanks[index], tileById)),
        };
    })
        .filter((runtime) => runtime !== null);
}
