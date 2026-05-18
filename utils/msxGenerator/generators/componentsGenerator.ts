/**
 * @fileoverview Components Generator - ECS component systems
 * Generates components.asm with Position, Sprite, Movement, Collision, Input, and Behavior systems
 * NOW WITH INTELLIGENT FILTERING - Only generates code for components actually used
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';
import { analyzeComponentUsage, ComponentUsageAnalysis } from '../utils/componentAnalyzer';
import { buildRegisterContractComment } from './registerContract';
import { usesMapperBanking } from './romModeUtils';
import { buildScreenInteractionMaps } from '../../../components/utils/screenUtils';
import {
    getScreen2TileBankColorLoaderLabel,
    getScreen2TileBankIdLabel,
    getScreen2TileBankPatternLoaderLabel,
    resolveRuntimeScreen2TileBankDefinitions,
} from '../utils/screen2TileBanks';
import { resolveTileAssignmentCharCode } from '../../../utils/tileBankOptimization';

type MideasAsmBlockOptions = {
    id: string;
    kind: string;
    owner: string;
    preserve?: boolean;
    deps?: string[];
    roots?: string[];
    bank?: string;
};

function wrapMideasAsmBlock(asm: string, options: MideasAsmBlockOptions): string {
    const attrs = [
        `id=${options.id}`,
        `kind=${options.kind}`,
        `owner=${options.owner}`,
        `preserve=${options.preserve === true ? 'true' : 'false'}`,
        options.deps && options.deps.length > 0 ? `deps=${options.deps.join(',')}` : '',
        options.roots && options.roots.length > 0 ? `roots=${options.roots.join(',')}` : '',
        options.bank ? `bank=${options.bank}` : '',
    ].filter(Boolean).join(' ');
    return `; @mideas:block ${attrs}\n${asm.trimEnd()}\n; @mideas:endblock id=${options.id}\n`;
}

function applyMapperDataWindowPage(asm: string, targetFormat: string): string {
    if (!['konami', 'ascii8', 'ascii16'].includes(targetFormat)) {
        return asm;
    }
    return asm
        .replace(/mapper_push_p2/g, 'mapper_push_p3')
        .replace(/mapper_pop_p2/g, 'mapper_pop_p3')
        .replace(/mapper_set_bank_p2/g, 'mapper_set_bank_p3')
        .replace(/P2 bank/g, 'data-window bank')
        .replace(/protects P2/g, 'protects the mapper data window');
}

type AutoControlScriptBuild = {
    dataAsm: string;
    hasScripts: boolean;
    hasCommandScripts: boolean;
    hasEventScripts: boolean;
    hasEventLoopFlags: boolean;
    hasCommandSpriteOverrides: boolean;
    hasEventSpriteOverrides: boolean;
    hasDialogue: boolean;
};

const AUTO_CMD = {
    END: 0,
    MOVE_RIGHT: 1,
    MOVE_LEFT: 2,
    MOVE_UP: 3,
    MOVE_DOWN: 4,
    DELAY: 5,
    WAIT_SPC: 6,
    NOP: 7,
    OPEN_DIALOG: 8,
    WRITE_LINE: 9,
    CLEAR_DIALOG: 10,
    CLOSE_DIALOG: 11,
    WAIT_TEXT: 12,
} as const;

type DialogueRuntimeBuild = {
    dataAsm: string;
    dialogueIndexById: Map<string, number>;
    lineIndexByDialogueId: Map<string, Map<number, number>>;
    lineWaitForInputByDialogueId: Map<string, Map<number, boolean>>;
    hasDialogue: boolean;
};

function boolValue(value: any, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
}

function getTemplateComponent(template: any, definitionId: string): any | undefined {
    return Array.isArray(template?.components)
        ? template.components.find((component: any) => component?.definitionId === definitionId)
        : undefined;
}

function getEntityComponentValues(entity: any, template: any, definitionId: string): Record<string, any> {
    const component = getTemplateComponent(template, definitionId);
    const defaults = component?.defaultValues || {};
    const overrides = entity?.componentOverrides?.[definitionId] || {};
    return { ...defaults, ...overrides };
}

function sanitizeAsmLabelPart(value: any, fallback: string): string {
    const label = String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return label || fallback;
}

function clampByteValue(value: any, fallback = 0): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback & 0xff;
    return Math.max(0, Math.min(255, Math.round(numeric))) & 0xff;
}

function resolveDroppedBoxBehaviorByte(tile: any): number {
    const logical = tile?.logicalProperties || tile?.data?.logicalProperties || {};
    const familyId = Number(logical.familyId);
    if (Number.isFinite(familyId) && familyId > 0) {
        return ((Math.max(1, Math.min(15, Math.round(familyId))) & 0x0f) << 4) & 0xff;
    }
    return 0x10;
}

function buildSpriteIndexByReference(analysis: ProjectAnalysis): Map<string, number> {
    const refs = new Map<string, number>();
    (analysis.sprites || []).forEach((sprite: any, index: number) => {
        [sprite?.id, sprite?.name].forEach((ref) => {
            if (typeof ref !== 'string' || !ref.trim()) return;
            refs.set(ref, index);
            refs.set(ref.trim().toLowerCase(), index);
        });
    });
    return refs;
}

function resolveSpriteAssetIndex(spriteRef: any, spriteIndexByReference: Map<string, number>): number {
    const trimmed = String(spriteRef ?? '').trim();
    if (!trimmed) return 0xFF;
    const direct = spriteIndexByReference.get(trimmed);
    if (direct !== undefined) return direct;
    const lower = spriteIndexByReference.get(trimmed.toLowerCase());
    return lower !== undefined ? lower : 0xFF;
}

function asmHexByte(value: number): string {
    return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function asmDb(label: string, values: number[], perLine = 16): string {
    const chunks: string[] = [];
    for (let i = 0; i < values.length; i += perLine) {
        chunks.push(`    DB ${values.slice(i, i + perLine).map(asmHexByte).join(', ')}`);
    }
    return `${label}:\n${chunks.length > 0 ? chunks.join('\n') : '    DB #00'}`;
}

function resolveRuntimeTileCharCode(analysis: ProjectAnalysis, tile: any, subTileX = 0, subTileY = 0): number {
    if (!tile) return 0;
    const tileBanks = Array.isArray((analysis as any).tileBanks) ? (analysis as any).tileBanks : [];
    for (const bank of tileBanks) {
        if (bank && (bank.enabled ?? true) && bank.assignedTiles?.[tile.id]) {
            const resolved = resolveTileAssignmentCharCode(bank.assignedTiles[tile.id], tile, subTileX, subTileY);
            if (typeof resolved === 'number') return resolved & 0xff;
        }
    }

    let charCode = 128;
    for (const candidate of ((analysis as any).tiles || [])) {
        if (candidate?.id === tile.id) {
            const widthChars = Math.max(1, Math.ceil(Number(candidate.width || 8) / 8));
            return Math.min(255, charCode + subTileY * widthChars + subTileX) & 0xff;
        }
        const widthChars = Math.max(1, Math.ceil(Number(candidate?.width || 8) / 8));
        const heightChars = Math.max(1, Math.ceil(Number(candidate?.height || 8) / 8));
        charCode += widthChars * heightChars;
    }

    return 0;
}

function resolveEntityScreenMap(analysis: ProjectAnalysis, entity: any): any | undefined {
    const directScreenAssetId = entity?.screenAssetId || entity?.screenId || entity?.screenMapId;
    if (directScreenAssetId) {
        const direct = (analysis.screenMaps || []).find((screen: any) => screen?.id === directScreenAssetId);
        if (direct) return direct;
    }

    if (typeof entity?.screenIndex === 'number' && entity.screenIndex >= 0) {
        return (analysis.screenMaps || [])[entity.screenIndex];
    }

    return (analysis.screenMaps || []).find((screen: any) => {
        const entities = screen?.layers?.entities || screen?.entities || [];
        return Array.isArray(entities) && entities.some((candidate: any) => candidate?.id === entity?.id);
    });
}

function resolveRuntimeTileBankCharCode(
    analysis: ProjectAnalysis,
    tile: any,
    screenMap: any,
    bankIndex: number,
    subTileX: number,
    subTileY: number
): number {
    const tileBankId = String(screenMap?.tileBankAssetId || '').trim();
    if (tileBankId) {
        const banks = resolveRuntimeScreen2TileBankDefinitions(analysis, tileBankId);
        const bank = (banks?.[bankIndex] || banks?.[0]) as any;
        const assignment = bank?.assignedTiles?.[tile?.id];
        const assignedChar = resolveTileAssignmentCharCode(assignment, tile, subTileX, subTileY);
        if (typeof assignedChar === 'number') return assignedChar & 0xff;
    }

    return resolveRuntimeTileCharCode(analysis, tile, subTileX, subTileY);
}

type CarryRuntimeData = {
    dataAsm: string;
};

function buildCarryRuntimeData(analysis: ProjectAnalysis): CarryRuntimeData {
    const entities = Array.isArray((analysis as any).entities) ? (analysis as any).entities.slice(0, 32) : [];
    const templates = Array.isArray((analysis as any).templates) ? (analysis as any).templates : [];
    const tiles = Array.isArray((analysis as any).tiles) ? (analysis as any).tiles : [];
    const templateById = new Map<string, any>(templates.map((template: any) => [String(template.id), template]));
    const tileById = new Map<string, any>(tiles.map((tile: any) => [String(tile.id), tile]));
    const tileByRef = new Map<string, any>();
    tiles.forEach((tile: any) => {
        [tile?.id, tile?.name, tile?.data?.id, tile?.data?.name].forEach((ref) => {
            if (typeof ref !== 'string' || !ref.trim()) return;
            tileByRef.set(ref, tile);
            tileByRef.set(ref.trim().toLowerCase(), tile);
        });
    });
    const spriteIndexByReference = buildSpriteIndexByReference(analysis);

    const carryEnabled = new Array(32).fill(0);
    const carrySpriteIndex = new Array(32).fill(0xff);
    const boxCarriable = new Array(32).fill(0);
    const boxTileWidth = new Array(32).fill(0);
    const boxTileHeight = new Array(32).fill(0);
    const boxCollisionLayer = new Array(32).fill(0);
    const boxCollidesWith = new Array(32).fill(0);
    const matrixLabels = new Array(32 * 3).fill('carry_box_empty_matrix');
    const behaviorMatrixLabels = new Array(32).fill('carry_box_empty_behavior_matrix');
    const matrixBlocks: string[] = [];
    const behaviorMatrixBlocks: string[] = [];

    entities.forEach((entity: any, index: number) => {
        const template = templateById.get(String(entity?.entityTemplateId || ''));
        const carryComponent = getTemplateComponent(template, 'comp_carry');
        if (carryComponent) {
            const carryValues = getEntityComponentValues(entity, template, 'comp_carry');
            carryEnabled[index] = 1;
            carrySpriteIndex[index] = resolveSpriteAssetIndex(carryValues.carrySpriteAssetId, spriteIndexByReference);
        }

        const boxComponent = getTemplateComponent(template, 'comp_box');
        if (!boxComponent) return;

        const boxValues = getEntityComponentValues(entity, template, 'comp_box');
        boxCarriable[index] = boolValue(boxValues.isCarriable, true) ? 1 : 0;

        const collisionValues = getEntityComponentValues(entity, template, 'comp_collision');
        boxCollisionLayer[index] = clampByteValue(collisionValues.collisionLayer, 1);
        boxCollidesWith[index] = clampByteValue(collisionValues.collidesWith, 255);

        const droppedTileId = String(boxValues.droppedTileAssetId || '').trim();
        const tile = droppedTileId
            ? (tileById.get(droppedTileId) || tileByRef.get(droppedTileId) || tileByRef.get(droppedTileId.toLowerCase()))
            : undefined;
        if (!tile) return;

        const widthChars = Math.max(1, Math.min(4, Math.ceil(Number(tile.width || 8) / 8)));
        const heightChars = Math.max(1, Math.min(4, Math.ceil(Number(tile.height || 8) / 8)));
        const behaviorBytes: number[] = [];
        const behaviorByte = resolveDroppedBoxBehaviorByte(tile);
        for (let y = 0; y < heightChars; y++) {
            for (let x = 0; x < widthChars; x++) {
                behaviorBytes.push(behaviorByte);
            }
        }

        const screenMap = resolveEntityScreenMap(analysis, entity);
        for (let bankIndex = 0; bankIndex < 3; bankIndex++) {
            const chars: number[] = [];
            for (let y = 0; y < heightChars; y++) {
                for (let x = 0; x < widthChars; x++) {
                    chars.push(resolveRuntimeTileBankCharCode(analysis, tile, screenMap, bankIndex, x, y));
                }
            }
            const label = `carry_box_tile_matrix_${index}_bank${bankIndex}`;
            matrixLabels[index * 3 + bankIndex] = label;
            matrixBlocks.push(asmDb(label, chars, widthChars));
        }

        const behaviorLabel = `carry_box_behavior_matrix_${index}`;
        behaviorMatrixLabels[index] = behaviorLabel;
        boxTileWidth[index] = widthChars;
        boxTileHeight[index] = heightChars;
        behaviorMatrixBlocks.push(asmDb(behaviorLabel, behaviorBytes, widthChars));
    });

    const pointerLines = matrixLabels.map(label => `    DW ${label}`).join('\n');
    const behaviorPointerLines = behaviorMatrixLabels.map(label => `    DW ${label}`).join('\n');
    const dataAsm = `
${asmDb('entity_carry_enabled_init', carryEnabled)}
${asmDb('entity_carry_sprite_index_init', carrySpriteIndex)}
${asmDb('entity_box_carriable_init', boxCarriable)}
${asmDb('entity_box_tile_width_init', boxTileWidth)}
${asmDb('entity_box_tile_height_init', boxTileHeight)}
${asmDb('entity_box_collision_layer_init', boxCollisionLayer)}
${asmDb('entity_box_collides_with_init', boxCollidesWith)}
entity_box_tile_matrix_ptrs:
${pointerLines}
entity_box_tile_behavior_matrix_ptrs:
${behaviorPointerLines}
carry_box_empty_matrix:
    DB #00
carry_box_empty_behavior_matrix:
    DB #00
${matrixBlocks.join('\n')}
${behaviorMatrixBlocks.join('\n')}
`;

    return { dataAsm };
}

function emitDirectionalFacingSpriteSync(labelPrefix: string, source: 'initial' | 'current' = 'initial'): string {
    const sourceComment = source === 'current'
        ? 'Use the active sprite so StateMachine-owned animations keep their state.'
        : 'Use the spawn sprite so plain auto-facing matches patrol/entity defaults.';
    const helper = source === 'current'
        ? 'component_sync_directional_sprite_from_current'
        : 'component_sync_directional_sprite_from_initial';
    return `
            ; Apply directional sprite variants from entity_facing_dir locally.
            ; Register contract: input DE = active entity index; preserves AF, BC, DE, HL.
            ; This must not call update_entity_patrol_facing because MegaROM lower
            ; page segments cannot safely call each other by raw address in ASCII16.
            ; ${sourceComment}
            call ${helper}
    `;
}

function generateDirectionalFacingSpriteSyncHelpers(): string {
    return wrapMideasAsmBlock(`
; ------------------------------------------------------------------
; component_sync_directional_sprite_from_initial/current
; Shared resident helper for local directional sprite variant sync.
; Input: DE = active entity index.
; Output: entity_sprite_asset_index may be replaced and animation reset.
; Clobbers internally: AF, BC, HL. Preserves: AF, BC, DE, HL.
; ------------------------------------------------------------------
component_sync_directional_sprite_from_initial:
    push af
    push bc
    push de
    push hl
    ld bc, entity_sprite_asset_index_init
    jp component_sync_directional_sprite_common

component_sync_directional_sprite_from_current:
    push af
    push bc
    push de
    push hl
    ld bc, entity_sprite_asset_index

component_sync_directional_sprite_common:
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    or a
    jp z, .csds_done
    cp 1
    jp z, .csds_left
    cp 2
    jp z, .csds_right
    cp 3
    jp z, .csds_up
    cp 4
    jp z, .csds_down
    jp .csds_done

.csds_left:
    ld hl, sprite_dir_left_table
    jp .csds_lookup
.csds_right:
    ld hl, sprite_dir_right_table
    jp .csds_lookup
.csds_up:
    ld hl, sprite_dir_up_table
    jp .csds_lookup
.csds_down:
    ld hl, sprite_dir_down_table

.csds_lookup:
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp z, .csds_done
    cp SPRITE_ASSET_COUNT
    jp nc, .csds_done
    ld c, a
    ld b, 0
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jp z, .csds_done
    ld (hl), a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0

.csds_done:
    pop hl
    pop de
    pop bc
    pop af
    ret
`, {
        id: 'runtime.components.directional_sprite_sync',
        kind: 'routine',
        owner: 'components',
        roots: ['component_sync_directional_sprite_from_initial', 'component_sync_directional_sprite_from_current', 'component_sync_directional_sprite_common'],
    });
}

function wrapDialogueText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
    const width = Math.max(1, maxCharsPerLine | 0);
    const lineLimit = Math.max(1, maxLines | 0);
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const rows: string[] = [];
    let current = '';

    const pushCurrent = () => {
        if (rows.length >= lineLimit) return;
        rows.push(current.trimEnd());
        current = '';
    };

    for (const word of words) {
        if (rows.length >= lineLimit) break;
        if (!current) {
            current = word.slice(0, width);
            if (word.length > width) pushCurrent();
            continue;
        }
        if (current.length + 1 + word.length <= width) {
            current += ` ${word}`;
        } else {
            pushCurrent();
            current = word.slice(0, width);
            if (word.length > width) pushCurrent();
        }
    }
    if (current && rows.length < lineLimit) rows.push(current.trimEnd());
    return rows.length > 0 ? rows : [''];
}

function normalizeDialogueExportText(text: string, stripUnsupportedChars: boolean): string {
    if (!stripUnsupportedChars) return String(text || '');

    const replacements: Record<string, string> = {
        '¿': '?',
        '¡': '!',
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'",
        '…': '...',
        '–': '-',
        '—': '-',
        '€': 'E',
    };

    return Array.from(String(text || ''))
        .map(char => replacements[char] ?? char)
        .join('')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .toUpperCase();
}

function resolveDialogueBorderCharCode(
    analysis: ProjectAnalysis,
    tileBankAssetId: string | undefined,
    tileId: string | undefined,
    screenY: number,
    fallback: number
): number {
    if (!tileBankAssetId || !tileId) return fallback;

    const tileBank = (analysis.tileBanks || []).find((bank: any) => bank?.id === tileBankAssetId);
    if (!tileBank || !Array.isArray((tileBank as any).banks)) return fallback;

    const sector = Math.max(0, Math.min(2, Math.floor(screenY / 8)));
    const banks = [
        (tileBank as any).banks[sector],
        ...(tileBank as any).banks,
    ].filter(Boolean);

    for (const bank of banks) {
        const assignment = bank?.assignedTiles?.[tileId];
        const charCode = Number(assignment?.charCode);
        if (Number.isFinite(charCode)) {
            return clampByteValue(charCode, fallback);
        }
    }

    return fallback;
}

function resolveDialogueGraphicConfig(analysis: ProjectAnalysis, graphicConfig: any): any {
    const portraitAssetId = String(graphicConfig?.portraitAssetId || '').trim();
    if (!portraitAssetId) return graphicConfig || {};

    const portrait = (analysis.portraits || []).find((candidate: any) => candidate?.id === portraitAssetId);
    if (!portrait) return graphicConfig || {};

    return {
        ...(graphicConfig || {}),
        tileBankAssetId: graphicConfig?.tileBankAssetId || (portrait as any).tileBankAssetId,
        width: (portrait as any).widthChars,
        height: (portrait as any).heightChars,
        tileIds: Array.isArray((portrait as any).cells) ? (portrait as any).cells : [],
        mouth: (portrait as any).mouth || graphicConfig?.mouth,
    };
}

function buildDialogueRuntimeData(analysis: ProjectAnalysis): DialogueRuntimeBuild {
    const dialogues = Array.isArray((analysis as any).dialogues) ? (analysis as any).dialogues : [];
    const dialogueIndexById = new Map<string, number>();
    const lineIndexByDialogueId = new Map<string, Map<number, number>>();
    const lineWaitForInputByDialogueId = new Map<string, Map<number, boolean>>();
    const boxVramEntries: string[] = [];
    const textVramEntries: string[] = [];
    const widthEntries: number[] = [];
    const heightEntries: number[] = [];
    const delayEntries: number[] = [];
    const tlEntries: number[] = [];
    const trEntries: number[] = [];
    const blEntries: number[] = [];
    const brEntries: number[] = [];
    const hEntries: number[] = [];
    const vEntries: number[] = [];
    const graphicEnabledEntries: number[] = [];
    const graphicVramEntries: string[] = [];
    const graphicWidthEntries: number[] = [];
    const graphicHeightEntries: number[] = [];
    const graphicTilePtrEntries: string[] = [];
    const graphicTileBankIdEntries: number[] = [];
    const lineTextVramEntries: string[] = [];
    const lineGraphicEnabledEntries: number[] = [];
    const lineGraphicVramEntries: string[] = [];
    const lineGraphicWidthEntries: number[] = [];
    const lineGraphicHeightEntries: number[] = [];
    const lineGraphicTilePtrEntries: string[] = [];
    const lineGraphicTileBankIdEntries: number[] = [];
    const lineMouthEnabledEntries: number[] = [];
    const lineMouthVramEntries: string[] = [];
    const lineMouthClosedCharEntries: number[] = [];
    const lineMouthOpenCharEntries: number[] = [];
    const lineMouthIntervalEntries: number[] = [];
    const linePtrEntries: string[] = [];
    const lineDelayEntries: number[] = [];
    let dataAsm = '';
    let lineGlobalIndex = 0;
    const referencedGraphicTileBankIds = new Set<string>();

    dialogues.forEach((dialogue: any, dialogueIndex: number) => {
        const dialogueId = String(dialogue?.id || `dialogue_${dialogueIndex}`);
        dialogueIndexById.set(dialogueId, dialogueIndex);

        const box = dialogue?.box || {};
        const x = clampByteValue(box.x, 0);
        const y = clampByteValue(box.y, 20);
        const width = Math.max(3, Math.min(32 - Math.min(x, 31), clampByteValue(box.width, 32)));
        const height = Math.max(3, Math.min(24 - Math.min(y, 23), clampByteValue(box.height, 4)));
        const border = box.borderCharCodes || {};
        const borderTiles = box.borderTiles || {};
        const useTileBorder = box.borderSource === 'tilebank';
        const charDelay = Math.max(0, Math.min(255, clampByteValue(dialogue?.exportOptions?.charDelayFrames, 2)));
        const mouthToggleEveryChars = Math.max(0, Math.min(255, clampByteValue(dialogue?.exportOptions?.mouthToggleEveryChars, 3)));
        const baseVram = `NAMETBL + ${(y * 32) + x}`;
        const interiorWidth = Math.max(1, width - 2);
        const interiorHeight = Math.max(1, height - 2);
        const graphicY = y + 1;
        const buildGraphicRuntime = (graphicConfig: any, label: string) => {
            const resolvedGraphicConfig = resolveDialogueGraphicConfig(analysis, graphicConfig);
            const requested = resolvedGraphicConfig?.enabled === true && interiorWidth >= 2 && interiorHeight >= 1;
            const side = resolvedGraphicConfig?.side === 'right' ? 'right' : 'left';
            const graphicWidth = requested
                ? Math.max(1, Math.min(8, clampByteValue(resolvedGraphicConfig?.width, 4), interiorWidth - 1))
                : 0;
            const graphicHeight = requested
                ? Math.max(1, Math.min(6, clampByteValue(resolvedGraphicConfig?.height, 3), interiorHeight))
                : 0;
            const padding = requested
                ? Math.max(0, Math.min(4, clampByteValue(resolvedGraphicConfig?.padding, 1), interiorWidth - graphicWidth - 1))
                : 0;
            const reservedWidth = requested ? graphicWidth + padding : 0;
            const textStartX = x + 1 + (requested && side === 'left' ? reservedWidth : 0);
            const textWidth = Math.max(1, interiorWidth - reservedWidth);
            const graphicX = side === 'right' ? x + width - 1 - graphicWidth : x + 1;
            const tileIds = Array.isArray(resolvedGraphicConfig?.tileIds) ? resolvedGraphicConfig.tileIds : [];
            const tileBankAssetId = String(resolvedGraphicConfig?.tileBankAssetId || '').trim();
            if (requested && tileBankAssetId) referencedGraphicTileBankIds.add(tileBankAssetId);
            const bytes = requested
                ? Array.from({ length: graphicWidth * graphicHeight }, (_, index) => {
                    const rowY = graphicY + Math.floor(index / Math.max(1, graphicWidth));
                    return resolveDialogueBorderCharCode(analysis, tileBankAssetId, tileIds[index], rowY, 32);
                })
                : [];
            const rawMouth = resolvedGraphicConfig?.mouth || {};
            const mouthCellIndex = requested
                ? Math.max(0, Math.min(Math.max(0, (graphicWidth * graphicHeight) - 1), clampByteValue(rawMouth.cellIndex, 0)))
                : 0;
            const mouthRow = requested ? Math.floor(mouthCellIndex / Math.max(1, graphicWidth)) : 0;
            const mouthCol = requested ? mouthCellIndex % Math.max(1, graphicWidth) : 0;
            const mouthScreenY = graphicY + mouthRow;
            const mouthOpenTileId = String(rawMouth.openTileId || '').trim();
            const mouthClosedChar = requested ? (bytes[mouthCellIndex] ?? 32) : 32;
            const mouthOpenChar = requested
                ? resolveDialogueBorderCharCode(analysis, tileBankAssetId, mouthOpenTileId, mouthScreenY, mouthClosedChar)
                : mouthClosedChar;
            const mouthEnabled = Boolean(
                requested
                && rawMouth.enabled === true
                && mouthOpenTileId
                && mouthOpenChar !== mouthClosedChar
            );
            return {
                requested,
                label,
                tileBankAssetId,
                textVram: `NAMETBL + ${((y + 1) * 32) + textStartX}`,
                textWidth,
                vram: requested ? `NAMETBL + ${(graphicY * 32) + graphicX}` : '0',
                width: graphicWidth,
                height: graphicHeight,
                bytes,
                mouth: {
                    enabled: mouthEnabled,
                    vram: mouthEnabled ? `NAMETBL + ${((mouthScreenY * 32) + graphicX + mouthCol)}` : '0',
                    closedChar: mouthClosedChar,
                    openChar: mouthOpenChar,
                },
            };
        };
        const generatedTopLeft = clampByteValue(border.topLeft, 43);
        const generatedTopRight = clampByteValue(border.topRight, 43);
        const generatedBottomLeft = clampByteValue(border.bottomLeft, 43);
        const generatedBottomRight = clampByteValue(border.bottomRight, 43);
        const generatedHorizontal = clampByteValue(border.horizontal, 45);
        const generatedVertical = clampByteValue(border.vertical, 124);
        const topY = y;
        const bottomY = y + height - 1;

        boxVramEntries.push(baseVram);
        widthEntries.push(width);
        heightEntries.push(height);
        delayEntries.push(charDelay);
        tlEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.topLeftTileId, topY, generatedTopLeft) : generatedTopLeft);
        trEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.topRightTileId, topY, generatedTopRight) : generatedTopRight);
        blEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.bottomLeftTileId, bottomY, generatedBottomLeft) : generatedBottomLeft);
        brEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.bottomRightTileId, bottomY, generatedBottomRight) : generatedBottomRight);
        hEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.horizontalTileId, topY, generatedHorizontal) : generatedHorizontal);
        vEntries.push(useTileBorder ? resolveDialogueBorderCharCode(analysis, box.tileBankAssetId, borderTiles.verticalTileId, topY, generatedVertical) : generatedVertical);

        const dialogueLabel = sanitizeAsmLabelPart(dialogue?.name || dialogueId, `dialogue_${dialogueIndex}`);
        const defaultGraphic = buildGraphicRuntime(box.graphic || {}, `dialogue_graphic_${dialogueIndex}_${dialogueLabel}`);
        textVramEntries.push(defaultGraphic.textVram);
        if (defaultGraphic.requested) {
            dataAsm += `${defaultGraphic.label}:\n    DB ${defaultGraphic.bytes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}\n`;
            graphicEnabledEntries.push(1);
            graphicVramEntries.push(defaultGraphic.vram);
            graphicWidthEntries.push(defaultGraphic.width);
            graphicHeightEntries.push(defaultGraphic.height);
            graphicTilePtrEntries.push(defaultGraphic.label);
            graphicTileBankIdEntries.push(defaultGraphic.tileBankAssetId ? -1 : 0xff);
        } else {
            graphicEnabledEntries.push(0);
            graphicVramEntries.push('0');
            graphicWidthEntries.push(0);
            graphicHeightEntries.push(0);
            graphicTilePtrEntries.push('0');
            graphicTileBankIdEntries.push(0xff);
        }

        const lineMap = new Map<number, number>();
        const lineWaitMap = new Map<number, boolean>();
        lineIndexByDialogueId.set(dialogueId, lineMap);
        lineWaitForInputByDialogueId.set(dialogueId, lineWaitMap);
        const stripUnsupportedChars = dialogue?.exportOptions?.stripUnsupportedChars !== false;

        (Array.isArray(dialogue?.lines) ? dialogue.lines : []).forEach((line: any, lineIndex: number) => {
            const label = `dialogue_line_${lineGlobalIndex}_${dialogueLabel}`;
            const lineGraphic = line?.graphic
                ? buildGraphicRuntime(line.graphic, `dialogue_line_graphic_${lineGlobalIndex}_${dialogueLabel}`)
                : defaultGraphic;
            const maxChars = Math.min(lineGraphic.textWidth, Math.max(1, clampByteValue(dialogue?.exportOptions?.maxCharsPerLine, lineGraphic.textWidth)));
            const maxLines = Math.min(interiorHeight, Math.max(1, clampByteValue(dialogue?.exportOptions?.maxLinesPerBox, interiorHeight)));
            const speakerPrefix = String(line?.speaker || '').trim();
            const lineText = normalizeDialogueExportText(`${speakerPrefix ? `${speakerPrefix}: ` : ''}${String(line?.text || '')}`, stripUnsupportedChars);
            const rows = wrapDialogueText(lineText, maxChars, maxLines);
            const bytes: number[] = [];
            rows.forEach((row, rowIndex) => {
                for (const char of row) {
                    const code = char.charCodeAt(0);
                    bytes.push(code >= 32 && code <= 126 ? code : 32);
                }
                if (rowIndex < rows.length - 1) bytes.push(10);
            });
            bytes.push(0);
            if (line?.graphic && lineGraphic.requested) {
                dataAsm += `${lineGraphic.label}:\n    DB ${lineGraphic.bytes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}\n`;
            }
            dataAsm += `${label}:\n    DB ${bytes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}\n`;
            lineMap.set(lineIndex, lineGlobalIndex);
            lineWaitMap.set(lineIndex, line?.waitForInput !== false);
            lineTextVramEntries.push(lineGraphic.textVram);
            lineGraphicEnabledEntries.push(lineGraphic.requested ? 1 : 0);
            lineGraphicVramEntries.push(lineGraphic.vram);
            lineGraphicWidthEntries.push(lineGraphic.width);
            lineGraphicHeightEntries.push(lineGraphic.height);
            lineGraphicTilePtrEntries.push(lineGraphic.requested ? lineGraphic.label : '0');
            lineGraphicTileBankIdEntries.push(lineGraphic.requested && lineGraphic.tileBankAssetId ? -1 : 0xff);
            const mouthEnabled = lineGraphic.mouth.enabled && mouthToggleEveryChars > 0;
            lineMouthEnabledEntries.push(mouthEnabled ? 1 : 0);
            lineMouthVramEntries.push(mouthEnabled ? lineGraphic.mouth.vram : '0');
            lineMouthClosedCharEntries.push(lineGraphic.mouth.closedChar);
            lineMouthOpenCharEntries.push(lineGraphic.mouth.openChar);
            lineMouthIntervalEntries.push(mouthEnabled ? mouthToggleEveryChars : 0);
            linePtrEntries.push(label);
            lineDelayEntries.push(charDelay);
            lineGlobalIndex++;
        });
    });

    const graphicTileBankIdList = Array.from(referencedGraphicTileBankIds);
    const graphicTileBankIndexById = new Map(graphicTileBankIdList.map((id, index) => [id, index]));
    const resolveGraphicTileBankIdValue = (tileBankId: string): number => {
        const index = graphicTileBankIndexById.get(tileBankId);
        return index === undefined ? 0xff : index;
    };

    let graphicEntryIndex = 0;
    dialogues.forEach((dialogue: any) => {
        const defaultGraphic = resolveDialogueGraphicConfig(analysis, dialogue?.box?.graphic || {});
        if (graphicTileBankIdEntries[graphicEntryIndex] === -1) {
            graphicTileBankIdEntries[graphicEntryIndex] = resolveGraphicTileBankIdValue(String(defaultGraphic?.tileBankAssetId || '').trim());
        }
        graphicEntryIndex++;
    });

    let lineGraphicEntryIndex = 0;
    dialogues.forEach((dialogue: any) => {
        const defaultGraphic = resolveDialogueGraphicConfig(analysis, dialogue?.box?.graphic || {});
        (Array.isArray(dialogue?.lines) ? dialogue.lines : []).forEach((line: any) => {
            const sourceGraphic = line?.graphic ? resolveDialogueGraphicConfig(analysis, line.graphic) : defaultGraphic;
            if (lineGraphicTileBankIdEntries[lineGraphicEntryIndex] === -1) {
                lineGraphicTileBankIdEntries[lineGraphicEntryIndex] = resolveGraphicTileBankIdValue(String(sourceGraphic?.tileBankAssetId || '').trim());
            }
            lineGraphicEntryIndex++;
        });
    });

    const ensureEntries = <T,>(entries: T[], fallback: T): T[] => entries.length > 0 ? entries : [fallback];
    const ptrTable = (label: string, entries: string[]) => `${label}:\n${ensureEntries(entries, '0').map(entry => `    DW ${entry}`).join('\n')}\n`;
    const byteTable = (label: string, entries: number[], fallback = 0) => `${label}:\n    DB ${ensureEntries(entries, fallback).map(value => String(value & 0xff)).join(',')}\n`;

    dataAsm += `dialogue_box_count:\n    DB ${Math.max(0, dialogues.length)}\n`;
    dataAsm += ptrTable('dialogue_box_vram_table', boxVramEntries);
    dataAsm += ptrTable('dialogue_text_vram_table', textVramEntries);
    dataAsm += byteTable('dialogue_box_width_table', widthEntries, 32);
    dataAsm += byteTable('dialogue_box_height_table', heightEntries, 4);
    dataAsm += byteTable('dialogue_box_delay_table', delayEntries, 2);
    dataAsm += byteTable('dialogue_box_tl_table', tlEntries, 43);
    dataAsm += byteTable('dialogue_box_tr_table', trEntries, 43);
    dataAsm += byteTable('dialogue_box_bl_table', blEntries, 43);
    dataAsm += byteTable('dialogue_box_br_table', brEntries, 43);
    dataAsm += byteTable('dialogue_box_h_table', hEntries, 45);
    dataAsm += byteTable('dialogue_box_v_table', vEntries, 124);
    dataAsm += byteTable('dialogue_graphic_enabled_table', graphicEnabledEntries, 0);
    dataAsm += ptrTable('dialogue_graphic_vram_table', graphicVramEntries);
    dataAsm += byteTable('dialogue_graphic_width_table', graphicWidthEntries, 0);
    dataAsm += byteTable('dialogue_graphic_height_table', graphicHeightEntries, 0);
    dataAsm += ptrTable('dialogue_graphic_tile_ptr_table', graphicTilePtrEntries);
    dataAsm += byteTable('dialogue_graphic_tilebank_id_table', graphicTileBankIdEntries, 0xff);
    dataAsm += ptrTable('dialogue_line_text_vram_table', lineTextVramEntries);
    dataAsm += byteTable('dialogue_line_graphic_enabled_table', lineGraphicEnabledEntries, 0);
    dataAsm += ptrTable('dialogue_line_graphic_vram_table', lineGraphicVramEntries);
    dataAsm += byteTable('dialogue_line_graphic_width_table', lineGraphicWidthEntries, 0);
    dataAsm += byteTable('dialogue_line_graphic_height_table', lineGraphicHeightEntries, 0);
    dataAsm += ptrTable('dialogue_line_graphic_tile_ptr_table', lineGraphicTilePtrEntries);
    dataAsm += byteTable('dialogue_line_graphic_tilebank_id_table', lineGraphicTileBankIdEntries, 0xff);
    dataAsm += byteTable('dialogue_line_mouth_enabled_table', lineMouthEnabledEntries, 0);
    dataAsm += ptrTable('dialogue_line_mouth_vram_table', lineMouthVramEntries);
    dataAsm += byteTable('dialogue_line_mouth_closed_char_table', lineMouthClosedCharEntries, 32);
    dataAsm += byteTable('dialogue_line_mouth_open_char_table', lineMouthOpenCharEntries, 32);
    dataAsm += byteTable('dialogue_line_mouth_interval_table', lineMouthIntervalEntries, 0);
    dataAsm += ptrTable('dialogue_line_ptr_table', linePtrEntries);
    dataAsm += byteTable('dialogue_line_delay_table', lineDelayEntries, 2);

    if (graphicTileBankIdList.length > 0) {
        dataAsm += `dialogue_graphic_tilebank_load_patterns_table:\n${graphicTileBankIdList.map(tileBankId => `    DW ${getScreen2TileBankPatternLoaderLabel(tileBankId)}`).join('\n')}\n`;
        dataAsm += `dialogue_graphic_tilebank_load_colors_table:\n${graphicTileBankIdList.map(tileBankId => `    DW ${getScreen2TileBankColorLoaderLabel(tileBankId)}`).join('\n')}\n`;
        dataAsm += `dialogue_graphic_tilebank_screen2_id_table:\n    DB ${graphicTileBankIdList.map(tileBankId => getScreen2TileBankIdLabel(tileBankId)).join(',')}\n`;
    } else {
        dataAsm += `dialogue_graphic_tilebank_load_patterns_table:\n    DW 0\ndialogue_graphic_tilebank_load_colors_table:\n    DW 0\ndialogue_graphic_tilebank_screen2_id_table:\n    DB #FF\n`;
    }

    return {
        dataAsm,
        dialogueIndexById,
        lineIndexByDialogueId,
        lineWaitForInputByDialogueId,
        hasDialogue: dialogues.length > 0 && linePtrEntries.length > 0,
    };
}

function parseAutoControlCommands(
    commands: string,
    defaultDialogueAssetId: string,
    dialogueRuntime: DialogueRuntimeBuild
): number[] {
    const bytes: number[] = [];
    const append = (opcode: number, operand = 0) => {
        bytes.push(opcode & 0xff, Math.max(0, Math.min(255, Math.round(operand))) & 0xff);
    };
    const appendDelayMs = (ms: number) => {
        const frames = Math.max(1, Math.round((ms || 1000) / 20));
        append(AUTO_CMD.DELAY, Math.min(255, frames));
    };
    const appendDelaySeconds = (seconds: number) => {
        const frames = Math.max(1, Math.round((seconds || 1) * 50));
        append(AUTO_CMD.DELAY, Math.min(255, frames));
    };
    const dialogueIndex = dialogueRuntime.dialogueIndexById.get(defaultDialogueAssetId) ?? 0;
    const defaultLineMap = dialogueRuntime.lineIndexByDialogueId.get(defaultDialogueAssetId);
    const defaultLineWaitMap = dialogueRuntime.lineWaitForInputByDialogueId.get(defaultDialogueAssetId);

    const lines = String(commands || '')
        .split(/\r?\n/)
        .map(line => line.replace(/[;#].*/, '').trim())
        .filter(Boolean);

    for (const line of lines) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        let command = String(parts[0] || '').trim().toLowerCase();
        let operandToken = parts[1];
        const second = String(parts[1] || '').trim().toLowerCase();

        if ((command === 'move' || command === 'dash') && ['left', 'right', 'up', 'down'].includes(second)) {
            command = `${command}_${second}`;
            operandToken = parts[2];
        } else if (command === 'wait' && ['spc', 'space'].includes(second)) {
            command = 'wait_spc';
            operandToken = parts[2];
        } else if (command === 'wait' && ['text', 'typewriter'].includes(second)) {
            command = 'wait_text';
            operandToken = parts[2];
        } else if (command === 'wait' && ['second', 'seconds'].includes(second)) {
            command = 'wait_seconds';
            operandToken = parts[2];
        } else if ((command === 'write' || command === 'write_text') && ['text', 'line'].includes(second)) {
            command = 'write_line';
            operandToken = parts[2];
        } else if (command === 'open' && ['dialog', 'dialogue', 'frame_dialog', 'frame-dialog'].includes(second)) {
            command = 'open_dialog';
            operandToken = parts[2];
        } else if (command === 'close' && ['dialog', 'dialogue', 'frame_dialog', 'frame-dialog'].includes(second)) {
            command = 'close_dialog';
            operandToken = parts[2];
        }

        if (command === 'spc') command = 'wait_spc';
        if (command === 'clean') command = 'clear_dialog';
        if (command === 'write_text') command = 'write_line';
        if (command === 'open_frame_dialog' || command === 'open-frame-dialog') command = 'open_dialog';
        if (command === 'close_frame_dialog' || command === 'close-frame-dialog') command = 'close_dialog';

        const operand = Number(operandToken);
        const amount = Number.isFinite(operand) ? operand : 0;

        switch (command) {
            case 'move_right':
            case 'right':
                append(AUTO_CMD.MOVE_RIGHT, amount || 16);
                break;
            case 'move_left':
            case 'left':
                append(AUTO_CMD.MOVE_LEFT, amount || 16);
                break;
            case 'move_up':
            case 'up':
                append(AUTO_CMD.MOVE_UP, amount || 16);
                break;
            case 'move_down':
            case 'down':
                append(AUTO_CMD.MOVE_DOWN, amount || 16);
                break;
            case 'dash_right':
                append(AUTO_CMD.MOVE_RIGHT, amount || 48);
                break;
            case 'dash_left':
                append(AUTO_CMD.MOVE_LEFT, amount || 48);
                break;
            case 'dash_up':
                append(AUTO_CMD.MOVE_UP, amount || 32);
                break;
            case 'dash_down':
                append(AUTO_CMD.MOVE_DOWN, amount || 32);
                break;
            case 'jump':
                append(AUTO_CMD.MOVE_UP, amount || 24);
                break;
            case 'delay':
            case 'delay_ms':
            case 'wait_ms': {
                appendDelayMs(amount);
                break;
            }
            case 'wait':
            case 'wait_seconds':
            case 'delay_seconds': {
                appendDelaySeconds(amount);
                break;
            }
            case 'wait_spc':
            case 'wait_space':
                append(AUTO_CMD.WAIT_SPC, 0);
                break;
            case 'wait_text':
            case 'wait_typewriter':
                append(AUTO_CMD.WAIT_TEXT, 0);
                break;
            case 'play_dialog':
            case 'play_dialogue': {
                append(AUTO_CMD.OPEN_DIALOG, dialogueIndex);
                const lineEntries = Array.from(defaultLineMap?.entries() || [])
                    .sort(([left], [right]) => left - right);
                for (const [localLineIndex, globalLineIndex] of lineEntries) {
                    append(AUTO_CMD.WRITE_LINE, globalLineIndex);
                    append(defaultLineWaitMap?.get(localLineIndex) === false ? AUTO_CMD.WAIT_TEXT : AUTO_CMD.WAIT_SPC, 0);
                }
                append(AUTO_CMD.CLOSE_DIALOG, 0);
                break;
            }
            case 'open_dialog':
                append(AUTO_CMD.OPEN_DIALOG, dialogueIndex);
                break;
            case 'write_line': {
                const lineIndex = Number.isFinite(amount) ? amount : 0;
                append(AUTO_CMD.WRITE_LINE, defaultLineMap?.get(lineIndex) ?? 0);
                break;
            }
            case 'clear_dialog':
                append(AUTO_CMD.CLEAR_DIALOG, 0);
                break;
            case 'close_dialog':
                append(AUTO_CMD.CLOSE_DIALOG, 0);
                break;
            case 'grab_wall':
            case 'release_wall':
                append(AUTO_CMD.NOP, 0);
                break;
            default:
                append(AUTO_CMD.NOP, 0);
                break;
        }
    }

    append(AUTO_CMD.END, 0);
    return bytes;
}

function encodeAsmByteString(value: string): string {
    const bytes = Array.from(String(value || ''))
        .map(char => char.charCodeAt(0))
        .filter(code => code >= 0x20 && code <= 0x7e);
    bytes.push(0);
    return bytes.map(code => `#${code.toString(16).toUpperCase().padStart(2, '0')}`).join(',');
}

function normalizeAutoEventStringForAsm(
    eventString: string,
    defaultDialogueAssetId: string,
    dialogueRuntime: DialogueRuntimeBuild
): string {
    const source = String(eventString || '').replace(/\s+/g, '');
    const lineMap = dialogueRuntime.lineIndexByDialogueId.get(defaultDialogueAssetId);
    let output = '';
    let cursor = 0;
    const tokenPattern = /([xXyYdw])(\d+)|[ostkc]/g;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(source)) !== null) {
        if (match.index !== cursor) break;
        cursor = match.index + match[0].length;
        const command = match[0][0];
        const rawValue = Number(match[2] || 0);
        if (command === 'w') {
            const localLineIndex = Math.max(0, rawValue - 1);
            output += `w${lineMap?.get(localLineIndex) ?? 0}`;
        } else {
            output += match[0];
        }
    }

    return cursor === source.length ? output : '';
}

function buildAutoControlScriptData(analysis: ProjectAnalysis): AutoControlScriptBuild {
    const entities = Array.isArray(analysis.entities) ? analysis.entities : [];
    const dialogueRuntime = buildDialogueRuntimeData(analysis);
    const scriptPresent: boolean[] = new Array(32).fill(false);
    const loopFlags: number[] = new Array(32).fill(0);
    const commandIdleSpriteIndexes: number[] = new Array(32).fill(0xFF);
    const commandWalkSpriteIndexes: number[] = new Array(32).fill(0xFF);
    const eventScriptPresent: boolean[] = new Array(32).fill(false);
    const eventLoopFlags: number[] = new Array(32).fill(0);
    const eventIdleSpriteIndexes: number[] = new Array(32).fill(0xFF);
    const eventWalkSpriteIndexes: number[] = new Array(32).fill(0xFF);
    const spriteIndexByReference = buildSpriteIndexByReference(analysis);
    let dataAsm = dialogueRuntime.dataAsm;
    let hasCommandScripts = false;
    let hasEventScripts = false;

    entities.slice(0, 32).forEach((entity: any, index: number) => {
        const template = analysis.templates?.find((candidate: any) => candidate.id === entity.entityTemplateId);
        const scriptComponent = getTemplateComponent(template, 'comp_auto_control_script');
        const scriptOverrides = entity?.componentOverrides?.['comp_auto_control_script'];
        if (!scriptComponent && !scriptOverrides) return;

        const values = getEntityComponentValues(entity, template, 'comp_auto_control_script');
        if (!boolValue(values.enabled, true) || !boolValue(values.startsOnScreenLoad, true)) return;
        const scriptFormat = String(values.scriptFormat || 'commands');
        const rawEventString = String(values.eventString || '');
        const rawCommands = String(values.commands || '');
        const shouldUseEventString = scriptFormat === 'eventString' && rawEventString.trim().length > 0;
        if (shouldUseEventString) {
            const eventString = normalizeAutoEventStringForAsm(
                rawEventString,
                String(values.defaultDialogueAssetId || ''),
                dialogueRuntime
            );
            if (!eventString) return;
            const label = `autoev_script_${index}`;
            eventScriptPresent[index] = true;
            eventLoopFlags[index] = boolValue(values.loop, false) ? 1 : 0;
            const renderValues = getEntityComponentValues(entity, template, 'comp_render');
            const renderSpriteIndex = resolveSpriteAssetIndex(renderValues.spriteAssetId, spriteIndexByReference);
            const idleSpriteIndex = resolveSpriteAssetIndex(values.idleSpriteAssetId, spriteIndexByReference);
            const walkSpriteIndex = resolveSpriteAssetIndex(values.walkSpriteAssetId, spriteIndexByReference);
            eventIdleSpriteIndexes[index] = idleSpriteIndex !== 0xFF ? idleSpriteIndex : (walkSpriteIndex !== 0xFF ? renderSpriteIndex : 0xFF);
            eventWalkSpriteIndexes[index] = walkSpriteIndex !== 0xFF ? walkSpriteIndex : (idleSpriteIndex !== 0xFF ? renderSpriteIndex : 0xFF);
            hasEventScripts = true;
            dataAsm += `${label}:
    DB ${encodeAsmByteString(eventString)}
`;
            return;
        }

        const label = `autocontrol_script_${index}`;
        scriptPresent[index] = true;
        loopFlags[index] = boolValue(values.loop, false) ? 1 : 0;
        const renderValues = getEntityComponentValues(entity, template, 'comp_render');
        const renderSpriteIndex = resolveSpriteAssetIndex(renderValues.spriteAssetId, spriteIndexByReference);
        const idleSpriteIndex = resolveSpriteAssetIndex(values.idleSpriteAssetId, spriteIndexByReference);
        const walkSpriteIndex = resolveSpriteAssetIndex(values.walkSpriteAssetId, spriteIndexByReference);
        commandIdleSpriteIndexes[index] = idleSpriteIndex !== 0xFF ? idleSpriteIndex : (walkSpriteIndex !== 0xFF ? renderSpriteIndex : 0xFF);
        commandWalkSpriteIndexes[index] = walkSpriteIndex !== 0xFF ? walkSpriteIndex : (idleSpriteIndex !== 0xFF ? renderSpriteIndex : 0xFF);
        hasCommandScripts = true;

        const bytes = parseAutoControlCommands(
            rawCommands,
            String(values.defaultDialogueAssetId || ''),
            dialogueRuntime
        );
        const byteLines: string[] = [];
        for (let offset = 0; offset < bytes.length; offset += 16) {
            byteLines.push(`    DB ${bytes.slice(offset, offset + 16).map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}`);
        }
        dataAsm += `${label}:
${byteLines.join('\n')}
`;
    });

    if (hasCommandScripts) {
        const ptrEntries = entities.slice(0, 32).map((_: any, index: number) => scriptPresent[index] ? `autocontrol_script_${index}` : '0');
        while (ptrEntries.length < 32) ptrEntries.push('0');

        const loopEntries = loopFlags.map(value => String(value));
        dataAsm += `autocontrol_script_ptr_table:
${ptrEntries.map(entry => `    DW ${entry}`).join('\n')}
autocontrol_loop_flag_table:
    DB ${loopEntries.join(',')}
`;
    }

    const hasCommandSpriteOverrides =
        commandIdleSpriteIndexes.some(value => value !== 0xFF) ||
        commandWalkSpriteIndexes.some(value => value !== 0xFF);
    if (hasCommandScripts && hasCommandSpriteOverrides) {
        dataAsm += `autocontrol_idle_sprite_table:
    DB ${commandIdleSpriteIndexes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}
autocontrol_walk_sprite_table:
    DB ${commandWalkSpriteIndexes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}
`;
    }

    if (hasEventScripts) {
        const eventPtrEntries = entities.slice(0, 32).map((_: any, index: number) => eventScriptPresent[index] ? `autoev_script_${index}` : '0');
        while (eventPtrEntries.length < 32) eventPtrEntries.push('0');
        dataAsm += `autoev_script_ptr_table:
${eventPtrEntries.map(entry => `    DW ${entry}`).join('\n')}
`;
    }

    const hasEventLoopFlags = eventLoopFlags.some(value => value !== 0);
    if (hasEventScripts && hasEventLoopFlags) {
        const eventLoopEntries = eventLoopFlags.map(value => String(value));
        dataAsm += `autoev_loop_flag_table:
    DB ${eventLoopEntries.join(',')}
`;
    }

    const hasEventSpriteOverrides =
        eventIdleSpriteIndexes.some(value => value !== 0xFF) ||
        eventWalkSpriteIndexes.some(value => value !== 0xFF);
    if (hasEventScripts && hasEventSpriteOverrides) {
        dataAsm += `autoev_idle_sprite_table:
    DB ${eventIdleSpriteIndexes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}
autoev_walk_sprite_table:
    DB ${eventWalkSpriteIndexes.map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}
`;
    }

    return {
        dataAsm,
        hasScripts: hasCommandScripts || hasEventScripts,
        hasCommandScripts,
        hasEventScripts,
        hasEventLoopFlags,
        hasCommandSpriteOverrides,
        hasEventSpriteOverrides,
        hasDialogue: dialogueRuntime.hasDialogue
    };
}

function generateAutoControlDialogueSystem(hasDialogue: boolean): string {
    if (!hasDialogue) {
        return `
; @mideas:block id=runtime.dialogue.system kind=routine owner=dialogues preserve=true roots=dialogue_update_typewriter,dialogue_open_box,dialogue_start_line,dialogue_clear_box,dialogue_close_box
dialogue_update_typewriter:
    ret

dialogue_open_box:
    ret

dialogue_start_line:
    ret

dialogue_clear_box:
    ret

dialogue_close_box:
    ret
; @mideas:endblock id=runtime.dialogue.system
`;
    }

    return `
; @mideas:block id=runtime.dialogue.system kind=routine owner=dialogues preserve=true roots=dialogue_update_typewriter,dialogue_open_box,dialogue_start_line,dialogue_clear_box,dialogue_close_box
dialogue_update_typewriter:
    ld a, (dialogue_text_active)
    or a
    ret z
    ld a, (dialogue_char_delay)
    or a
    jp z, dialogue_typewriter_emit
    dec a
    ld (dialogue_char_delay), a
    ret

dialogue_typewriter_emit:
    ld a, (dialogue_text_ptr_l)
    ld l, a
    ld a, (dialogue_text_ptr_h)
    ld h, a
    ld a, (hl)
    ld c, a
    inc hl
    ld a, l
    ld (dialogue_text_ptr_l), a
    ld a, h
    ld (dialogue_text_ptr_h), a
    ld a, c
    or a
    jp z, dialogue_typewriter_done
    cp 10
    jp z, dialogue_typewriter_newline

    ld c, a
    ld a, (dialogue_vram_ptr_l)
    ld l, a
    ld a, (dialogue_vram_ptr_h)
    ld h, a
    ld a, c
    call FAST_WRTVRM
    inc hl
    ld a, l
    ld (dialogue_vram_ptr_l), a
    ld a, h
    ld (dialogue_vram_ptr_h), a
    call dialogue_advance_mouth
    ld a, (dialogue_char_delay_reload)
    ld (dialogue_char_delay), a
    ret

dialogue_typewriter_newline:
    ld a, (dialogue_row_start_l)
    ld l, a
    ld a, (dialogue_row_start_h)
    ld h, a
    ld de, 32
    add hl, de
    ld a, l
    ld (dialogue_row_start_l), a
    ld (dialogue_vram_ptr_l), a
    ld a, h
    ld (dialogue_row_start_h), a
    ld (dialogue_vram_ptr_h), a
    ld a, (dialogue_char_delay_reload)
    ld (dialogue_char_delay), a
    ret

dialogue_typewriter_done:
    call dialogue_reset_mouth_closed
    xor a
    ld (dialogue_text_active), a
    ret

dialogue_open_box:
    call init_font_system
    call dialogue_load_box_config
    call dialogue_draw_box
    call dialogue_load_graphic_tilebank
    call dialogue_draw_graphic
    xor a
    ld (dialogue_text_active), a
    ld a, 1
    ld (dialogue_active), a
    ret

dialogue_start_line:
    ld c, a
    ld b, 0
    push bc
    ld a, (dialogue_current_box)
    call dialogue_load_box_config
    call dialogue_clear_interior
    pop bc
    push bc
    call dialogue_load_line_graphic_config
    call dialogue_load_graphic_tilebank
    call dialogue_draw_graphic
    call dialogue_reset_mouth_closed
    pop bc

    ld hl, dialogue_line_ptr_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_text_ptr_l), a
    ld a, d
    ld (dialogue_text_ptr_h), a

    ld hl, dialogue_line_delay_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_char_delay_reload), a
    xor a
    ld (dialogue_char_delay), a

    ld hl, dialogue_line_text_vram_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_vram_ptr_l), a
    ld (dialogue_row_start_l), a
    ld a, d
    ld (dialogue_vram_ptr_h), a
    ld (dialogue_row_start_h), a

    ld a, 1
    ld (dialogue_active), a
    ld (dialogue_text_active), a
    ret

dialogue_load_line_graphic_config:
    ld hl, dialogue_line_graphic_enabled_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_enabled), a
    ld hl, dialogue_line_graphic_vram_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_graphic_vram_l), a
    ld a, d
    ld (dialogue_graphic_vram_h), a
    ld hl, dialogue_line_graphic_tile_ptr_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_graphic_ptr_l), a
    ld a, d
    ld (dialogue_graphic_ptr_h), a
    ld hl, dialogue_line_graphic_width_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_width), a
    ld hl, dialogue_line_graphic_height_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_height), a
    ld hl, dialogue_line_graphic_tilebank_id_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_tilebank_id), a
    ld hl, dialogue_line_mouth_enabled_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_mouth_enabled), a
    ld hl, dialogue_line_mouth_vram_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_mouth_vram_l), a
    ld a, d
    ld (dialogue_mouth_vram_h), a
    ld hl, dialogue_line_mouth_closed_char_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_mouth_closed_char), a
    ld hl, dialogue_line_mouth_open_char_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_mouth_open_char), a
    ld hl, dialogue_line_mouth_interval_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_mouth_interval), a
    xor a
    ld (dialogue_mouth_counter), a
    ld (dialogue_mouth_state), a
    ret

dialogue_clear_box:
    ld a, (dialogue_current_box)
    call dialogue_load_box_config
    call dialogue_clear_rect
    xor a
    ld (dialogue_text_active), a
    ret

dialogue_close_box:
    call dialogue_clear_box
    xor a
    ld (dialogue_active), a
    ret

dialogue_load_box_config:
    ld c, a
    ld a, (dialogue_box_count)
    or a
    ret z
    ld b, a
    ld a, c
    cp b
    jp c, dialogue_load_box_config_index_ok
    xor a
dialogue_load_box_config_index_ok:
    ld (dialogue_current_box), a
    ld c, a
    ld b, 0

    ld hl, dialogue_box_vram_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_box_vram_l), a
    ld a, d
    ld (dialogue_box_vram_h), a

    ld hl, dialogue_box_width_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_width), a
    ld hl, dialogue_box_height_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_height), a
    ld hl, dialogue_box_delay_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_char_delay_reload), a

    ld hl, dialogue_box_tl_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_tl_char), a
    ld hl, dialogue_box_tr_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_tr_char), a
    ld hl, dialogue_box_bl_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_bl_char), a
    ld hl, dialogue_box_br_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_br_char), a
    ld hl, dialogue_box_h_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_h_char), a
    ld hl, dialogue_box_v_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_box_v_char), a

    ld hl, dialogue_graphic_enabled_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_enabled), a
    ld hl, dialogue_graphic_vram_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_graphic_vram_l), a
    ld a, d
    ld (dialogue_graphic_vram_h), a
    ld hl, dialogue_graphic_tile_ptr_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    ld (dialogue_graphic_ptr_l), a
    ld a, d
    ld (dialogue_graphic_ptr_h), a
    ld hl, dialogue_graphic_width_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_width), a
    ld hl, dialogue_graphic_height_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_height), a
    ld hl, dialogue_graphic_tilebank_id_table
    add hl, bc
    ld a, (hl)
    ld (dialogue_graphic_tilebank_id), a
    ret

dialogue_draw_box:
    ld a, (dialogue_box_vram_l)
    ld l, a
    ld a, (dialogue_box_vram_h)
    ld h, a
    ld a, (dialogue_box_tl_char)
    call FAST_WRTVRM
    inc hl
    ld a, (dialogue_box_width)
    sub 2
    ld c, a
    ld b, 0
    ld a, (dialogue_box_h_char)
    push bc
    call FAST_FILLVRM
    pop bc
    add hl, bc
    ld a, (dialogue_box_tr_char)
    call FAST_WRTVRM

    ld a, (dialogue_box_vram_l)
    ld l, a
    ld a, (dialogue_box_vram_h)
    ld h, a
    ld de, 32
    ld a, (dialogue_box_height)
    sub 2
    ld c, a
dialogue_draw_middle_row:
    add hl, de
dialogue_draw_middle_row_at_hl:
    push hl
    ld a, (dialogue_box_v_char)
    call FAST_WRTVRM
    inc hl
    push bc
    ld a, (dialogue_box_width)
    sub 2
    ld c, a
    ld b, 0
    ld a, 32
    push bc
    call FAST_FILLVRM
    pop bc
    add hl, bc
    pop bc
    ld a, (dialogue_box_v_char)
    call FAST_WRTVRM
    pop hl
    dec c
    jp nz, dialogue_draw_middle_row

    add hl, de
    ld a, (dialogue_box_bl_char)
    call FAST_WRTVRM
    inc hl
    ld a, (dialogue_box_width)
    sub 2
    ld c, a
    ld b, 0
    ld a, (dialogue_box_h_char)
    push bc
    call FAST_FILLVRM
    pop bc
    add hl, bc
    ld a, (dialogue_box_br_char)
    call FAST_WRTVRM
    ret

dialogue_clear_rect:
    ld a, (dialogue_box_vram_l)
    ld l, a
    ld a, (dialogue_box_vram_h)
    ld h, a
    ld a, (dialogue_box_height)
    ld c, a
dialogue_clear_rect_row:
    push hl
    push bc
    ld a, (dialogue_box_width)
    ld c, a
    ld b, 0
    ld a, 32
    call FAST_FILLVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    dec c
    jp nz, dialogue_clear_rect_row
    ret

dialogue_clear_interior:
    ld a, (dialogue_box_vram_l)
    ld l, a
    ld a, (dialogue_box_vram_h)
    ld h, a
    ld de, 33
    add hl, de
    ld a, (dialogue_box_height)
    sub 2
    ld c, a
dialogue_clear_interior_row:
    push hl
    push bc
    ld a, (dialogue_box_width)
    sub 2
    ld c, a
    ld b, 0
    ld a, 32
    call FAST_FILLVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    dec c
    jp nz, dialogue_clear_interior_row
    ret

dialogue_draw_graphic:
    ld a, (dialogue_graphic_enabled)
    or a
    ret z
    ld a, (dialogue_graphic_width)
    or a
    ret z
    ld a, (dialogue_graphic_height)
    or a
    ret z
    ld a, (dialogue_graphic_vram_l)
    ld l, a
    ld a, (dialogue_graphic_vram_h)
    ld h, a
    ld a, (dialogue_graphic_ptr_l)
    ld e, a
    ld a, (dialogue_graphic_ptr_h)
    ld d, a
    ld a, (dialogue_graphic_height)
    ld c, a
dialogue_draw_graphic_row:
    push hl
    ld a, (dialogue_graphic_width)
    ld b, a
dialogue_draw_graphic_col:
    ld a, (de)
    inc de
    call FAST_WRTVRM
    inc hl
    djnz dialogue_draw_graphic_col
    pop hl
    push de
    ld de, 32
    add hl, de
    pop de
    dec c
    jp nz, dialogue_draw_graphic_row
    ret

dialogue_advance_mouth:
    ld a, (dialogue_mouth_enabled)
    or a
    ret z
    ld a, (dialogue_mouth_interval)
    or a
    ret z
    ld a, (dialogue_mouth_counter)
    inc a
    ld (dialogue_mouth_counter), a
    ld b, a
    ld a, (dialogue_mouth_interval)
    cp b
    ret nz
    xor a
    ld (dialogue_mouth_counter), a
    ld a, (dialogue_mouth_state)
    xor 1
    ld (dialogue_mouth_state), a
    jp dialogue_write_mouth_current

dialogue_reset_mouth_closed:
    ld a, (dialogue_mouth_enabled)
    or a
    ret z
    xor a
    ld (dialogue_mouth_counter), a
    ld (dialogue_mouth_state), a
    jp dialogue_write_mouth_current

dialogue_write_mouth_current:
    ld a, (dialogue_mouth_enabled)
    or a
    ret z
    ld a, (dialogue_mouth_vram_l)
    ld l, a
    ld a, (dialogue_mouth_vram_h)
    ld h, a
    ld a, (dialogue_mouth_state)
    or a
    jp z, dialogue_write_mouth_closed
    ld a, (dialogue_mouth_open_char)
    jp dialogue_write_mouth_char
dialogue_write_mouth_closed:
    ld a, (dialogue_mouth_closed_char)
dialogue_write_mouth_char:
    call FAST_WRTVRM
    ret

dialogue_load_graphic_tilebank:
    ld a, (dialogue_graphic_enabled)
    or a
    ret z
    ld a, (dialogue_graphic_tilebank_id)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, dialogue_graphic_tilebank_screen2_id_table
    add hl, bc
    ld a, (hl)
    cp #FF
    ret z
    ld e, a
    ld a, (current_screen2_tilebank_id)
    cp e
    ret z
    push bc
    ld hl, dialogue_graphic_tilebank_load_patterns_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jr z, dialogue_load_graphic_tilebank_skip_patterns
    ex de, hl
    call dialogue_call_hl
dialogue_load_graphic_tilebank_skip_patterns:
    pop bc
    push bc
    ld hl, dialogue_graphic_tilebank_load_colors_table
    add hl, bc
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, e
    or d
    jr z, dialogue_load_graphic_tilebank_skip_colors
    ex de, hl
    call dialogue_call_hl
dialogue_load_graphic_tilebank_skip_colors:
    pop bc
    ld hl, dialogue_graphic_tilebank_screen2_id_table
    add hl, bc
    ld a, (hl)
    cp #FF
    ret z
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call init_font_system
    ret

dialogue_call_hl:
    jp (hl)
; @mideas:endblock id=runtime.dialogue.system
`;
}

function generateAutoEventStringSystem(
    hasEventScripts: boolean,
    hasEventLoopFlags: boolean = true,
    hasEventSpriteOverrides: boolean = true
): string {
    if (!hasEventScripts) {
        return `
update_auto_event_string_component:
    xor a
    ld (autoev_active), a
    ld (autoev_wait_mode), a
    ret
`;
    }

    return `
; ==================================================================
; AUTO EVENT STRING SYSTEM - compact FakePlayer engine
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Execute one frame of the compact FakePlayer event-string script.',
  inputs: ['current_screen_engine, current_screen_id, active_entity_list/current count, input_btn_curr'],
  outputs: ['FakePlayer entity position/facing, dialogue, and autoev runtime state updated'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: ['Only runs while current_screen_engine = 1 (FakePlayer screen engine).'],
})}
update_auto_event_string_component:
    ld a, (current_screen_engine)
    cp 1
    ret nz

    ld a, (current_screen_id)
    ld b, a
    ld a, (autoev_screen_id)
    cp b
    call nz, autoev_bind_current_screen

    ld a, (autoev_active)
    or a
    ret z

    call dialogue_update_typewriter

    ld a, (autoev_wait_mode)
    cp 1
    jp z, autoev_wait_spc
    cp 2
    jp z, autoev_wait_text

    ld a, (autoev_wait_frames)
    or a
    jp z, autoev_check_move
    dec a
    ld (autoev_wait_frames), a
    ret

autoev_check_move:
    ld a, (autoev_move_remaining)
    or a
    jp z, autoev_read_event
    call autoev_apply_move
    ret

autoev_wait_spc:
    ld a, (dialogue_text_active)
    or a
    ret nz
    ld a, (input_btn_curr)
    and #01
    ret z
    xor a
    ld (autoev_wait_mode), a
    ret

autoev_wait_text:
    ld a, (dialogue_text_active)
    or a
    ret nz
    xor a
    ld (autoev_wait_mode), a
    ret

autoev_read_event:
    ld a, (autoev_script_ptr_l)
    ld l, a
    ld a, (autoev_script_ptr_h)
    ld h, a
    ld a, h
    or l
    ret z

    ld a, (hl)
    inc hl
    or a
    jp z, autoev_command_end
    ld b, a

    ld a, b
    cp #78
    jp z, autoev_command_move_right
    cp #58
    jp z, autoev_command_move_left
    cp #79
    jp z, autoev_command_move_down
    cp #59
    jp z, autoev_command_move_up
    cp #64
    jp z, autoev_command_delay
    cp #6F
    jp z, autoev_command_open_dialog
    cp #77
    jp z, autoev_command_write_line
    cp #73
    jp z, autoev_command_wait_spc
    cp #74
    jp z, autoev_command_wait_text
    cp #6B
    jp z, autoev_command_clear_dialog
    cp #63
    jp z, autoev_command_close_dialog
    jp autoev_store_ptr_and_continue

autoev_command_move_right:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_set_walk_sprite
    ld a, 1
    ld (autoev_move_axis), a
    ld a, 1
    ld (autoev_move_step), a
    ld a, (autoev_number_l)
    ld (autoev_move_remaining), a
    call autoev_apply_move
    ret

autoev_command_move_left:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_set_walk_sprite
    ld a, 1
    ld (autoev_move_axis), a
    ld a, #FF
    ld (autoev_move_step), a
    ld a, (autoev_number_l)
    ld (autoev_move_remaining), a
    call autoev_apply_move
    ret

autoev_command_move_down:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_set_walk_sprite
    ld a, 2
    ld (autoev_move_axis), a
    ld a, 1
    ld (autoev_move_step), a
    ld a, (autoev_number_l)
    ld (autoev_move_remaining), a
    call autoev_apply_move
    ret

autoev_command_move_up:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_set_walk_sprite
    ld a, 2
    ld (autoev_move_axis), a
    ld a, #FF
    ld (autoev_move_step), a
    ld a, (autoev_number_l)
    ld (autoev_move_remaining), a
    call autoev_apply_move
    ret

autoev_command_delay:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    call autoev_number_to_frames
    ld (autoev_wait_frames), a
    ret

autoev_command_open_dialog:
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    xor a
    call dialogue_open_box
    ret

autoev_command_write_line:
    call autoev_parse_number
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ld a, (autoev_number_l)
    call dialogue_start_line
    ld a, 2
    ld (autoev_wait_mode), a
    ret

autoev_command_wait_spc:
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ld a, 1
    ld (autoev_wait_mode), a
    ret

autoev_command_wait_text:
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ld a, 2
    ld (autoev_wait_mode), a
    ret

autoev_command_clear_dialog:
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    call dialogue_clear_box
    ret

autoev_command_close_dialog:
    call autoev_store_ptr
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    call dialogue_close_box
    ret

autoev_store_ptr_and_continue:
    call autoev_store_ptr
    jp autoev_read_event

autoev_command_end:
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ld a, (autoev_loop_flag)
    or a
    jp nz, autoev_restart_script
    xor a
    ld (autoev_active), a
    ld (autoev_move_axis), a
    ld (autoev_move_remaining), a
    ld (autoev_wait_mode), a
    ret

autoev_restart_script:
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ld a, (autoev_script_start_l)
    ld (autoev_script_ptr_l), a
    ld a, (autoev_script_start_h)
    ld (autoev_script_ptr_h), a
    xor a
    ld (autoev_move_axis), a
    ld (autoev_move_remaining), a
    ld (autoev_wait_mode), a
    ret

autoev_store_ptr:
    ld a, l
    ld (autoev_script_ptr_l), a
    ld a, h
    ld (autoev_script_ptr_h), a
    ret

autoev_parse_number:
    ld de, 0
autoev_parse_number_loop:
    ld a, (hl)
    cp #30
    jp c, autoev_parse_number_done
    cp #3A
    jp nc, autoev_parse_number_done
    sub #30
    push hl
    ld h, d
    ld l, e
    add hl, hl
    ld b, h
    ld c, l
    add hl, hl
    add hl, hl
    add hl, bc
    ld c, a
    ld b, 0
    add hl, bc
    ld d, h
    ld e, l
    pop hl
    inc hl
    jp autoev_parse_number_loop
autoev_parse_number_done:
    ld a, e
    ld (autoev_number_l), a
    ld a, d
    ld (autoev_number_h), a
    ret

autoev_number_to_frames:
    ld a, (autoev_number_l)
    ld e, a
    ld a, (autoev_number_h)
    ld d, a
    ld b, 0
autoev_number_to_frames_loop:
    ld a, d
    or e
    jp z, autoev_number_to_frames_done
    ld h, d
    ld l, e
    ld bc, 20
    or a
    sbc hl, bc
    jp c, autoev_number_to_frames_done
    ld d, h
    ld e, l
    inc b
    jp nz, autoev_number_to_frames_loop
    ld b, #FF
autoev_number_to_frames_done:
    ld a, b
    or a
    ret nz
    ld a, 1
    ret

autoev_bind_current_screen:
    ld a, (current_screen_id)
    ld (autoev_screen_id), a
    xor a
    ld (autoev_active), a
    ld (autoev_wait_frames), a
    ld (autoev_move_axis), a
    ld (autoev_move_step), a
    ld (autoev_move_remaining), a
    ld (autoev_loop_flag), a
    ld (autoev_wait_mode), a
    ld (autoev_script_ptr_l), a
    ld (autoev_script_ptr_h), a
    ld (autoev_script_start_l), a
    ld (autoev_script_start_h), a
    ld a, #FF
    ld (autoev_entity_index), a

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

autoev_find_loop:
    ld c, (hl)
    inc hl
    push hl
    push bc

    ld e, c
    ld d, 0
    ld hl, autoev_script_ptr_table
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jp z, autoev_find_next

    ld a, c
    ld (autoev_entity_index), a
    ld a, e
    ld (autoev_script_ptr_l), a
    ld (autoev_script_start_l), a
    ld a, d
    ld (autoev_script_ptr_h), a
    ld (autoev_script_start_h), a

${hasEventLoopFlags ? `    ld e, c
    ld d, 0
    ld hl, autoev_loop_flag_table
    add hl, de
    ld a, (hl)
    ld (autoev_loop_flag), a
` : ''}
    ld a, 1
    ld (autoev_active), a
    call autoev_set_idle_sprite
    pop bc
    pop hl
    ret

autoev_find_next:
    pop bc
    pop hl
    djnz autoev_find_loop
    ret

autoev_apply_move:
    ld a, (autoev_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    ld a, (autoev_move_axis)
    cp 1
    jp z, autoev_apply_move_x
    cp 2
    jp z, autoev_apply_move_y
    ret

autoev_apply_move_x:
    ld a, (autoev_move_step)
    cp #FF
    jp z, autoev_move_left_pixel
    call autoev_set_velocity_right
    ld hl, entity_x_pos
    add hl, de
    inc (hl)
    ld a, 2
    jp autoev_store_facing_and_dec

autoev_move_left_pixel:
    call autoev_set_velocity_left
    ld hl, entity_x_pos
    add hl, de
    dec (hl)
    ld a, 1
    jp autoev_store_facing_and_dec

autoev_apply_move_y:
    ld a, (autoev_move_step)
    cp #FF
    jp z, autoev_move_up_pixel
    call autoev_set_velocity_down
    ld hl, entity_y_pos
    add hl, de
    inc (hl)
    ld a, 4
    jp autoev_store_facing_and_dec

autoev_move_up_pixel:
    call autoev_set_velocity_up
    ld hl, entity_y_pos
    add hl, de
    dec (hl)
    ld a, 3

autoev_store_facing_and_dec:
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    ld hl, autoev_move_remaining
    dec (hl)
    ld a, (hl)
    or a
    ret nz
    call autoev_clear_velocity
    call autoev_set_idle_sprite
    ret

autoev_clear_velocity:
    ld a, (autoev_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    ret

autoev_set_velocity_right:
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 1
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    ret

autoev_set_velocity_left:
    ld hl, entity_vel_x
    add hl, de
    ld (hl), #FF
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    ret

autoev_set_velocity_down:
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 1
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ret

autoev_set_velocity_up:
    ld hl, entity_vel_y
    add hl, de
    ld (hl), #FF
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ret

autoev_set_idle_sprite:
${hasEventSpriteOverrides ? `    ld a, (autoev_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    ld hl, autoev_idle_sprite_table
    add hl, de
    ld a, (hl)
    jp autoev_apply_sprite_index
` : `    ret
`}

autoev_set_walk_sprite:
${hasEventSpriteOverrides ? `    ld a, (autoev_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    ld hl, autoev_walk_sprite_table
    add hl, de
    ld a, (hl)
    jp autoev_apply_sprite_index
` : `    ret
`}

${hasEventSpriteOverrides ? `autoev_apply_sprite_index:
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld c, a
    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jr z, autoev_refresh_sprite_layers
    ld (hl), a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_flags
    add hl, de
    ld a, (hl)
    or ANIM_FLAG_PLAYING
    or ANIM_FLAG_FORCE_UPLOAD
    and #F7
    ld (hl), a
autoev_refresh_sprite_layers:
    push bc
    ld h, 0
    ld l, e
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld e, (hl)
    pop bc
    ld d, c
    ld c, e
    push bc
    push de

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
autoev_color_mul_layers:
    add hl, de
    djnz autoev_color_mul_layers
    ld de, SM_SpriteLayerColorTable
    add hl, de
    ld b, SPRITE_MAX_ENTITY_LAYERS
autoev_color_update_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_colors
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz autoev_color_update_loop

    pop de
    pop bc
    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
autoev_y_offset_mul_layers:
    add hl, de
    djnz autoev_y_offset_mul_layers
    ld de, SM_SpriteLayerYOffsetTable
    add hl, de
    ld b, SPRITE_MAX_ENTITY_LAYERS
autoev_y_offset_update_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_y_offsets
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz autoev_y_offset_update_loop
    ret
` : ''}
`;
}

function generateAutoControlScriptSystem(analysis: ProjectAnalysis): string {
    const scriptData = buildAutoControlScriptData(analysis);
    if (!scriptData.hasScripts) {
        return `
    ; AutoControlScript system filtered out(no active scripts)
init_auto_control_script_system:
    ret

; @mideas:block id=runtime.components.auto_control_script_stubs kind=routine owner=components
update_auto_control_script_component:
    ret

update_auto_event_string_component:
    ret
; @mideas:endblock id=runtime.components.auto_control_script_stubs
`;
    }

    if (!scriptData.hasCommandScripts) {
        return `
; ==================================================================
; AUTOCONTROL SCRIPT SYSTEM - compact FakePlayer event-string only
; ==================================================================
${scriptData.dataAsm}
${buildRegisterContractComment({
  purpose: 'Reset compact FakePlayer event-string runtime state.',
  inputs: ['None'],
  outputs: ['autoev/dialogue runtime variables reset'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
})}
init_auto_control_script_system:
    xor a
    ld (autoev_active), a
    ld (dialogue_active), a
    ld (dialogue_text_active), a
    ld (dialogue_mouth_enabled), a
    ld (dialogue_mouth_counter), a
    ld (dialogue_mouth_state), a
    ld a, #FF
    ld (autoev_screen_id), a
    ld (autoev_entity_index), a
    ret

; @mideas:block id=runtime.components.auto_control_command_stub kind=routine owner=components
update_auto_control_script_component:
    ret
; @mideas:endblock id=runtime.components.auto_control_command_stub

${generateAutoControlDialogueSystem(scriptData.hasDialogue)}
${generateAutoEventStringSystem(scriptData.hasEventScripts, scriptData.hasEventLoopFlags, scriptData.hasEventSpriteOverrides)}
`;
    }

    return `
; ==================================================================
; AUTOCONTROL SCRIPT SYSTEM - FakePlayer engine
; ==================================================================
AUTO_CMD_END        EQU ${AUTO_CMD.END}
AUTO_CMD_MOVE_RIGHT EQU ${AUTO_CMD.MOVE_RIGHT}
AUTO_CMD_MOVE_LEFT  EQU ${AUTO_CMD.MOVE_LEFT}
AUTO_CMD_MOVE_UP    EQU ${AUTO_CMD.MOVE_UP}
AUTO_CMD_MOVE_DOWN  EQU ${AUTO_CMD.MOVE_DOWN}
AUTO_CMD_DELAY      EQU ${AUTO_CMD.DELAY}
AUTO_CMD_WAIT_SPC   EQU ${AUTO_CMD.WAIT_SPC}
AUTO_CMD_NOP        EQU ${AUTO_CMD.NOP}
AUTO_CMD_OPEN_DIALOG EQU ${AUTO_CMD.OPEN_DIALOG}
AUTO_CMD_WRITE_LINE  EQU ${AUTO_CMD.WRITE_LINE}
AUTO_CMD_CLEAR_DIALOG EQU ${AUTO_CMD.CLEAR_DIALOG}
AUTO_CMD_CLOSE_DIALOG EQU ${AUTO_CMD.CLOSE_DIALOG}
AUTO_CMD_WAIT_TEXT EQU ${AUTO_CMD.WAIT_TEXT}

${scriptData.dataAsm}
${buildRegisterContractComment({
  purpose: 'Reset FakePlayer script runtime state.',
  inputs: ['None'],
  outputs: ['autocontrol runtime variables reset'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
})}
init_auto_control_script_system:
    xor a
    ld (autocontrol_script_ptr_l), a
    ld (autocontrol_script_ptr_h), a
    ld (autocontrol_script_start_l), a
    ld (autocontrol_script_start_h), a
    ld (autocontrol_wait_frames), a
    ld (autocontrol_move_opcode), a
    ld (autocontrol_move_remaining), a
    ld (autocontrol_loop_flag), a
    ld (autocontrol_active), a
    ld (autoev_script_ptr_l), a
    ld (autoev_script_ptr_h), a
    ld (autoev_script_start_l), a
    ld (autoev_script_start_h), a
    ld (autoev_wait_frames), a
    ld (autoev_move_axis), a
    ld (autoev_move_step), a
    ld (autoev_move_remaining), a
    ld (autoev_loop_flag), a
    ld (autoev_active), a
    ld (autoev_wait_mode), a
    ld (autoev_number_l), a
    ld (autoev_number_h), a
    ld (dialogue_active), a
    ld (dialogue_current_box), a
    ld (dialogue_text_active), a
    ld (dialogue_text_ptr_l), a
    ld (dialogue_text_ptr_h), a
    ld (dialogue_vram_ptr_l), a
    ld (dialogue_vram_ptr_h), a
    ld (dialogue_row_start_l), a
    ld (dialogue_row_start_h), a
    ld (dialogue_char_delay), a
    ld (dialogue_char_delay_reload), a
    ld (dialogue_mouth_enabled), a
    ld (dialogue_mouth_counter), a
    ld (dialogue_mouth_state), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ld (autocontrol_entity_index), a
    ld (autoev_screen_id), a
    ld (autoev_entity_index), a
    ret

${buildRegisterContractComment({
  purpose: 'Execute one frame of the current screen FakePlayer script.',
  inputs: ['current_screen_engine, current_screen_id, active_entity_list/current count, input_btn_curr'],
  outputs: ['FakePlayer entity position/facing and autocontrol runtime state updated'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
})}
update_auto_control_script_component:
    ld a, (current_screen_engine)
    cp 1
    ret nz

    ld a, (current_screen_id)
    ld b, a
    ld a, (autocontrol_screen_id)
    cp b
    call nz, autocontrol_bind_current_screen

    ld a, (autocontrol_active)
    or a
    ret z

    call dialogue_update_typewriter

    ld a, (autocontrol_move_opcode)
    cp AUTO_CMD_WAIT_SPC
    jp z, autocontrol_wait_spc
    cp AUTO_CMD_WAIT_TEXT
    jp z, autocontrol_wait_text

    ld a, (autocontrol_wait_frames)
    or a
    jp z, autocontrol_check_move
    dec a
    ld (autocontrol_wait_frames), a
    ret

autocontrol_check_move:
    ld a, (autocontrol_move_remaining)
    or a
    jp z, autocontrol_read_command
    call autocontrol_apply_move
    ret

autocontrol_wait_spc:
    ld a, (dialogue_text_active)
    or a
    ret nz
    ld a, (input_btn_curr)
    and #01
    ret z
    xor a
    ld (autocontrol_move_opcode), a
    ret

autocontrol_wait_text:
    ld a, (dialogue_text_active)
    or a
    ret nz
    xor a
    ld (autocontrol_move_opcode), a
    ret

autocontrol_read_command:
    ld a, (autocontrol_script_ptr_l)
    ld l, a
    ld a, (autocontrol_script_ptr_h)
    ld h, a
    ld a, h
    or l
    ret z

    ld a, (hl)
    inc hl
    ld b, (hl)
    inc hl
    push af
    ld a, l
    ld (autocontrol_script_ptr_l), a
    ld a, h
    ld (autocontrol_script_ptr_h), a
    pop af

    cp AUTO_CMD_END
    jp z, autocontrol_command_end
    cp AUTO_CMD_DELAY
    jp z, autocontrol_command_delay
    cp AUTO_CMD_WAIT_SPC
    jp z, autocontrol_command_wait_spc
    cp AUTO_CMD_WAIT_TEXT
    jp z, autocontrol_command_wait_text
    cp AUTO_CMD_OPEN_DIALOG
    jp z, autocontrol_command_open_dialog
    cp AUTO_CMD_WRITE_LINE
    jp z, autocontrol_command_write_line
    cp AUTO_CMD_CLEAR_DIALOG
    jp z, autocontrol_command_clear_dialog
    cp AUTO_CMD_CLOSE_DIALOG
    jp z, autocontrol_command_close_dialog
    cp AUTO_CMD_NOP
    ret z

    ld (autocontrol_move_opcode), a
    ld a, b
    ld (autocontrol_move_remaining), a
    call autocontrol_set_walk_sprite
    call autocontrol_apply_move
    ret

autocontrol_command_delay:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, b
    ld (autocontrol_wait_frames), a
    ret

autocontrol_command_wait_spc:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, AUTO_CMD_WAIT_SPC
    ld (autocontrol_move_opcode), a
    ret

autocontrol_command_wait_text:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, AUTO_CMD_WAIT_TEXT
    ld (autocontrol_move_opcode), a
    ret

autocontrol_command_open_dialog:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, b
    call dialogue_open_box
    ret

autocontrol_command_write_line:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, b
    call dialogue_start_line
    ret

autocontrol_command_clear_dialog:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    call dialogue_clear_box
    ret

autocontrol_command_close_dialog:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    call dialogue_close_box
    ret

autocontrol_command_end:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, (autocontrol_loop_flag)
    or a
    jp nz, autocontrol_restart_script
    xor a
    ld (autocontrol_active), a
    ld (autocontrol_move_opcode), a
    ld (autocontrol_move_remaining), a
    ret

autocontrol_restart_script:
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ld a, (autocontrol_script_start_l)
    ld (autocontrol_script_ptr_l), a
    ld a, (autocontrol_script_start_h)
    ld (autocontrol_script_ptr_h), a
    xor a
    ld (autocontrol_move_opcode), a
    ld (autocontrol_move_remaining), a
    ret

autocontrol_bind_current_screen:
    ld a, (current_screen_id)
    ld (autocontrol_screen_id), a
    xor a
    ld (autocontrol_active), a
    ld (autocontrol_wait_frames), a
    ld (autocontrol_move_opcode), a
    ld (autocontrol_move_remaining), a
    ld (autocontrol_loop_flag), a
    ld (autocontrol_script_ptr_l), a
    ld (autocontrol_script_ptr_h), a
    ld (autocontrol_script_start_l), a
    ld (autocontrol_script_start_h), a
    ld a, #FF
    ld (autocontrol_entity_index), a

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

autocontrol_find_loop:
    ld c, (hl)
    inc hl
    push hl
    push bc

    ld e, c
    ld d, 0
    ld hl, autocontrol_script_ptr_table
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jp z, autocontrol_find_next

    ld a, c
    ld (autocontrol_entity_index), a
    ld a, e
    ld (autocontrol_script_ptr_l), a
    ld (autocontrol_script_start_l), a
    ld a, d
    ld (autocontrol_script_ptr_h), a
    ld (autocontrol_script_start_h), a

    ld e, c
    ld d, 0
    ld hl, autocontrol_loop_flag_table
    add hl, de
    ld a, (hl)
    ld (autocontrol_loop_flag), a
    ld a, 1
    ld (autocontrol_active), a
    call autocontrol_set_idle_sprite
    pop bc
    pop hl
    ret

autocontrol_find_next:
    pop bc
    pop hl
    djnz autocontrol_find_loop
    ret

autocontrol_apply_move:
    ld a, (autocontrol_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    ld a, (autocontrol_move_opcode)
    cp AUTO_CMD_MOVE_RIGHT
    jp z, autocontrol_move_right
    cp AUTO_CMD_MOVE_LEFT
    jp z, autocontrol_move_left
    cp AUTO_CMD_MOVE_UP
    jp z, autocontrol_move_up
    cp AUTO_CMD_MOVE_DOWN
    jp z, autocontrol_move_down
    ret

autocontrol_move_right:
    call autocontrol_set_walk_sprite
    call autocontrol_set_velocity_right
    ld hl, entity_x_pos
    add hl, de
    inc (hl)
    ld a, 2
    jp autocontrol_store_facing_and_dec

autocontrol_move_left:
    call autocontrol_set_walk_sprite
    call autocontrol_set_velocity_left
    ld hl, entity_x_pos
    add hl, de
    dec (hl)
    ld a, 1
    jp autocontrol_store_facing_and_dec

autocontrol_move_up:
    call autocontrol_set_walk_sprite
    call autocontrol_set_velocity_up
    ld hl, entity_y_pos
    add hl, de
    dec (hl)
    ld a, 3
    jp autocontrol_store_facing_and_dec

autocontrol_move_down:
    call autocontrol_set_walk_sprite
    call autocontrol_set_velocity_down
    ld hl, entity_y_pos
    add hl, de
    inc (hl)
    ld a, 4

autocontrol_store_facing_and_dec:
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    ld hl, autocontrol_move_remaining
    dec (hl)
    ld a, (hl)
    or a
    ret nz
    call autocontrol_clear_velocity
    call autocontrol_set_idle_sprite
    ret

autocontrol_clear_velocity:
    ld a, (autocontrol_entity_index)
    cp #FF
    ret z
    ld e, a
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    ret

autocontrol_set_velocity_right:
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 1
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    ret

autocontrol_set_velocity_left:
    ld hl, entity_vel_x
    add hl, de
    ld (hl), #FF
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    ret

autocontrol_set_velocity_down:
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 1
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ret

autocontrol_set_velocity_up:
    ld hl, entity_vel_y
    add hl, de
    ld (hl), #FF
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ret

autocontrol_set_idle_sprite:
${scriptData.hasCommandSpriteOverrides ? `    push bc
    push de
    ld a, (autocontrol_entity_index)
    cp #FF
    jp z, autocontrol_set_idle_sprite_done
    ld e, a
    ld d, 0
    ld hl, autocontrol_idle_sprite_table
    add hl, de
    ld a, (hl)
    call autocontrol_apply_sprite_index
autocontrol_set_idle_sprite_done:
    pop de
    pop bc
    ret
` : `    ret
`}

autocontrol_set_walk_sprite:
${scriptData.hasCommandSpriteOverrides ? `    push bc
    push de
    ld a, (autocontrol_entity_index)
    cp #FF
    jp z, autocontrol_set_walk_sprite_done
    ld e, a
    ld d, 0
    ld hl, autocontrol_walk_sprite_table
    add hl, de
    ld a, (hl)
    call autocontrol_apply_sprite_index
autocontrol_set_walk_sprite_done:
    pop de
    pop bc
    ret
` : `    ret
`}

${scriptData.hasCommandSpriteOverrides ? `autocontrol_apply_sprite_index:
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld c, a
    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jp z, autocontrol_refresh_sprite_layers
    ld (hl), a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_flags
    add hl, de
    ld a, (hl)
    or ANIM_FLAG_PLAYING
    or ANIM_FLAG_FORCE_UPLOAD
    and #F7
    ld (hl), a
autocontrol_refresh_sprite_layers:
    push bc
    ld h, 0
    ld l, e
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld e, (hl)
    pop bc
    ld d, c
    ld c, e
    push bc
    push de

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
autocontrol_color_mul_layers:
    add hl, de
    djnz autocontrol_color_mul_layers
    ld de, SM_SpriteLayerColorTable
    add hl, de
    ld b, SPRITE_MAX_ENTITY_LAYERS
autocontrol_color_update_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_colors
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz autocontrol_color_update_loop

    pop de
    pop bc
    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
autocontrol_y_offset_mul_layers:
    add hl, de
    djnz autocontrol_y_offset_mul_layers
    ld de, SM_SpriteLayerYOffsetTable
    add hl, de
    ld b, SPRITE_MAX_ENTITY_LAYERS
autocontrol_y_offset_update_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_y_offsets
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz autocontrol_y_offset_update_loop
    ret
` : ''}

${generateAutoControlDialogueSystem(scriptData.hasDialogue)}
${generateAutoEventStringSystem(scriptData.hasEventScripts, scriptData.hasEventLoopFlags, scriptData.hasEventSpriteOverrides)}
`;
}

// ============================================================================
// OPTIMIZED UPDATE_ALL_ENTITIES GENERATOR
// ============================================================================
// Only generates CALLs for components that are actually used in the project
// This saves Z80 cycles by avoiding calls to empty stubs

/**
 * Generate optimized update_all_entities function
 * Only includes CALLs to systems that are actually used
 * @param usedComponents - Set of component names that are used in the project
 * @param avoidStateMachineDuplication - true when GameFlow already executes execute_all_state_machines
 * @returns ASM code for update_all_entities
 */
function generateUpdateAllEntities(
    usedComponents: Set<string>,
    avoidStateMachineDuplication: boolean,
    hasSecretZones: boolean,
    hasRuntimeScreenEngine: boolean,
    hasPlatformRiding: boolean
): string {
    let code = `
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
${buildRegisterContractComment({
  purpose: 'Main ECS tick entrypoint for one frame.',
  inputs: ['Entity/component tables in RAM'],
  outputs: ['Components updated in fixed order'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None (callers should save what they need)'],
  usage: [
    'Registers are scratch across component CALL chain',
    'Contract intentionally conservative to prevent hidden coupling',
  ],
  notes: ['Do not assume any register survives this routine.'],
})}
update_all_entities:
    ; Fast path: when all entities use default job cadence (period=1, entry=0),
    ; rebuild the compact list only when entity/screen membership changes.
    ld a, (entity_job_scheduler_active)
    or a
    jp nz, .update_all_entities_rebuild_list
    call ensure_used_entity_list_current
    jp .update_all_entities_list_ready
.update_all_entities_rebuild_list:
    ; Scheduler active: cadence depends on interrupt_counter, so rebuild every frame.
    call rebuild_used_entity_list
.update_all_entities_list_ready:
`;

    if (hasRuntimeScreenEngine) {
        code += `    ld a, (current_screen_engine)
    or a
    jp nz, .update_all_entities_fake_player
.update_all_entities_player:
`;
    }

    // Define the component systems in execution order
    // Format: [componentName, functionCall, comment]
    const componentSystems: [string, string, string][] = [
        ['Input', 'update_input_component', '1. Input (player control)'],
        ['Shoot', 'update_shoot_component', '2. Shooting'],
        ['Behavior', 'update_behavior_component', '3. Behavior/AI'],
        ['Patrol', 'update_entities', '3b. Patrol/per-entity update'],
        ['StateMachine', 'update_statemachine_component', '3c. State machine logic'],
        ['RetractableGate', 'update_retractable_gate_component', '3d. Retractable gate logic'],
        ['Jump', 'update_jump_component', '4. Jump impulse'],
        ['Movement', 'update_movement_component', '5. Movement'],
        ['Gravity', 'update_gravity_component', '6. Gravity'],
        ['WallGrab', 'update_wallgrab_component', '6a. Wall grab'],
        ['WallJump', 'update_walljump_component', '6b. Wall jump / wall slide'],
        ['TileInteraction', 'update_slash_component', '6c. Additive slash velocity'],
        ['Mirror', 'update_mirror_component', '6d. Mirror horizontal velocity'],
        ['Position', 'update_position_component', '7. Apply velocity'], // Always needed
        ['Carry', 'update_carry_component', '7b. Carry pickup/drop and follow'],
        ...(hasPlatformRiding ? [['Collision', 'prepare_platform_detection', '8a. Clear platform refs'] as [string, string, string]] : []),
        ['Collision', 'update_collision_component', '8b. Collision detection'],
        ...(hasPlatformRiding ? [['Collision', 'update_platform_riding', '8c. Platform riding'] as [string, string, string]] : []),
        ['WallCollision', 'update_wallcollision_component', '8d. Wall collision'],
        ['SecretZones', 'update_secret_zone_component', '8e. Secret zone runtime'],
        ['InWater', 'update_in_water_component', '8e. Water effect zone detection'],
        ['DeadlyTiles', 'update_deadly_tiles_component', '8e. Deadly tiles'],
        ['TileInteraction', 'check_tile_interaction', '8f. Tile interaction (gems/collectibles)'],
        ['Health', 'update_health_component', '9. Health/Death'],
        ['Damage', 'update_damage_component', '10. Damage'],
        ['Animation', 'update_animation_component', '11. Animation'],
        ['AutoDestroy', 'update_auto_destroy_component', '12. Auto-destroy'],
        ['Sprite', 'update_sprite_component', '13. Sprite rendering'],
    ];

    const appendSystemCalls = (systems: [string, string, string][]): number => {
      let callCount = 0;
      const processedFunctions = new Set<string>(); // Avoid duplicate calls

      for (const [component, funcCall, comment] of systems) {
        // Position is always needed (entities always have positions)
        const isRequired = component === 'Position' || component === 'Sprite';

        const isEnabled = isRequired || (component === 'SecretZones' ? hasSecretZones : usedComponents.has(component));
        if (isEnabled) {
            // GameFlow executes state machines explicitly in execute_all_state_machines.
            // Avoid running them twice per frame.
            if (avoidStateMachineDuplication && funcCall === 'update_statemachine_component') {
                continue;
            }
            // Avoid duplicate function calls (e.g., multiple Collision entries)
              if (!processedFunctions.has(funcCall)) {
                  processedFunctions.add(funcCall);
                  code += `    call ${funcCall.padEnd(30)} ; ${comment}\n`;
                  if (funcCall === 'update_shoot_component') {
                      code += `    ; Shooting may spawn entities, rebuild only if marked dirty\n`;
                    code += `    call ensure_used_entity_list_current\n`;
                }
                callCount++;
            }
        }
      }
      return callCount;
    };

    const playerCallCount = appendSystemCalls(componentSystems);

    code += `    call sync_player_runtime_from_entity\n`;
    code += `    ret\n`;

    let fakeCallCount = 0;
    if (hasRuntimeScreenEngine) {
      const fakePlayerSystemNames = new Set([
        'update_position_component',
        'update_animation_component',
        'update_auto_destroy_component',
        'update_sprite_component',
      ]);
      const fakePlayerSystems = componentSystems.filter(([, funcCall]) => fakePlayerSystemNames.has(funcCall));
      code += `.update_all_entities_fake_player:
`;
      if (usedComponents.has('AutoControlScript')) {
        code += `    call update_auto_control_script_component ; FakePlayer script\n`;
        code += `    call update_auto_event_string_component ; compact FakePlayer event script\n`;
        fakeCallCount++;
      }
      fakeCallCount = appendSystemCalls(fakePlayerSystems);
      code += `    ret\n`;
    }

    code += `; Total player systems called: ${playerCallCount} (optimized from 16)\n`;
    if (hasRuntimeScreenEngine) {
      code += `; Total fake-player systems called: ${fakeCallCount} (screen engine optimized)\n`;
    }
    code += `\n`;
    code += `
; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Mark compact active-entity cache as stale.',
  inputs: ['None'],
  outputs: ['active_entity_list_dirty = 1'],
  clobbers: ['HL'],
  preserved: ['AF', 'BC', 'DE'],
  usage: ['HL = points to dirty flag byte'],
})}
mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Conditionally rebuild compact active list only when dirty.',
  inputs: ['active_entity_list_dirty flag'],
  outputs: ['active_entity_list rebuilt if needed'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL (except nested call clobbers when rebuild happens)'],
  usage: ['A = dirty flag test and branch'],
  notes: ['If dirty, downstream rebuild_used_entity_list can clobber many registers.'],
})}
ensure_used_entity_list_current:
    ld a, (active_entity_list_dirty)
    or a
    ret z
    call rebuild_used_entity_list
    ret

; ------------------------------------------------------------------
; rebuild_used_entity_list
; Build compact list of ACTIVE entity slots that are in use
; for the CURRENT SCREEN only:
; (entity_active != 0 and mask_l|mask_h != 0 and entity_screen_id == current_screen_id)
; Output:
;   active_entity_list[]   = entity indices with components
;   active_entity_count    = number of entries
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Recompute compact list of entities active on current screen.',
  inputs: ['entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id'],
  outputs: [
    'active_entity_list[]',
    'active_entity_count',
    'hero_entity_id updated from first current-screen entity flagged as player',
    'carried entities kept in current-screen buckets when their carrier is current',
    'input/render/collision/ground/anim buckets refreshed',
    'active_entity_list_dirty=0',
  ],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: [
    'B = slots remaining (MAX_ENTITIES..1)',
    'C = entity slot iterator (0..MAX_ENTITIES-1)',
    'DE = index offset (entity id / active list position)',
    'HL = pointer math over component and state arrays',
    'A = predicate checks and counters',
  ],
})}
rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld a, #FF
    ld (hero_entity_id), a
    ld b, MAX_ENTITIES
    ld c, 0

.rebuild_loop:
    ld e, c
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .next_entity

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jp z, .next_entity

    ; Keep only entities from currently visible screen. Carried entities use
    ; their carrier screen so boxes remain visible during room transitions.
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr z, .screen_membership_ok

    ld hl, entity_carried_by
    add hl, de
    ld a, (hl)
    cp 255
    jp z, .next_entity
    ld e, a
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .next_entity
    ld e, c
    ld d, 0
.screen_membership_ok:

    ; Keep only entities scheduled to run on this frame.
    ; entity_job_should_run_c expects C=entity index.
    push bc
    call entity_job_should_run_c
    pop bc
    or a
    jp z, .next_entity

    ld hl, active_entity_count
    ld a, (hl)
    cp MAX_ENTITIES
    jp nc, .next_entity

    ld e, a
    ld d, 0
    ld hl, active_entity_list
    add hl, de
    ld (hl), c
    ld hl, active_entity_count
    inc (hl)

    ld e, c
    ld d, 0
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .skip_hero_candidate
    ld hl, entity_is_player
    add hl, de
    ld a, (hl)
    or a
    jr z, .skip_hero_candidate
    ld a, c
    ld (hero_entity_id), a
.skip_hero_candidate:

    ; Build hot-path buckets once so gameplay systems avoid repeating
    ; the same component-mask filtering every frame.
    ld e, c
    ld d, 0

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .skip_input_bucket
    ld a, (input_entity_count)
    ld l, a
    ld h, 0
    ld de, input_entity_list
    add hl, de
    ld (hl), c
    ld hl, input_entity_count
    inc (hl)
.skip_input_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    jr z, .skip_render_bucket
    ld a, (render_entity_count)
    ld l, a
    ld h, 0
    ld de, render_entity_list
    add hl, de
    ld (hl), c
    ld hl, render_entity_count
    inc (hl)
.skip_render_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, .skip_collision_bucket
    ld a, (collision_entity_count)
    ld l, a
    ld h, 0
    ld de, collision_entity_list
    add hl, de
    ld (hl), c
    ld hl, collision_entity_count
    inc (hl)
.skip_collision_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr nz, .store_ground_bucket
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY
    jr z, .skip_ground_bucket
.store_ground_bucket:
    ld a, (ground_entity_count)
    ld l, a
    ld h, 0
    ld de, ground_entity_list
    add hl, de
    ld (hl), c
    ld hl, ground_entity_count
    inc (hl)
.skip_ground_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    jp nz, .next_entity
    ld a, (anim_entity_count)
    ld l, a
    ld h, 0
    ld de, anim_entity_list
    add hl, de
    ld (hl), c
    ld hl, anim_entity_count
    inc (hl)

.next_entity:
    inc c
    dec b
    jp nz, .rebuild_loop

.rebuild_done:
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .rebuild_store_clean
    ld a, (input_entity_count)
    or a
    jr z, .rebuild_store_clean
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
.rebuild_store_clean:
    xor a
    ld (active_entity_list_dirty), a
    ret

; ------------------------------------------------------------------
; ensure_player_fast_runtime_bound
; Keep the dedicated player runtime attached to the current hero entity.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Bind the player fast-path runtime to the current hero entity.',
  inputs: ['active_entity_list_dirty, hero_entity_id, current-screen filtered entity lists'],
  outputs: ['player_runtime_enabled, player_entity_index, player_x/player_y, player_vx_runtime/player_vy_runtime'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  notes: ['Calls ensure_used_entity_list_current and resolve_runtime_hero_entity.'],
})}
ensure_player_fast_runtime_bound:
    call ensure_used_entity_list_current
    call resolve_runtime_hero_entity
    cp #FF
    jp nz, .bind_runtime

    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_dash_timer), a
    ld (player_dash_cooldown), a
    ld (player_dash_dir), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

.bind_runtime:
    ld (player_entity_index), a
    ld a, 1
    ld (player_runtime_enabled), a
    call sync_player_runtime_from_entity
    ret

; ------------------------------------------------------------------
; sync_player_runtime_from_entity
; Mirror hero ECS coordinates/velocity into player_* runtime vars.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Copy the current bound hero entity state into player_* runtime variables.',
  inputs: ['player_runtime_enabled, player_entity_index, entity_x_pos/y_pos, entity_vel_x/y'],
  outputs: ['player_x, player_y, player_vx_runtime, player_vy_runtime updated'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
})}
sync_player_runtime_from_entity:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret

get_runtime_interaction_type_tile:
    ; Input: B = row (0..23), C = col (0..31)
    ; Output: A = interaction type id, 0 if out of bounds
    ; Clobbers: AF, DE, HL
    ld a, b
    cp 24
    jr nc, .gritt_oob
    ld a, c
    cp 32
    jr nc, .gritt_oob
    ld l, b
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, runtime_interaction_type_map
    add hl, de
    ld a, (hl)
    ret
.gritt_oob:
    xor a
    ret

update_entity_ladder_state_c:
    ; Input: C = entity index
    ; Output: A = 1 when entity center/feet overlap a ladder tile, else 0
    ; Clobbers: AF, DE, HL
    ; Preserves: BC
    push bc
    ld e, c
    ld d, 0

    ; Sample center tile
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    rrca
    rrca
    rrca
    and #1F
    ld c, a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    rrca
    rrca
    rrca
    and #1F
    ld b, a
    push de
    call get_runtime_interaction_type_tile
    pop de
    cp 7
    jr z, .uelt_store_active

    ; Sample near feet too, so 16x16 player sprites keep climbing smoothly.
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 14
    rrca
    rrca
    rrca
    and #1F
    ld b, a
    push de
    call get_runtime_interaction_type_tile
    pop de
    cp 7
    jr z, .uelt_store_active

    xor a
    jr .uelt_store

.uelt_store_active:
    ld a, 1

.uelt_store:
    push af
    ld hl, entity_on_ladder
    add hl, de
    ld (hl), a
    pop af
    pop bc
    ret

; ------------------------------------------------------------------
; Player dash helpers
; ------------------------------------------------------------------
; Register Contract:
; input: C = player entity index, input_btn_curr/input_btn_prev refreshed
; output: A = 1 while dash is active this frame, entity_vel_x/y overridden
; clobbers: AF, BC, DE, HL
; preserved: None
player_fast_dash_process_c:
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .pfd_input_ok
    xor a
    ld (player_dash_timer), a
    ret
.pfd_input_ok:
    ld hl, entity_dash_cfg_enabled
    add hl, de
    ld a, (hl)
    or a
    jp nz, .pfd_dash_enabled
    xor a
    ld (player_dash_timer), a
    ld (player_dash_cooldown), a
    ret
.pfd_dash_enabled:
    ld a, (boss_hit_cooldown)
    or a
    jp z, .pfd_hit_cooldown_done
    dec a
    ld (boss_hit_cooldown), a
.pfd_hit_cooldown_done:
    ld a, (player_dash_timer)
    or a
    jp nz, .pfd_active
    ld a, (player_dash_cooldown)
    or a
    jp z, .pfd_check_start
    dec a
    ld (player_dash_cooldown), a
.pfd_check_start:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .pfd_inactive
    ld a, (input_btn_prev)
    and INPUT_BTN_GRAB
    jp nz, .pfd_inactive
    call player_fast_dash_resolve_dir_c
    ld (player_dash_dir), a
    ld a, 8
    ld (player_dash_timer), a
    ld a, 18
    ld (player_dash_cooldown), a
.pfd_active:
    ld a, (player_dash_timer)
    dec a
    ld (player_dash_timer), a
    ld a, (player_dash_dir)
    cp 1
    jp z, .pfd_left
    cp 3
    jp z, .pfd_up
    cp 4
    jp z, .pfd_down
.pfd_right:
    ld b, 8
    xor a
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_left:
    ld b, #F8
    xor a
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_up:
    ld b, 0
    ld a, #F8
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_down:
    ld b, 0
    ld a, 8
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_inactive:
    xor a
    ret

; Register Contract:
; input: C = player entity index, input_state/entity_facing_dir
; output: A = dash direction (1=left,2=right,3=up,4=down)
; clobbers: AF, DE, HL
; preserved: C
player_fast_dash_resolve_dir_c:
    ld a, (input_state)
    cp STICK_RIGHT
    jp z, .pfdr_right
    cp STICK_UPRIGHT
    jp z, .pfdr_right
    cp STICK_DOWNRIGHT
    jp z, .pfdr_right
    cp STICK_LEFT
    jp z, .pfdr_left
    cp STICK_UPLEFT
    jp z, .pfdr_left
    cp STICK_DOWNLEFT
    jp z, .pfdr_left
    cp STICK_UP
    jp z, .pfdr_up
    cp STICK_DOWN
    jp z, .pfdr_down
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    ret z
    cp 2
    ret z
    cp 3
    ret z
    cp 4
    ret z
.pfdr_right:
    ld a, 2
    ret
.pfdr_left:
    ld a, 1
    ret
.pfdr_up:
    ld a, 3
    ret
.pfdr_down:
    ld a, 4
    ret

; Register Contract:
; input: B = signed X velocity, A = signed Y velocity, C = entity index
; output: entity_vel_x/y updated
; clobbers: AF, DE, HL
; preserved: BC
player_fast_dash_store_velocity_c:
    push af
    ld e, c
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), b
    pop af
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    ret

; Register Contract:
; input: C = player entity index, player_dash_dir
; output: player_dash_tile_x/y updated for the front probe; Breakable tile at that probe cleared from runtime maps and VRAM
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_break_front_tile_c:
    ld a, #FF
    ld (player_dash_tile_x), a
    ld (player_dash_tile_y), a
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld b, (hl)                    ; B = player X pixel
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                    ; C = player Y pixel

    ld a, (player_dash_dir)
    cp 1
    jp z, .pdb_left
    cp 3
    jp z, .pdb_up
    cp 4
    jp z, .pdb_down

.pdb_right:
    ld a, b
    cp 240
    ret nc
    add a, 16
    ld b, a
    ld a, c
    cp 184
    ret nc
    add a, 8
    ld c, a
    jp .pdb_probe_tile

.pdb_left:
    ld a, b
    or a
    ret z
    dec a
    ld b, a
    ld a, c
    cp 184
    ret nc
    add a, 8
    ld c, a
    jp .pdb_probe_tile

.pdb_up:
    ld a, c
    or a
    ret z
    dec a
    ld c, a
    ld a, b
    cp 248
    ret nc
    add a, 8
    ld b, a
    jp .pdb_probe_tile

.pdb_down:
    ld a, c
    cp 176
    ret nc
    add a, 16
    ld c, a
    ld a, b
    cp 248
    ret nc
    add a, 8
    ld b, a

.pdb_probe_tile:
    ld a, b
    srl a
    srl a
    srl a
    cp 32
    ret nc
    ld (player_dash_tile_x), a
    ld a, c
    srl a
    srl a
    srl a
    cp 24
    ret nc
    ld (player_dash_tile_y), a

    ld a, (player_dash_tile_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (player_dash_tile_x)
    ld e, a
    ld d, 0
    add hl, de                    ; HL = tile index
    push hl
    ld de, runtime_behavior_map
    add hl, de
    ld a, (hl)
    and TILE_BREAKABLE
    pop hl
    ret z

    push hl
    ld de, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop hl

    push hl
    ld de, runtime_screen_layout
    add hl, de
    ld (hl), 0
    pop hl

    ld de, NAMETBL
    add hl, de
    xor a
    call FAST_WRTVRM
    ret

; Register Contract:
; input: player_dash_tile_x/y = front dash probe tile, active boss runtime RAM
; output: boss_health_lo/hi decremented by the weak matrix damage byte when hit
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_hit_boss_weakpoint:
    ld a, (boss_active)
    or a
    ret z
    ld a, (boss_hit_cooldown)
    or a
    ret nz
    ld a, (player_dash_tile_x)
    cp #FF
    ret z
    ld b, a                       ; B = screen tile X
    ld a, (player_dash_tile_y)
    cp #FF
    ret z
    ld c, a                       ; C = screen tile Y

    ld a, (boss_x_char)
    ld d, a
    ld a, b
    cp d
    ret c
    sub d
    ld b, a                       ; B = local boss X
    ld a, (boss_width)
    cp b
    ret z
    ret c

    ld a, (boss_y_char)
    ld d, a
    ld a, c
    cp d
    ret c
    sub d
    ld c, a                       ; C = local boss Y
    ld a, (boss_height)
    cp c
    ret z
    ret c

    ld hl, 0
    ld a, c
    or a
    jp z, .pdhb_row_done
    ld e, a
.pdhb_row_loop:
    ld a, (boss_width)
    ld d, 0
    add a, l
    ld l, a
    ld a, h
    adc a, d
    ld h, a
    dec e
    jp nz, .pdhb_row_loop
.pdhb_row_done:
    ld e, b
    ld d, 0
    add hl, de
    ld de, (boss_weak_matrix_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret z
    ld e, a                       ; E = weak point damage

    ld a, (boss_health_lo)
    ld l, a
    ld a, (boss_health_hi)
    ld h, a
    or l
    ret z
    ld a, l
    sub e
    ld l, a
    ld a, h
    sbc a, 0
    ld h, a
    jp nc, .pdhb_store_health
    ld hl, 0
.pdhb_store_health:
    ld a, l
    ld (boss_health_lo), a
    ld a, h
    ld (boss_health_hi), a

.pdhb_after_damage:
    ld a, 12
    ld (boss_hit_cooldown), a
    ld a, (boss_health_lo)
    ld b, a
    ld a, (boss_health_hi)
    or b
    ret nz
    call restore_active_boss_tiles
    call player_dash_cleanup_dead_boss_attacks
    xor a
    ld (boss_active), a
    ret

; Register Contract:
; input: boss projectile/slam/falling block active flags and sprite slots
; output: active boss attack sprites hidden and boss attack active flags cleared
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_cleanup_dead_boss_attacks:
    ld a, (boss_projectile_active)
    or a
    jp z, .pdcdba_no_projectile
    call boss_projectile_hide_all
.pdcdba_no_projectile:
    ld a, (boss_slam_rocks_active)
    or a
    jp z, .pdcdba_no_slam
    call boss_slam_rocks_hide_all
.pdcdba_no_slam:
    ld a, (boss_falling_blocks_active)
    or a
    jp z, .pdcdba_clear_flags
    call boss_falling_blocks_hide_all
.pdcdba_clear_flags:
    xor a
    ld (boss_projectile_active), a
    ld (boss_slam_rocks_active), a
    ld (boss_falling_blocks_active), a
    ret

; ------------------------------------------------------------------
; update_player_fastpath
; Dedicated hero update path executed before the generic ECS sweeps.
; Mirrors the critical input->jump->gravity->position chain for the
; current player entity without iterating over every active entity.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Run the critical per-frame player update without ECS list iteration.',
  inputs: ['task_update_input already refreshed input_state/input_btn_*'],
  outputs: ['Hero input/jump/gravity/position resolved into entity tables and player_* mirror'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  notes: ['Global collision/wall/sprite systems still run later in the frame and may refine the final result.'],
})}
update_player_fastpath:
    call ensure_player_fast_runtime_bound
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a

    ; Require Input component to treat this entity as the player fast-path target.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .player_fast_sync

    ; --------------------------------------------------------------
    ; INPUT
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    call update_entity_ladder_state_c
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .player_fast_input_enabled

    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    jp .player_fast_after_input

.player_fast_input_enabled:
    call aircontrol_should_lock_horizontal_c
    jp nz, .player_fast_after_input

    ld e, c
    ld d, 0
    ld hl, entity_dir_mask
    add hl, de
    ld b, (hl)                    ; B = direction mask

    ld hl, entity_input_speed
    add hl, de
    ld a, (hl)
    or a
    jr nz, .player_fast_speed_ok
    ld a, 1
.player_fast_speed_ok:
    ld h, a                       ; H = cardinal speed
    srl a
    jr nz, .player_fast_diag_speed_ok
    ld a, 1
.player_fast_diag_speed_ok:
    ld l, a                       ; L = diagonal speed

    ld a, (input_state)
    ld d, 0                       ; D = vel_x
    ld e, 0                       ; E = vel_y
    cp STICK_UP
    jp z, .player_fast_input_up
    cp STICK_DOWN
    jp z, .player_fast_input_down
    cp STICK_LEFT
    jp z, .player_fast_input_left
    cp STICK_RIGHT
    jp z, .player_fast_input_right
    cp STICK_UPRIGHT
    jp z, .player_fast_input_upright
    cp STICK_UPLEFT
    jp z, .player_fast_input_upleft
    cp STICK_DOWNRIGHT
    jp z, .player_fast_input_downright
    cp STICK_DOWNLEFT
    jp z, .player_fast_input_downleft
    jp .player_fast_apply_velocity

.player_fast_input_up:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_down:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_apply_velocity
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_left:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_right:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_upright:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_right_only
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_up_only
    ld a, l
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_upleft:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_left_only_1
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_up_only_1
    ld a, l
    neg
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_1:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only_1:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downright:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_right_only_2
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_down_only_2
    ld a, l
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only_2:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_2:
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downleft:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_left_only_3
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_down_only_3
    ld a, l
    neg
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_3:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_3:
    ld a, h
    ld e, a

.player_fast_apply_velocity:
    push de
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), e

    ; Update entity_facing_dir based on input_state.
    ; Match the generic input system so Player fast-path preserves the
    ; same directional semantics used by ChangeSprite and sprite variants.
    push af
    ld a, (input_state)
    or a
    jr z, .player_fast_facing_done
    cp 2
    jr c, .player_fast_facing_up
    cp 5
    jr c, .player_fast_facing_right
    jr z, .player_fast_facing_down
    ld a, 1                     ; FACING_LEFT
    jr .player_fast_facing_write
.player_fast_facing_right:
    ld a, 2                     ; FACING_RIGHT
    jr .player_fast_facing_write
.player_fast_facing_up:
    ld a, 3                     ; FACING_UP
    jr .player_fast_facing_write
.player_fast_facing_down:
    ld a, 4                     ; FACING_DOWN
.player_fast_facing_write:
    push hl
    push de
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    pop de
    pop hl
.player_fast_facing_done:
    pop af

    ; Sync directional sprite facing for input-driven entities.
    ; Keep the same rule as the generic input system: skip only when
    ; the assigned State Machine explicitly uses ChangeSprite.
    push af
    push de
    ld e, c
    ld d, 0
    ld hl, entity_sm_sprite_control
    add hl, de
    ld a, (hl)
    pop de
    pop af
    jp nz, .player_fast_sync_sm_sprite_facing
    push de
    ld e, c
    ld d, 0
${emitDirectionalFacingSpriteSync('player_fast_directional_sprite')}
    pop de
    jp .player_fast_skip_patrol_facing
.player_fast_sync_sm_sprite_facing:
    push de
    ld e, c
    ld d, 0
${emitDirectionalFacingSpriteSync('player_fast_sm_directional_sprite', 'current')}
    pop de
.player_fast_skip_patrol_facing:

.player_fast_after_input:
    push bc
    call player_fast_dash_process_c
    pop bc
    or a
    jp nz, .player_fast_after_walljump

    ; --------------------------------------------------------------
    ; WALL JUMP PRIORITY
    ; --------------------------------------------------------------
    ; A wall jump must win over the regular Jump component. Otherwise the
    ; same SPACE edge can be partially handled as a normal air jump first,
    ; making the wall rebound feel weak or inconsistent.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #40                       ; COMP_MASK_WALL_JUMP (#4000) => high byte bit 6
    jp z, .player_fast_walljump_priority_done
    push bc
    call walljump_process_entity_c
    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_walljump_locked_vx
    add hl, de
    ld a, (hl)
    or a
    jp nz, .player_fast_after_jump
.player_fast_walljump_priority_done:

    ; --------------------------------------------------------------
    ; JUMP
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #01
    jp z, .player_fast_after_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr z, .player_fast_jump_check

    ld hl, entity_jump_count
    add hl, de
    ld (hl), 0
    ld hl, entity_jump_bonus
    add hl, de
    ld (hl), 0

.player_fast_jump_check:
    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jp nz, .player_fast_after_jump

    ld hl, entity_jump_trigger
    add hl, de
    ld a, (hl)
    call component_trigger_edge_pressed_a
    jp z, .player_fast_after_jump

    ld hl, entity_jump_max
    add hl, de
    ld b, (hl)
    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    add a, b
    ld b, a

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    cp b
    jr c, .player_fast_do_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp z, .player_fast_after_jump

.player_fast_do_jump:
    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr nz, .player_fast_skip_bonus_consume

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    ld hl, entity_jump_max
    add hl, de
    cp (hl)
    jr c, .player_fast_skip_bonus_consume

    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_skip_bonus_consume
    dec (hl)

.player_fast_skip_bonus_consume:
    ld hl, entity_jump_count
    add hl, de
    inc (hl)

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_jump

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), #00
    inc hl
    ld (hl), #FC

.player_fast_after_jump:
    ; --------------------------------------------------------------
    ; GRAVITY
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_gravity

    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, .player_fast_gravity_grounded

    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_apply_gravity
    jr .player_fast_gravity_grounded

.player_fast_apply_gravity:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ld a, e
    add a, #40
    ld e, a
    ld a, d
    adc a, #00
    ld d, a

    ld a, d
    bit 7, a
    jr nz, .player_fast_store_gravity
    cp #04
    jr c, .player_fast_store_gravity
    ld de, #0400

.player_fast_store_gravity:
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d
    jr .player_fast_after_gravity

.player_fast_gravity_grounded:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.player_fast_after_gravity:
    ; --------------------------------------------------------------
    ; WALL GRAB
    ; --------------------------------------------------------------
    push bc
    call wallgrab_process_entity_c
    pop bc

    ; --------------------------------------------------------------
    ; WALL JUMP / WALL SLIDE
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #40                       ; COMP_MASK_WALL_JUMP (#4000) => high byte bit 6
    jp z, .player_fast_after_walljump
    push bc
    call walljump_process_entity_c
    pop bc
.player_fast_after_walljump:
    ; --------------------------------------------------------------
    ; POSITION
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld b, a
    and COMP_MASK_POSITION
    jp z, .player_fast_sync

    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .player_fast_sync

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    bit 7, a
    jr z, .player_fast_vy_positive
    cp #F0
    jr nc, .player_fast_vy_ready
    ld a, #F0
    jr .player_fast_vy_ready
.player_fast_vy_positive:
    cp #11
    jr c, .player_fast_vy_ready
    ld a, #10
.player_fast_vy_ready:
    ld b, a
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

.player_fast_sync:
    call sync_player_runtime_from_entity
    ret
`;

    return wrapMideasAsmBlock(code, {
        id: 'runtime.components.scheduler',
        kind: 'routine',
        owner: 'components',
        preserve: false,
        roots: ['update_all_entities', 'sync_player_runtime_from_entity'],
    });
}

// ============================================================================
// HELPER FUNCTIONS - INDIVIDUAL COMPONENT SYSTEMS
// ============================================================================

/**
 * Generate Position Component System
 */
function generatePositionSystem(): string {
    return wrapMideasAsmBlock(`
; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    xor a
    ld hl, entity_x_pos
    call component_fill_32_a

    ld hl, entity_y_pos
    call component_fill_32_a
    ret

update_position_component:
    ; Update positions based on velocities (Movement/Input/Gravity -> Position)
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through used entities only
    ld hl, active_entity_list

position_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    push hl                    ; Save list pointer
    ld a, (player_runtime_enabled)
    or a
    jp z, .position_check_mask
    ld a, (player_entity_index)
    cp c
    jp z, .position_skip_fast_player
.position_check_mask:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    pop hl                     ; Restore list pointer
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement, input, gravity, or mirror source)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jr nz, .position_has_velocity_source
    push hl
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                    ; COMP_MASK_GRAVITY high byte bit 1
    pop hl
    jr nz, .position_has_velocity_source
    ; Mirror can invert X velocity generated by StateMachine/AI even if the
    ; template does not carry Movement/Input explicitly.
    push hl
    ld e, c
    ld d, 0
    ld hl, entity_mirror_flags
    add hl, de
    ld a, (hl)
    and #01
    pop hl
    jr z, position_next_entity ; Skip velocity if no movement/input/mirror source
.position_has_velocity_source:

    ; active_entity_list already guarantees current_screen_id membership

    push bc
    push hl

    ; Update X Position
    ; X = X + VelX
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; B = VelX

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a                 ; Store new X

    ; Update Y Position
    ; Y = Y + VelY (defensive clamp to avoid byte-wrap teleports)
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY (signed)
    ; Clamp vertical delta to [-16..+16] to avoid single-frame wrap jumps
    bit 7, a
    jr z, .pos_vy_positive
    cp #F0                     ; -16
    jr nc, .pos_vy_ready       ; already in [-16..-1]
    ld a, #F0
    jr .pos_vy_ready
.pos_vy_positive:
    cp #11                     ; 17
    jr c, .pos_vy_ready        ; already in [0..16]
    ld a, #10                  ; +16
.pos_vy_ready:
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc
    jp position_next_entity

.position_skip_fast_player:
    pop hl

position_next_entity:
    dec b
    jp nz, position_update_loop
    ret
`, {
        id: 'runtime.components.position',
        kind: 'routine',
        owner: 'components',
        preserve: false,
        roots: ['component-position'],
    });
}

/**
 * Generate Sprite Component System
 */
function generateSpriteSystem(analysis: ProjectAnalysis, romMode: string = 'simple32k'): string {
    const usesMapper = usesMapperBanking(romMode);
    const clearAllSpritesCall = usesMapper ? 'call_clear_all_sprites_resident' : 'clear_all_sprites';
    const showSpriteCall = usesMapper ? 'call_show_sprite_resident' : 'show_sprite';
    return wrapMideasAsmBlock(`
; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================
init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call ${clearAllSpritesCall}
    ; Copy entity_sprite_asset_index from ROM to RAM (so CHANGE_SPRITE can modify it)
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld a, (render_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through renderable entities only
    ld hl, render_entity_list

sprite_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    ld e, c
    ld d, 0
    ld a, (player_runtime_enabled)
    or a
    jp z, .sprite_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, sprite_next_entity
.sprite_not_fast_player:

    ; A dropped box is already part of the tilemap; do not render its sprite.
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    cp BOX_STATE_DROPPED_TILE
    jp z, sprite_next_entity

    ; render_entity_list already guarantees active + current_screen_id + sprite
    push bc
    push hl

    ; E already contains entity index (from line 129)
    ; D = 0 (from line 130)
    
    ; Get entity position (X, Y)
    ld hl, entity_x_pos
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Get sprite configuration (Base HW Sprite + Layer Count)
    ; E still contains entity index, D = 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2 (2 bytes per entry)
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite (Current HW Sprite)
    ld a, h
    or a
    jp z, sprite_continue      ; No layers -> skip rendering

.sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .sprite_layers_mode_ready

.sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.sprite_layers_mode_ready:
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .sprite_layer_have_pattern

.sprite_layer_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .sprite_layer_have_pattern

.sprite_layer_have_pattern:

    ; Get Color from sprite_layer_colors table
    ; Table is indexed by HW Sprite Index (L)
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_colors[hwSprite]
    ld a, (de)                 ; A = Color
    pop de                     ; Restore D (Pattern)
    ld e, a                    ; E = Color

    ; Apply signed per-layer Y offset. B/C is restored after the call
    ; from the saved entity position pushed at the top of this layer pass.
    push de                    ; Preserve D=Pattern, E=Color
    ld de, sprite_layer_y_offsets
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_y_offsets[hwSprite]
    ld a, (de)                 ; A = signed Y offset (two's complement)
    pop de
    add a, c
    ld c, a                    ; C = Y + layer offset
    
    ; Call show_sprite (A=HW Sprite, B=X, C=Y, D=Pattern, E=Color)
    ld a, l                    ; A = HW Sprite
    call ${showSpriteCall}

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_after_pattern_restore
    pop de                     ; Restore current pattern number

.sprite_layer_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_next
    ld a, d
    add a, 4                   ; Next 16x16 pattern
    ld d, a

.sprite_layer_next:
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    dec b
    jp nz, sprite_update_loop

    ret

; ==================================================================
; PLAYER SPRITE FASTPATH
; ==================================================================
refresh_player_sprite_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    ret z
    call force_update_entity_sprite
    ret

; ==================================================================
; HELPER: Force update a single entity's sprite (used by init_entities)
; Input: C = Entity Index
; ==================================================================
force_update_entity_sprite:
    push bc
    push de
    push hl
    
    ; Get X/Y from memory
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X
    
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y

    ; E still has Entity Index, D = 0
    ; B = X, C = Y
    
    ; Get Config
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite
    ld a, h
    or a
    jr z, force_sprite_done    ; Skip if no layers for this entity

.force_sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .force_sprite_layers_mode_ready

.force_sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.force_sprite_layers_mode_ready:

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .force_sprite_have_pattern

.force_sprite_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .force_sprite_have_pattern

.force_sprite_have_pattern:

    ; Get Color
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de                     ; Restore D
    ld e, a                    ; E = Color

    ; Apply signed per-layer Y offset. B/C is restored after the call
    ; from the saved entity position pushed at the top of this layer pass.
    push de
    ld de, sprite_layer_y_offsets
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de
    add a, c
    ld c, a
    
    ; Call show_sprite
    ld a, l                    ; A = HW Sprite
    call ${showSpriteCall}

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_after_pattern_restore
    pop de                     ; Restore current pattern number

.force_sprite_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_next
    ld a, d
    add a, 4
    ld d, a

.force_sprite_next:
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret

compute_entity_base_pattern:
    ; Input: DE = entity index
    ; Output: A = base pattern number for this entity's current frame
    ; Clobbers: AF, BC, HL
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .legacy_hw_pattern

    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (hl)
    cp #FF
    jr z, .placeholder_pattern
    cp SPRITE_ASSET_COUNT
    jr nc, .placeholder_pattern

    ld c, a
    ld b, 0
    ld hl, sprite_asset_base_pattern_slot_runtime
    add hl, bc
    ld a, (hl)                 ; A = base 16x16 pattern slot for this asset
    push af                    ; Save base slot before HL is reused

    ld hl, sprite_asset_layer_count
    add hl, bc
    ld b, (hl)                 ; B = current sprite layer count (frame stride)
    ld a, b
    or a
    jr nz, .sprite_stride_ready
    ld b, 1
.sprite_stride_ready:

    ld hl, entity_anim_frame
    add hl, de
    ld c, (hl)                 ; C = current animation frame

    pop af                     ; A = base slot (restored)
    ld l, a                    ; L = base slot (ready for stride loop)
    ld a, c
    or a
    jr z, .slot_to_pattern

.frame_stride_loop:
    ld a, l
    add a, b
    ld l, a
    dec c
    jr nz, .frame_stride_loop

.slot_to_pattern:
    ld a, l
    add a, a
    add a, a
    ret

.placeholder_pattern:
    ld a, (sprite_placeholder_base_pattern_num)
    ret

.legacy_hw_pattern:
    ld hl, entity_sprite_config
    add hl, de
    add hl, de
    ld a, (hl)
    add a, a
    add a, a
    ret
`, {
        id: 'runtime.components.sprite',
        kind: 'routine',
        owner: 'components',
        preserve: false,
        roots: ['component-sprite'],
    });
}
function generateMovementSystem(): string {
    return `
        ; ==================================================================
        ; MOVEMENT COMPONENT SYSTEM (Based on movement physics)
        ; ==================================================================

        init_movement_system:
            ; Initialize movement / physics system
            ; Clear all entity velocities (32 entries each)
            ld hl, entity_vel_x
            ld de, entity_vel_x + 1
            ld bc, 31
            ld (hl), 0
            ldir

            ld hl, entity_vel_y
            ld de, entity_vel_y + 1
            ld bc, 31
            ld (hl), 0
            ldir
    ret

        update_movement_component:
            ; Update movement / physics for entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

        movement_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks
            add hl, de
            ld a, (hl)                 ; Get entity component mask
            pop hl                     ; Restore list pointer
            and COMP_MASK_MOVEMENT     ; Check if has movement component
            jr z, movement_next_entity ; Skip if no movement component

            ; No damping/friction: instant stop when input released (Maze of Galious style).
            ; Gravity component overwrites entity_vel_y each frame from gravity_vel accumulator.

        movement_next_entity:
            dec b
            jp nz, movement_update_loop
    ret
    `;
}

function generateMirrorSystem(): string {
    return wrapMideasAsmBlock(`
; ==================================================================
; MIRROR COMPONENT SYSTEM
; ==================================================================
; Inverts horizontal velocity after control/AI/state-machine systems and before
; Position applies velocity. This is useful for mirror rooms, reversed controls,
; or enemies that must walk opposite to their authored X movement.
${buildRegisterContractComment({
  purpose: 'Invert entity_vel_x for entities with comp_mirror enabled.',
  inputs: ['active_entity_list/active_entity_count', 'entity_mirror_flags', 'entity_vel_x'],
  outputs: ['entity_vel_x may be negated; entity_facing_dir may be flipped'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['None'],
  usage: [
    'B = active-list loop counter',
    'C/E = entity index',
    'entity_mirror_flags bit0 enables velocity mirroring',
    'entity_mirror_flags bit1 enables facing cache inversion',
  ],
})}
init_mirror_system:
    xor a
    ld hl, entity_mirror_flags
    call component_fill_32_a
    ret

update_mirror_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

mirror_update_loop:
    ld c, (hl)
    inc hl
    push hl
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_mirror_flags
    add hl, de
    ld a, (hl)
    and #01
    jp z, mirror_next_entity
    ld a, (hl)
    ld b, a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, mirror_next_entity
    neg
    ld (hl), a

    bit 1, b
    jp z, mirror_next_entity
    bit 7, a
    jp z, mirror_face_right
    ld a, 1
    jp mirror_store_facing
mirror_face_right:
    ld a, 2
mirror_store_facing:
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a

mirror_next_entity:
    pop bc
    pop hl
    dec b
    jp nz, mirror_update_loop
    ret
`, {
        id: 'runtime.components.mirror',
        kind: 'routine',
        owner: 'components',
        roots: ['init_mirror_system', 'update_mirror_component'],
    });
}

/**
 * Generate Collision Component System
 */
function generateCollisionSystem(analysis: ProjectAnalysis, hasPlatformRiding: boolean): string {
    // MSX Screen 2 ALWAYS uses 8x8 character cells for the Name Table (32x24 grid)
    // The behavior map maps 1:1 to the Name Table, so pixel-to-tile conversion
    // must ALWAYS divide by 8, regardless of the project's visual tile dimensions.
    const msxCharSize = 8;     // MSX character cell is always 8x8 pixels
    const tilesPerRow = 32;    // 256 / 8 = 32 columns
    const tilesPerColumn = 24; // 192 / 8 = 24 rows
    const shiftAmount = 3;     // 8 = 2^3, so 3 shifts to divide by 8

    const xDivisionCode = Array.from({ length: shiftAmount },
        (_, i) => `    srl a                      ; A = X / ${Math.pow(2, i + 1)}`).join('\n');

    const yDivisionCode = Array.from({ length: shiftAmount },
        (_, i) => `    srl a                      ; A = Y / ${Math.pow(2, i + 1)}`).join('\n');

    const tileInfo = `; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)`;

    const asm = `
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ; Clear deadly collision flags
    xor a
    ld hl, entity_deadly_collision
    call component_fill_32_a

    ; Clear entity-entity collision flags
    ld hl, entity_entity_collision_flags
    call component_fill_32_a

    ; Initialize last collided entity to "none"
    ld a, 255
    ld hl, entity_last_collision_entity
    call component_fill_32_a

    ; Default collision hitboxes: 16x16 with no offset
    ld a, 16
    ld hl, entity_collision_hitbox_w
    call component_fill_32_a

    ld hl, entity_collision_hitbox_h
    call component_fill_32_a

    xor a
    ld hl, entity_collision_offset_x
    call component_fill_32_a

    ld hl, entity_collision_offset_y
    call component_fill_32_a
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld a, (ground_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through ground-probe entities only
    ld hl, ground_entity_list

    collision_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer

    ; Carried or tile-dropped boxes are managed by carry_component.
    ld e, c
    ld d, 0
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    or a
    jp nz, collision_next_entity

    ; Get entity Y position
    push bc
    push hl
    push de

    ; Ground detection is handled exclusively by update_wallcollision_component (tile-based)
    ; Check only platform_id and grace frames for platform-riding entities
    ; Entity is grounded if: on tiles OR on platform OR has grace frames

    ; Check if entity has platform reference
    push hl
    ld hl, entity_platform_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = platform_id
    cp 255
    jr nz, .grounded_by_platform  ; Has platform, mark grounded

    ; No platform, check grace frames
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)                    ; A = grace frames
    or a
    jr nz, .grounded_by_platform  ; Has grace, mark grounded

    ; No tiles, no platform, no grace - entity is in air
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Mark as in air
    jr .ground_check_done

.grounded_by_platform:
    ; Entity is grounded by platform or grace frames
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as grounded

.ground_check_done:
    ; Deadly contact is updated later by update_deadly_tiles_component.
    ; Keep collision focused on ground/platform state so we do not resample
    ; the behavior map twice per frame for the same entity.
    pop de
    pop hl
    pop bc

    collision_next_entity:
    pop hl                        ; Restore list pointer
    dec b
    jp nz, collision_update_loop

    ; Run lightweight entity-entity collision pass for all collidable entities
    call update_entity_collision_fast
    ret

update_entity_collision_fast:
    ; =============================================================
    ; Optimized entity-entity collision: 2-phase active-list system
    ; Phase 1: Build list of active collidable entities on screen
    ; Phase 2: Check only valid pairs (i < j) with clamped AABB
    ; Runs every 2 frames (latches previous result on skip frames)
    ; =============================================================

    ; Frame skip - every 2 frames
    ld hl, interrupt_counter
    ld a, (hl)
    and 1
    ret nz

    ; === PHASE 1: Build active list from prefiltered collision bucket ===
    ld hl, coll_list              ; HL = write pointer into coll_list
    xor a
    ld (coll_list_count), a       ; count = 0
    ld a, (collision_entity_count)
    or a
    ret z
    ld b, a
    ld de, collision_entity_list

.build_loop:
    ld a, (de)
    ld c, a
    inc de

    ; Clear collision flags for ALL entities with collision component
    push hl                       ; Save list write pointer
    push de
    ld e, c
    ld d, 0

    ; Clear collision flags for this entity (even if wrong screen)
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Do not include carried or tile-dropped boxes in entity collisions.
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    or a
    jp nz, .build_skip

    ; Entity qualifies - add to list (max MAX_ENTITIES)
    ld a, (coll_list_count)
    cp MAX_ENTITIES
    jp nc, .build_skip            ; List full

    ; Restore pointers in reverse push order: DE read cursor first, then HL write cursor.
    ; The previous order wrote into collision_entity_list instead of coll_list.
    pop de
    pop hl
    ld (hl), c                    ; coll_list[count] = entity index
    inc hl                        ; Advance write pointer
    push hl                       ; Save updated write pointer
    push de

    ld a, (coll_list_count)
    inc a
    ld (coll_list_count), a

.build_skip:
    pop de
    pop hl                        ; Restore list write pointer
    djnz .build_loop

.build_done:
    ; === PHASE 2: Check pairs ===
    ; Need at least 2 entities for any pair
    ld a, (coll_list_count)
    cp 2
    ret c                         ; 0 or 1 entities, nothing to check

    ; Outer loop: i = 0 .. count-2
    ld b, 0                       ; B = outer index i

.outer_loop:
    ld a, (coll_list_count)
    dec a                         ; A = count - 1
    cp b
    jp z, .coll_done              ; i == count-1, done
    jp c, .coll_done              ; safety

    ; Get source entity index from coll_list[i]
    push bc                       ; Save B=i
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld c, (hl)                    ; C = source entity index

    ; Cache source AABB with clamping
    ld e, c
    ld d, 0

    ; source left = x + offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_left), a

    ; source right = left + hitbox_w (clamped)
    ld hl, entity_collision_hitbox_w
    add hl, de
    add a, (hl)
    jp nc, .src_right_ok
    ld a, 255                     ; Clamp on overflow
.src_right_ok:
    ld (coll_src_right), a

    ; source top = y + offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_top), a

    ; source bottom = top + hitbox_h (clamped)
    ld hl, entity_collision_hitbox_h
    add hl, de
    add a, (hl)
    jp nc, .src_bot_ok
    ld a, 255
.src_bot_ok:
    ld (coll_src_bottom), a

    ; Inner loop: j = i+1 .. count-1
    ; Preserve C=source entity index while restoring outer index i.
    pop de                        ; D = outer index i, E = saved scratch
    ld b, d
    push de                       ; Save i again for .inner_done
    ld a, b
    inc a                         ; A = i+1
    ld b, a                       ; B = inner index j (reusing B temporarily)
    push bc                       ; Save B=j, (stack: j, i)

.inner_loop:
    pop bc                        ; Restore B=j
    ld a, (coll_list_count)
    cp b
    jp z, .inner_done             ; j == count, done with inner
    jp c, .inner_done

    ; Get target entity index from coll_list[j]
    push bc                       ; Save B=j
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = target entity index

    ; --- Mutual layer mask check ---
    ; source.collidesWith & target.layer
    ld e, c
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = source.collidesWith
    ld e, b
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = source.collidesWith & target.layer
    jp z, .next_inner

    ; target.collidesWith & source.layer
    ld e, b
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = target.collidesWith
    ld e, c
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = target.collidesWith & source.layer
    jp z, .next_inner

    ; --- AABB overlap test (source cached, compute target with clamp) ---
    ; target left = x + offset_x
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_left

    ; source.right < target.left => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_right)
    cp e
    jp c, .next_inner

    ; target right = target_left + hitbox_w (clamped)
    push de                       ; Save E=target_left, D free
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_w
    add hl, de
    pop de                        ; Restore E=target_left
    ld a, e                       ; A = target_left
    add a, (hl)                   ; A = target_left + width
    jp nc, .tgt_right_ok
    ld a, 255
.tgt_right_ok:
    ; source.left > target.right => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_right
    ld a, (coll_src_left)
    cp d
    jp c, .x_overlap_ok
    jp z, .x_overlap_ok
    jp .next_inner
.x_overlap_ok:

    ; target top = y + offset_y
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_top

    ; source.bottom < target.top => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_bottom)
    cp e
    jp c, .next_inner

    ; target bottom = target_top + hitbox_h (clamped)
    push de                       ; Save E=target_top
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_h
    add hl, de
    pop de                        ; Restore E=target_top
    ld a, e                       ; A = target_top
    add a, (hl)                   ; A = target_top + height
    jp nc, .tgt_bot_ok
    ld a, 255
.tgt_bot_ok:
    ; source.top > target.bottom => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_bottom
    ld a, (coll_src_top)
    cp d
    jp c, .y_overlap_ok
    jp z, .y_overlap_ok
    jp .next_inner
.y_overlap_ok:

    ; ==========  COLLISION DETECTED between source(C) and target(B) ==========

    ; --- Set flags for SOURCE entity (C) ---
    push bc                       ; Save B=target, C=source
    ld e, c
    ld d, 0

    ; Store target index in source's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), b

    ; Classify target layer into collision event flags
    push de
    ld e, b
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = target layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags (multiple hits)
    ld (hl), a

    ; --- Set flags for TARGET entity (B) --- (bidirectional)
    pop bc                        ; Restore B=target, C=source
    push bc

    ld e, b
    ld d, 0

    ; Store source index in target's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), c

    ; Classify source layer into collision event flags
    push de
    ld e, c
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = source layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags
    ld (hl), a

    pop bc                        ; Restore B=target, C=source

.next_inner:
    ; Advance j
    pop bc                        ; Restore B=j (inner index)
    inc b
    push bc                       ; Save updated j
    jp .inner_loop

.inner_done:
    pop de                        ; Restore D=i (keep C=source untouched)
    ld b, d
    inc b                         ; i++
    jp .outer_loop

.coll_done:
    ret

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
        ; ==================================================================

; ------------------------------------------------------------------
; coll_add_signed_offset_clamped
; Input:  A = base coordinate (0..255)
;         HL = pointer to signed offset byte (-128..127, two's complement)
; Output: A = clamped (base + offset), saturated to 0..255
; Clobbers: B
; ------------------------------------------------------------------
coll_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset byte
    add a, b                      ; A = base + offset (wrapped)
    bit 7, b
    jr z, .casc_positive
    ; Negative offset: carry=0 means underflow (wrapped below 0)
    jr c, .casc_done
    xor a                         ; Clamp to 0
    ret
.casc_positive:
    ; Positive offset: carry=1 means overflow (wrapped above 255)
    jr nc, .casc_done
    ld a, 255                     ; Clamp to 255
.casc_done:
    ret

; ------------------------------------------------------------------
; coll_flags_from_layer
; Input:  A = collision layer bitmask of the other entity
; Output: A = collision event flags (entity/enemy/item)
; Clobbers: B, C
; ------------------------------------------------------------------
coll_flags_from_layer:
    ld b, a
    ld c, COLLISION_EVENT_ENTITY

    ld a, b
    and COLLISION_LAYER_ENEMY
    jr z, .cffl_no_enemy
    ld a, c
    or COLLISION_EVENT_ENEMY
    ld c, a
.cffl_no_enemy:
    ld a, b
    and COLLISION_LAYER_ITEM
    jr z, .cffl_done
    ld a, c
    or COLLISION_EVENT_ITEM
    ld c, a
.cffl_done:
    ld a, c
    ret

            check_tile_collision:
    ; Check collision with background tiles
        ; A = X position, B = Y position
        ; Convert pixel position to tile coordinates
    push af
    push bc

        ; DYNAMIC TILE SIZE CONVERSION
        ; TODO: This should be calculated from actual screen map tile sizes
        ; For now, detect most common tile size in project
${tileInfo}

${xDivisionCode}
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by ${msxCharSize})
    ld a, b
${yDivisionCode}
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp ${tilesPerRow}; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp ${tilesPerColumn}; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    and #F0               ; Family bits only (0=NoSolid, #10+=Solid)
    jr z, no_tile_collision; 0 = passable (NoSolid family)

        ; Collision detected - handle it
    call handle_tile_collision

    no_tile_collision:
    pop bc
    pop af
    ret

    check_entity_collision:
    ; Check collision with other entities
        ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

        ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0; Other entity index

    entity_collision_loop:
    ld a, e
    cp c; Skip self
    jr z, next_entity_collision

        ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

        ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de; HL points to other entity X
    ld d, (hl); D = other X

    push de; Save D=otherX, E=otherIndex
    ld d, 0; Reset D for correct address calculation
    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld a, (hl); A = other Y
    pop de; Restore D=otherX, E=otherIndex
    ld e, a; E = other Y

        ; Check if entities overlap(16x16 sprites)
            ; Current entity: A = X, B = Y
                ; Other entity: D = X, E = Y

                    ; X overlap check: | X1 - X2 | <16
    ld h, a; H = current X
    ld a, d; A = other X
    sub h; A = other X - current X
    jr nc, x_diff_positive; Jump if positive
    neg; Make positive
    x_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No X overlap

        ; Y overlap check: | Y1 - Y2 | <16
    ld a, e; A = other Y
    sub b; A = other Y - current Y
    jr nc, y_diff_positive; Jump if positive
    neg; Make positive
    y_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No Y overlap

        ; Collision detected!
    call handle_entity_collision

    no_entity_collision:
    pop de
    pop hl

    next_entity_collision:
    inc hl; Next entity mask
    inc e; Next entity index
    ld a, e
    cp 32; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

    handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

${hasPlatformRiding ? `    handle_entity_collision:
    ; Handle collision between entities
    ; At entry:
    ;   C = current entity index
    ;   Stack top: DE (E = other entity index), HL, AF, BC
    ; Check for platform riding: if current entity is above other entity and
    ; other entity is a platform (collision_layer & 8), set platform reference

    push bc
    push de
    push hl

    ; Get other entity index from stack (it's at SP+6)
    ld hl, 6
    add hl, sp
    ld a, (hl)              ; A = other entity index (E from pushed DE)
    ld e, a                 ; E = other entity index

    ; Get current entity Y position
    ld hl, entity_y_pos
    ld d, 0
    ld b, c                 ; B = current entity index
    add hl, bc              ; HL = &entity_y_pos[current]
    ld b, (hl)              ; B = current Y

    ; Get other entity Y position
    ld hl, entity_y_pos
    ld d, 0
    add hl, de              ; HL = &entity_y_pos[other]
    ld d, (hl)              ; D = other Y

    ; Check if current entity is above other entity
    ; Current is above if: current_Y + 16 is near other_Y (within 4 pixels)
    ld a, b                 ; A = current Y
    add a, 16               ; A = current Y + height
    sub d                   ; A = (current Y + 16) - other Y
    ; If result is 0-4, current is standing on other
    cp 5
    jr nc, .not_on_platform ; Not standing on platform

    ; Current entity is above other entity
    ; Check if other entity is a platform (collision_layer & COLLISION_LAYER_PLATFORM)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and COLLISION_LAYER_PLATFORM
    jr z, .not_on_platform  ; Not a platform

    ; Other entity IS a platform - set platform reference
    ld a, e                 ; A = other entity index
    ld hl, entity_platform_id
    ld d, 0
    ld e, c                 ; E = current entity index
    add hl, de              ; HL = &entity_platform_id[current]
    ld (hl), a              ; Set platform reference

    ; Reset grace frames to 0 (we're on a platform now)
    ld hl, entity_platform_grace
    ld e, c
    add hl, de
    ld (hl), 0

.not_on_platform:
    pop hl
    pop de
    pop bc
    ret
` : `    handle_entity_collision:
    ; No active entity uses COLLISION_LAYER_PLATFORM in this project.
    ret
`}

        `;

    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.collision',
        kind: 'routine',
        owner: 'components',
    });
}

/**
 * Generate get_behavior_tile function (shared by Collision and WallCollision systems)
 * Returns behavior value for a tile at (B=row, C=column) using current_behavior_map
 */
function generateGetBehaviorTile(romMode: string = 'simple32k', targetFormat: string = 'konami'): string {
    const usesMapper = usesMapperBanking(romMode);
    const asm = applyMapperDataWindowPage(`
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.',
  inputs: [
    'B = tile row    (0..23, out-of-range → A=0, passable)',
    'C = tile column (0..31, out-of-range → A=0, passable)',
    'current_behavior_map = 16-bit pointer to active screen behavior map',
    'current_behavior_map_bank = memory bank number (mapper context)',
  ],
  outputs: [
    'A = behavior byte:',
    '  bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)',
    '  bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)',
  ],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
  notes: [
    'Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)',
    'so consecutive calls for the same row skip the row*32 multiply.',
    'Mapper push/pop protects P2 bank around the map read (no-op in simple32k mode).',
    'MUST be called with DE = entity index already set (DE is preserved, not used).',
  ],
})}
get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ; NOTE: jp nc (not jr nc) to gbt_oob — gbt_oob is a global label defined after
    ; get_behavior_tile_nb. Using jr would create a local-label scoping conflict in
    ; glass.jar (get_behavior_tile_nb: starts a new scope, so .bt_out_of_bounds would
    ; belong to that scope, not get_behavior_tile's scope).
    ld a, b
    cp 24
    jp nc, gbt_oob                ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jp nc, gbt_oob                ; Column >= 32: treat as passable
get_behavior_tile_nb:
    ; Entry point for callers that guarantee B ∈ 0..23 and C ∈ 0..31.
    ; Saves 36 cycles (4+7+7+4+7+7) by skipping bounds validation.
    ; DO NOT call this unless the probe coordinates are provably in-bounds.
    push hl
    push de

    ; Load cached behavior map pointer (fallback to current_behavior_map)
    ld hl, behavior_cache_map_l
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr nz, .map_ptr_ready

    ld de, (current_behavior_map)
    ld a, e
    ld (behavior_cache_map_l), a
    ld a, d
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a

.map_ptr_ready:
    ; Reuse previous row base when checking multiple points on same row
    ld a, b
    ld hl, behavior_cache_row
    cp (hl)
    jr z, .use_cached_row_base

    ; Cache miss: row base = behavior_map + row*32
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    add hl, de                    ; HL = row base address

    ld a, b
    ld (behavior_cache_row), a
    ld (behavior_cache_row_base), hl
    jr .row_base_ready

.use_cached_row_base:
    ld hl, (behavior_cache_row_base)

.row_base_ready:
    ld e, c
    ld d, 0
    add hl, de                    ; HL = row base + column
${!usesMapper ? `
    ; simple32k: behavior map is always resident in RAM (no bank switching needed).
    ; Skip mapper push/pop/set — saves ~169 cycles per call (41% overhead eliminated).
    ld a, (hl)                    ; A = behavior value (direct RAM read)
` : `
    ; Banked ROM build: protect P2 bank around the read in case behavior map is in ROM bank.
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, (hl)                    ; A = behavior value
    push af
    call mapper_pop_p2
    pop af
`}    pop de
    pop hl
    ret
gbt_oob:
    xor a                         ; A = 0 (passable)
    ret
    `, targetFormat);
    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.behavior_tile',
        kind: 'routine',
        owner: 'components',
        roots: ['get_behavior_tile', 'get_behavior_tile_nb', 'gbt_oob'],
    });
}

/**
 * Generate Input Component System with direction restrictions (Cursors component)
 */
function generateInputSystem(): string {
    const asm = `
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a
            ld (input_key_button1_mode), a ; default button 1 keyboard = SPC
            ld (input_key_button2_mode), a ; default button 2 keyboard = N
            ld (control_jump_button), a    ; default jump/fire action = physical button 1
            ld a, CONTROL_PHYS_BTN2
            ld (control_action_button), a  ; default action/grab action = physical button 2

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
            ld bc, 31
            ld (hl), #0F               ; Default: 00001111 = all directions enabled
            ldir

            ; Initialize cursor speed for all entities (default: 2 px/frame)
            ld hl, entity_input_speed
            ld de, entity_input_speed + 1
            ld bc, 31
            ld (hl), 2
            ldir

            ; Initialize input disabled flags to 0 (all entities start with input ENABLED)
            ld hl, entity_input_disabled
            ld de, entity_input_disabled + 1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize ladder state flags to 0
            ld hl, entity_on_ladder
            ld de, entity_on_ladder + 1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_input_component:
            ; Update input handling for player entities
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

            ; Process input for entities with input component
            ld a, (input_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through input-enabled entities only
            ld hl, input_entity_list

        input_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .input_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, input_next_entity
        .input_not_fast_player:

            push hl
            call update_entity_ladder_state_c
            pop hl

            ; input_entity_list already guarantees active + current_screen_id + input

            ; Check if input is disabled for this entity (DISABLE_INPUT action)
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_input_disabled
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .input_enabled
            ; Input disabled: zero velocity and skip
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), 0
            ld hl, entity_vel_y
            add hl, de
            ld (hl), 0
            pop hl
            jp input_next_entity
        .input_enabled:

            ; Apply input to entity movement (real implementation)
            push bc
            push hl

            call aircontrol_should_lock_horizontal_c
            jp z, .input_aircontrol_continue
            pop hl
            pop bc
            jp input_next_entity
.input_aircontrol_continue:

            ; Get direction mask for this entity
            ld hl, entity_dir_mask
            ld e, c
            ld d, 0
            add hl, de
            ld d, (hl)                 ; D = direction mask (allowUp / Down / Left / Right)

            ; Convert joystick input to velocity
            ld a, (input_state)
            ld b, 0                    ; Default X velocity
            ld c, 0                    ; Default Y velocity

            ; Resolve per-entity input speed once per update.
            ; H = cardinal speed, L = diagonal speed (max(1, speed/2)).
            push af
            ld a, d
            push af
            ld d, 0
            ld hl, entity_input_speed
            add hl, de
            ld a, (hl)
            or a
            jr nz, .input_speed_ok
            ld a, 1
        .input_speed_ok:
            ld h, a
            srl a
            jr nz, .input_diag_speed_ok
            ld a, 1
        .input_diag_speed_ok:
            ld l, a
            pop af
            ld d, a
            pop af

            ; Check directional input with direction restrictions
            cp STICK_UP
            jp z, input_move_up
            cp STICK_DOWN
            jp z, input_move_down
            cp STICK_LEFT
            jp z, input_move_left
            cp STICK_RIGHT
            jp z, input_move_right
            cp STICK_UPRIGHT
            jp z, input_move_upright
            cp STICK_UPLEFT
            jp z, input_move_upleft
            cp STICK_DOWNRIGHT
            jp z, input_move_downright
            cp STICK_DOWNLEFT
            jp z, input_move_downleft
            jp input_apply_velocity

        input_move_up:
            ; Check if UP is allowed (bit 0)
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld c, a                    ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld c, a                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld b, a                    ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld b, a                    ; Positive X velocity (right)
            jp input_apply_velocity

        input_move_upright:
            ; Check if both UP and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_right_only ; UP not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_up_only  ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l                    ; Diagonal movement (slower)
            ld b, a
            neg
            ld c, a
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_upleft:
            ; Check if both UP and LEFT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_left_only1 ; UP not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_up_only1 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            neg
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_downright:
            ; Check if both DOWN and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_right_only2 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_down_only2 ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld a, h
            ld c, a
            jp input_apply_velocity

        input_move_downleft:
            ; Check if both DOWN and LEFT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_left_only3 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_down_only3 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld c, a
            neg
            ld b, a
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_down_only3:
            ; Only DOWN allowed
            ld a, h
            ld c, a

        input_apply_velocity:
            ; Apply calculated velocity to entity
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            ; Update entity_facing_dir based on input_state
            ; Only updates for directional inputs (0 = no change, keeps last facing)
            push af
            ld a, (input_state)
            or a
            jr z, .input_facing_done    ; 0 = no direction pressed, keep last facing
            cp 2
            jr c, .input_facing_up      ; 1 = UP only
            cp 5
            jr c, .input_facing_right   ; 2,3,4 = UP+RIGHT, RIGHT, DOWN+RIGHT
            jr z, .input_facing_down    ; 5 = DOWN only
            ; 6,7,8 = DOWN+LEFT, LEFT, UP+LEFT
            ld a, 1                     ; FACING_LEFT = 1
            jr .input_facing_write
.input_facing_right:
            ld a, 2                     ; FACING_RIGHT = 2
            jr .input_facing_write
.input_facing_up:
            ld a, 3                     ; FACING_UP = 3
            jr .input_facing_write
.input_facing_down:
            ld a, 4                     ; FACING_DOWN = 4
.input_facing_write:
            push hl
            push de
            ld hl, entity_facing_dir
            add hl, de                  ; DE = (0, entity_index)
            ld (hl), a
            pop de
            pop hl
.input_facing_done:
            pop af

            ; Sync directional sprite facing for input-driven entities.
            ; Uses sprite_dir_* lookup tables (left/right/up/down variants).
            ; Skip only when the assigned state machine explicitly uses ChangeSprite.
            ; Plain state machines without sprite actions must keep auto-facing active.
            push af
            ld hl, entity_sm_sprite_control
            add hl, de              ; DE = (0, entity_index)
            ld a, (hl)
            pop af
            jp nz, .skip_patrol_facing
${emitDirectionalFacingSpriteSync('input_directional_sprite')}
.skip_patrol_facing:

            pop hl
            pop bc

        input_next_entity:
            dec b
            jp nz, input_update_loop
            ret
    `;

    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.input',
        kind: 'routine',
        owner: 'components',
    });
}

/**
 * Generate Behavior Component System
 */
function generateBehaviorSystem(): string {
    return wrapMideasAsmBlock(`
; ==================================================================
; BEHAVIOR COMPONENT SYSTEM
; ==================================================================
; Minimal built-in behavior runner. Type 0 preserves legacy projects as no-op;
; additional types are table-driven so future enemy/NPC movement can be added
; without changing the entity component mask layout.
${buildRegisterContractComment({
  purpose: 'Run small table-driven Behavior movement modes for active entities.',
  inputs: ['active_entity_list/active_entity_count', 'entity_behavior_cfg_* tables', 'hero_entity_id'],
  outputs: ['entity_vel_x may be changed; entity_facing_dir may be changed'],
  clobbers: ['AF', 'BC', 'DE', 'HL'],
  preserved: ['Stack balance only'],
  usage: [
    'B = active-list loop counter, restored from stack after each entity',
    'C = entity index while processing a behavior',
    'D = target/current direction in X helpers (1=left, 2=right)',
    'entity_behavior_cfg_type: 0=none, 1=follow_player_x, 2=flee_player_x, 3=face_player_x, 4=walk_x_wall_turn',
  ],
})}
BEHAVIOR_TYPE_NONE            EQU 0
BEHAVIOR_TYPE_FOLLOW_PLAYER_X EQU 1
BEHAVIOR_TYPE_FLEE_PLAYER_X   EQU 2
BEHAVIOR_TYPE_FACE_PLAYER_X   EQU 3
BEHAVIOR_TYPE_WALK_X_WALL_TURN EQU 4

init_behavior_system:
    ret

update_behavior_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

behavior_update_loop:
    ld c, (hl)
    inc hl
    push hl
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_BEHAVIOR
    jp z, behavior_next_entity

    ld hl, entity_behavior_cfg_type
    add hl, de
    ld a, (hl)
    or a
    jp z, behavior_next_entity
    cp BEHAVIOR_TYPE_FOLLOW_PLAYER_X
    jp z, behavior_follow_player_x
    cp BEHAVIOR_TYPE_FLEE_PLAYER_X
    jp z, behavior_flee_player_x
    cp BEHAVIOR_TYPE_FACE_PLAYER_X
    jp z, behavior_face_player_x
    cp BEHAVIOR_TYPE_WALK_X_WALL_TURN
    jp z, behavior_walk_x_wall_turn
    jp behavior_next_entity

behavior_follow_player_x:
    call behavior_load_target_delta_x
    ld a, d
    or a
    jp z, behavior_stop_x_and_next
    call behavior_distance_allows
    or a
    jp z, behavior_stop_x_and_next
    ld a, d
    cp 1
    jp z, behavior_follow_left
    call behavior_get_speed_a
    call behavior_store_x_velocity_a
    ld d, 2
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_follow_left:
    call behavior_get_speed_a
    neg
    call behavior_store_x_velocity_a
    ld d, 1
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_flee_player_x:
    call behavior_load_target_delta_x
    ld a, d
    or a
    jp z, behavior_stop_x_and_next
    call behavior_distance_allows
    or a
    jp z, behavior_stop_x_and_next
    ld a, d
    cp 1
    jp z, behavior_flee_right
    call behavior_get_speed_a
    neg
    call behavior_store_x_velocity_a
    ld d, 1
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_flee_right:
    call behavior_get_speed_a
    call behavior_store_x_velocity_a
    ld d, 2
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_face_player_x:
    call behavior_load_target_delta_x
    ld a, d
    or a
    jp z, behavior_next_entity
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_walk_x_wall_turn:
    call behavior_get_facing_or_default_d
    call behavior_turn_on_wall_d
    ld a, d
    cp 1
    jp z, behavior_walk_left
    call behavior_get_speed_a
    call behavior_store_x_velocity_a
    ld d, 2
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_walk_left:
    call behavior_get_speed_a
    neg
    call behavior_store_x_velocity_a
    ld d, 1
    call behavior_store_facing_d
    jp behavior_next_entity

behavior_stop_x_and_next:
    xor a
    call behavior_store_x_velocity_a
    jp behavior_next_entity

; Input: C = entity index.
; Output: D = direction to player (0 none/equal, 1 left, 2 right), A = unsigned X distance.
behavior_load_target_delta_x:
    ld a, (hero_entity_id)
    cp #FF
    jp z, behavior_delta_no_target
    cp c
    jp z, behavior_delta_no_target
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld b, (hl)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp b
    jp z, behavior_delta_no_target
    jp c, behavior_delta_target_left
    sub b
    ld d, 2
    or a
    ret

behavior_delta_target_left:
    ld e, a
    ld a, b
    sub e
    ld d, 1
    or a
    ret

behavior_delta_no_target:
    xor a
    ld d, 0
    ret

; Input: C = entity index, D = direction, A = distance.
; Output: A = 1 when distance is within stop/range gates, 0 otherwise. D is preserved.
behavior_distance_allows:
    ld b, a
    push de
    ld e, c
    ld d, 0
    ld hl, entity_behavior_cfg_stop
    add hl, de
    ld a, b
    cp (hl)
    jp z, behavior_distance_blocked
    jp c, behavior_distance_blocked
    ld hl, entity_behavior_cfg_range
    add hl, de
    ld a, (hl)
    or a
    jp z, behavior_distance_allowed
    cp b
    jp c, behavior_distance_blocked

behavior_distance_allowed:
    pop de
    ld a, 1
    or a
    ret

behavior_distance_blocked:
    pop de
    xor a
    ret

; Input: C = entity index. Output: A = speed, D preserved.
behavior_get_speed_a:
    push de
    ld e, c
    ld d, 0
    ld hl, entity_behavior_cfg_speed
    add hl, de
    ld a, (hl)
    or a
    jp nz, behavior_get_speed_done
    ld a, 1
behavior_get_speed_done:
    pop de
    ret

; Input: C = entity index. Output: D = facing/default direction (1 left, 2 right).
behavior_get_facing_or_default_d:
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    jp z, behavior_facing_left
    cp 2
    jp z, behavior_facing_right
    ld hl, entity_behavior_cfg_dir
    add hl, de
    ld a, (hl)
    cp 1
    jp z, behavior_facing_left
behavior_facing_right:
    ld d, 2
    ret
behavior_facing_left:
    ld d, 1
    ret

; Input/Output: D = walking direction. Turns around when previous WallCollision
; flagged a wall in front (bit2=LEFT, bit3=RIGHT).
behavior_turn_on_wall_d:
    ld e, c
    push de
    ld d, 0
    ld hl, entity_wall_collision_flags
    add hl, de
    ld a, (hl)
    pop de
    bit 2, a
    jp nz, behavior_turn_if_left
    bit 3, a
    jp nz, behavior_turn_if_right
    ret

behavior_turn_if_left:
    ld a, d
    cp 1
    ret nz
    ld d, 2
    ret

behavior_turn_if_right:
    ld a, d
    cp 2
    ret nz
    ld d, 1
    ret

; Input: C = entity index, A = signed X velocity. D preserved.
behavior_store_x_velocity_a:
    push de
    ld e, c
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    pop de
    ret

; Input: C = entity index, D = facing direction.
behavior_store_facing_d:
    ld a, d
    or a
    ret z
    push de
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    pop de
    ret

behavior_next_entity:
    pop bc
    pop hl
    dec b
    jp nz, behavior_update_loop
    ret
`, {
        id: 'runtime.components.behavior',
        kind: 'routine',
        owner: 'components',
        roots: ['init_behavior_system', 'update_behavior_component'],
    });
}

/**
 * Generate Gravity Component System
 */
function generateGravitySystem(): string {
    const asm = `
    ; ==================================================================
        ; GRAVITY COMPONENT SYSTEM(Constant downward acceleration)
    ; ==================================================================

        init_gravity_system:
; Initialize gravity system
    ; Clear gravity velocities
            ld hl, entity_gravity_vel
            ld de, entity_gravity_vel + 1
            ld bc, 63; 64 bytes - 1(32 words)
            ld (hl), 0
            ldir
            ret

update_gravity_component:
; Apply gravity acceleration to entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

gravity_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .gravity_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .gravity_skip_fast_player
        .gravity_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)                 ; Get entity component mask high byte
            pop hl                     ; Restore list pointer
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

    ; active_entity_list already guarantees current_screen_id membership

    ; Entity has gravity - apply acceleration
            push bc
            push hl

    ; Check if entity is grounded
            ld hl, entity_on_ground
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            bit 0, a; Check ground flag
            jr nz, gravity_grounded; Skip gravity if on ground

            ld hl, entity_on_ladder
            add hl, de
            ld a, (hl)
            or a
            jr nz, gravity_grounded

    ; Apply gravity acceleration
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de; HL points to gravity velocity(word)

            ld e, (hl); Load current gravity velocity
            inc hl
            ld d, (hl)

    ; Add gravity strength(64 in fixed - point = ~0.25 pixels / frame acceleration)
            ld a, e
            add a, #40; Add 64 to low byte
            ld e, a
            ld a, d
            adc a, #00; Add carry to high byte
            ld d, a

    ; Check terminal velocity(1024 = max fall speed)
    ; Skip cap if velocity is negative (entity is moving UP / jumping)
            ld a, d
            bit 7, a; Check sign bit - negative means going up
            jr nz, gravity_store_vel; Skip cap for upward velocity
            cp #04; Check if >= 1024 (unsigned, only for positive/downward)
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Set entity_vel_y to gravity integer part
    ; Position component will apply vel_y to Y position
    ; Wall collision can then detect vertical movement and snap back
            push de                ; Save gravity velocity (D=integer part)
            ld hl, entity_vel_y
            ld e, c                ; E = entity index
            ld d, 0
            add hl, de             ; HL = &entity_vel_y[entity]
            pop de                 ; Restore gravity velocity
            ld (hl), d             ; vel_y = gravity velocity integer part

            jr gravity_done

gravity_grounded:
; Entity is grounded - reset gravity velocity
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de
            ld (hl), 0; Clear velocity low
            inc hl
            ld (hl), 0; Clear velocity high

gravity_done:
            pop hl
            pop bc
            jp gravity_next_entity

        .gravity_skip_fast_player:
            pop hl

gravity_next_entity:
            dec b
            jp nz, gravity_update_loop
    ret
    `;
    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.gravity',
        kind: 'routine',
        owner: 'components',
        roots: ['init_gravity_system', 'update_gravity_component'],
    });
}

/**
 * Generate Health Component System
 */
function generateHealthSystem(): string {
    const asm = `
    ; ==================================================================
    ; HEALTH COMPONENT SYSTEM
    ; ==================================================================
    ; Manages entity health/lives (current, max)
    ; Detects death when current <= 0
    ; Provides DECREASE_LIVES and INCREASE_LIVES functionality
    ; ==================================================================

init_health_system:
    ; Initialize health for all entities with Health component
    ; Default: current = 3, max = 3 (configurable per entity)
    ld b, 32                      ; Loop all entities
    ld hl, entity_comp_masks      ; Check low byte for Health bit
    ld c, 0                       ; Entity index

.init_loop:
    ld a, (hl)
    and COMP_MASK_HEALTH          ; COMP_MASK_HEALTH (#0040, low byte bit 6)
    jr z, .init_next_entity       ; Skip if no health component

    ; Initialize current health (default: 3)
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 3                    ; Default current = 3

    ; Initialize max health (default: 3)
    ld hl, entity_health_max
    add hl, de
    ld (hl), 3                    ; Default max = 3
    pop hl
    pop bc

.init_next_entity:
    inc hl
    inc c
    djnz .init_loop
    ret

update_health_component:
    ; Check for death (current <= 0) and mark entities as dead
    ; Entity death is detected by state machine via HEALTH_LESS_THAN condition
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.health_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and COMP_MASK_HEALTH
    jr z, .health_next_entity

    ; Check current health
    push bc
    push hl
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Check if dead (current <= 0)
    or a                          ; Set flags
    jr nz, .health_alive          ; If != 0, entity is alive

    ; Entity is dead (current = 0)
    ; Could trigger death state here, but state machine handles it
    ; via HEALTH_LESS_THAN or HEALTH_EQUALS conditions

.health_alive:
    pop hl
    pop bc

.health_next_entity:
    dec b
    jp nz, .health_update_loop
    ret

; ==================================================================
; HEALTH HELPER FUNCTIONS (called by State Machine actions)
; ==================================================================

decrease_entity_lives:
    ; Decrease lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to decrease
    ; Output: Updated entity_health_current
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health
    sub b                         ; Subtract amount
    jr nc, .store_health          ; If no carry (result >= 0), store
    xor a                         ; Clamp to 0 if negative
.store_health:
    ld (hl), a                    ; Store new health
    pop bc
    ret

increase_entity_lives:
    ; Increase lives for entity in register C by amount in register A
    ; Input: C = entity index, A = amount to increase
    ; Output: Updated entity_health_current (clamped to max)
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; Save amount in B

    ; Get current health
    ld hl, entity_health_current
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current health

    ; Add amount
    add a, b
    ld b, a                       ; Save result in B

    ; Get max health
    ld hl, entity_health_max
    add hl, de
    ld a, (hl)                    ; A = max health

    ; Clamp to max
    cp b                          ; Compare max with result
    jr nc, .store_result          ; If max >= result, use result
    ld b, a                       ; Otherwise clamp to max

.store_result:
    ld hl, entity_health_current
    add hl, de
    ld (hl), b                    ; Store clamped health
    pop bc
    ret
    `;
    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.health',
        kind: 'routine',
        owner: 'components',
        roots: ['init_health_system', 'update_health_component', 'decrease_entity_lives', 'increase_entity_lives'],
    });
}

/**
 * Generate Damage Component System with Invincibility Frames
 */
function generateDamageSystem(): string {
    return wrapMideasAsmBlock(`
    ; ==================================================================
    ; DAMAGE COMPONENT SYSTEM
    ; ==================================================================
    ; Manages damage dealing and invincibility frames
    ;
    ; Components:
    ; - entity_invincibility_frames: Countdown timer for invulnerability (32 bytes)
    ; - entity_damage_amount: How much damage this entity deals (32 bytes)
    ;
    ; Invincibility frames prevent damage for ~1 second after being hit

init_damage_system:
    ; Initialize invincibility frames to 0 for all entities
    ld hl, entity_invincibility_frames
    ld de, entity_invincibility_frames + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize damage amounts (default: 1 damage per entity)
    ld hl, entity_damage_amount
    ld de, entity_damage_amount + 1
    ld bc, 31
    ld (hl), 1
    ldir
    ret

update_damage_component:
    ; Update invincibility frames for all entities with Damage component
    ; Decrements invincibility_frames counter each frame
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.damage_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #08                       ; COMP_MASK_DAMAGE (bit 3 in high byte = #0800)
    jr z, .damage_next_entity     ; Skip if no damage component

    ; Decrement invincibility frames if > 0
    push bc
    push hl

    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current invincibility frames
    or a                          ; Check if 0
    jr z, .damage_frames_done     ; Already 0, skip

    dec a                         ; Decrement
    ld (hl), a                    ; Store back

.damage_frames_done:
    pop hl
    pop bc

.damage_next_entity:
    dec b
    jp nz, .damage_update_loop
    ret

; ==================================================================
; DAMAGE HELPER FUNCTIONS
; ==================================================================

apply_damage_to_entity:
    ; Apply damage to entity and set invincibility frames
    ; Input: C = entity index, A = damage amount
    ; Destroys: AF, DE, HL
    push bc
    ld b, a                       ; B = damage amount

    ; Check if entity has invincibility frames active
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr nz, .damage_blocked        ; Still invincible, block damage

    ; Apply damage using decrease_entity_lives
    ld a, b                       ; A = damage amount
    call decrease_entity_lives    ; C still holds entity index

    ; Set invincibility frames (60 frames = 1 second @ 60 FPS)
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 60                   ; 1 second of invincibility

.damage_blocked:
    pop bc
    ret

check_entity_invincible:
    ; Check if entity is currently invincible
    ; Input: C = entity index
    ; Output: A = 1 if invincible, 0 if vulnerable
    ; Destroys: DE, HL
    ld hl, entity_invincibility_frames
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a                          ; Sets Z flag if 0
    ret z                         ; Return 0 if vulnerable

    ld a, 1                       ; Return 1 if invincible
    ret
    `, {
        id: 'runtime.components.damage',
        kind: 'routine',
        owner: 'components',
        roots: ['init_damage_system', 'update_damage_component', 'apply_damage_to_entity', 'check_entity_invincible'],
    });
}

export function generateComponentTriggerHelpers(): string {
    return `
; ==================================================================
; COMPONENT ACTION TRIGGER HELPERS
; ==================================================================
${buildRegisterContractComment({
  purpose: 'Test whether a component-configured input trigger was pressed on this frame.',
  inputs: ['A = COMP_TRIGGER_* value'],
  outputs: ['A = 1 and NZ if pressed this frame, A = 0 and Z if not'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
  notes: ['Uses edge detection against input_btn_prev or prev_input_state.'],
})}
component_trigger_edge_pressed_a:
    cp COMP_TRIGGER_UP
    jp z, .trigger_check_up
    cp COMP_TRIGGER_ACTION2
    jp z, .trigger_check_action2

.trigger_check_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .trigger_false
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jp nz, .trigger_false
    jp .trigger_true

.trigger_check_action2:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .trigger_false
    ld a, (input_btn_prev)
    and INPUT_BTN_GRAB
    jp nz, .trigger_false
    jp .trigger_true

.trigger_check_up:
    ld a, (input_state)
    cp STICK_UP
    jp nz, .trigger_false
    ld a, (prev_input_state)
    cp STICK_UP
    jp z, .trigger_false

.trigger_true:
    ld a, 1
    or a
    ret

.trigger_false:
    xor a
    ret

${buildRegisterContractComment({
  purpose: 'Test whether a component-configured input trigger is currently held.',
  inputs: ['A = COMP_TRIGGER_* value'],
  outputs: ['A = 1 and NZ if held, A = 0 and Z if not'],
  clobbers: ['AF'],
  preserved: ['BC', 'DE', 'HL'],
})}
; @mideas:block id=runtime.components.input_trigger_level kind=routine owner=components
component_trigger_level_pressed_a:
    cp COMP_TRIGGER_UP
    jp z, .trigger_level_check_up
    cp COMP_TRIGGER_ACTION2
    jp z, .trigger_level_check_action2

.trigger_level_check_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .trigger_level_false
    jp .trigger_level_true

.trigger_level_check_action2:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .trigger_level_false
    jp .trigger_level_true

.trigger_level_check_up:
    ld a, (input_state)
    cp STICK_UP
    jp nz, .trigger_level_false

.trigger_level_true:
    ld a, 1
    or a
    ret

.trigger_level_false:
    xor a
    ret
; @mideas:endblock id=runtime.components.input_trigger_level
`;
}

/**
 * Generate Shoot Component System
 */
function generateShootSystem(): string {
    return `
    ; ==================================================================
    ; SHOOT COMPONENT SYSTEM
    ; ==================================================================
    ; Manages shooting/projectile spawning with cooldown
    ;
    ; Components:
    ; - entity_shoot_cooldown: Frames until can shoot again (32 bytes)
    ; - entity_shoot_sprite_id: Sprite ID for projectile (32 bytes)
    ; - entity_shoot_speed: Projectile velocity (32 bytes)
    ;
    ; Fire button detection integrated with input system

init_shoot_system:
    ; Initialize cooldowns to 0 (can shoot immediately)
    ld hl, entity_shoot_cooldown
    ld de, entity_shoot_cooldown + 1
    ld bc, 31                     ; 32 bytes - 1
    ld (hl), 0
    ldir

    ; Initialize default projectile speed (3 pixels/frame)
    ld hl, entity_shoot_speed
    ld de, entity_shoot_speed + 1
    ld bc, 31
    ld (hl), 3
    ldir

    ; Initialize sprite IDs to 0 (will be set by template data)
    ld hl, entity_shoot_sprite_id
    ld de, entity_shoot_sprite_id + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Initialize shoot trigger to fire for backward compatibility
    ld hl, entity_shoot_trigger
    ld de, entity_shoot_trigger + 1
    ld bc, 31
    ld (hl), COMP_TRIGGER_FIRE
    ldir

    xor a
    ld (shoot_char_active), a
    ld (shoot_char_x), a
    ld (shoot_char_y), a
    ld (shoot_char_dir), a
    ld (shoot_char_restore), a
    ld a, #FA
    ld (shoot_char_code), a
    ret

update_shoot_component:
    ; Update shooting for all entities with Shoot component
    ; Decrements cooldown and spawns projectile if fire pressed
    call .update_char_projectile
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

.shoot_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl                        ; Restore list pointer
    and #10                       ; COMP_MASK_SHOOT (bit 4 in high byte = #1000)
    jp z, .shoot_next_entity      ; Skip if no shoot component

    ; Decrement cooldown if > 0
    push bc
    push hl

    ld hl, entity_shoot_trigger
    ld e, c
    ld d, 0
    add hl, de
    bit 6, (hl)                    ; disabled by StateMachine hasAmmo=false
    jp nz, .shoot_done

    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = current cooldown
    or a                          ; Check if 0
    jr z, .usc_check_fire         ; Cooldown expired, check fire button

    ; Decrement cooldown
    dec a
    ld (hl), a
    jp .shoot_done                ; Still cooling down, skip

.usc_check_fire:
    call .shoot_action_blocked
    jp nz, .shoot_done

    ; Check if configured shoot trigger is held.
    ld hl, entity_shoot_trigger
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    and #7F
    call component_trigger_level_pressed_a
    jp z, .shoot_done             ; Shoot trigger not held, skip

    ; Fire button pressed - spawn configured projectile mode.
    ld hl, entity_shoot_trigger
    ld e, c
    ld d, 0
    add hl, de
    bit 7, (hl)
    jp nz, .spawn_char_projectile
    call .spawn_projectile
    jp .shoot_done

.shoot_action_blocked:
    ; Input: C = shooter entity index.
    ; Output: NZ if shooting is blocked, Z if allowed. Preserves BC/DE/HL.
    push bc
    push de
    push hl

    ld e, c
    ld d, 0
    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    jp nz, .shoot_action_blocked_yes

    ld hl, entity_carry_held
    add hl, de
    ld a, (hl)
    cp 255
    jp nz, .shoot_action_blocked_yes

    ld hl, entity_carried_by
    ld b, MAX_ENTITIES
.shoot_action_blocked_scan:
    ld a, (hl)
    cp c
    jp z, .shoot_action_blocked_yes
    inc hl
    djnz .shoot_action_blocked_scan

    xor a
    jp .shoot_action_blocked_done

.shoot_action_blocked_yes:
    ld a, 1
    or a

.shoot_action_blocked_done:
    pop hl
    pop de
    pop bc
    ret

.update_char_projectile:
    ; Moves one active 8x8 name-table char horizontally and restores
    ; the previous background char before drawing the next cell.
    ld a, (shoot_char_active)
    or a
    ret z

    ld a, (shoot_char_y)
    ld b, a
    ld a, (shoot_char_x)
    ld c, a
    ld a, (shoot_char_restore)
    call .shoot_char_write_tile

    ld a, (shoot_char_dir)
    cp 1
    jr z, .shoot_char_step_left

.shoot_char_step_right:
    ld a, (shoot_char_x)
    inc a
    cp 32
    jr nc, .shoot_char_deactivate
    ld (shoot_char_x), a
    jr .shoot_char_check_next

.shoot_char_step_left:
    ld a, (shoot_char_x)
    or a
    jr z, .shoot_char_deactivate
    dec a
    ld (shoot_char_x), a

.shoot_char_check_next:
    ld c, a
    ld a, (shoot_char_y)
    ld b, a
    call get_behavior_tile
    and #F0
    jr nz, .shoot_char_deactivate

    call .shoot_char_get_layout_tile
    ld (shoot_char_restore), a
    ld a, (shoot_char_code)
    call .shoot_char_write_tile
    ret

.shoot_char_deactivate:
    xor a
    ld (shoot_char_active), a
    ret

.spawn_char_projectile:
    ; Input: C = shooter entity index. Uses a single char projectile slot.
    ; Blocks while wall-grabbing or carrying a box.
    push bc
    ld a, (shoot_char_active)
    or a
    jp nz, .spawn_char_abort

    ld e, c
    ld d, 0
    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    jp nz, .spawn_char_abort

    ld hl, entity_carry_held
    add hl, de
    ld a, (hl)
    cp 255
    jp nz, .spawn_char_abort

    ld hl, entity_shoot_sprite_id
    add hl, de
    ld a, (hl)
    ld (shoot_char_code), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    cp 24
    jp nc, .spawn_char_abort
    ld (shoot_char_y), a
    ld b, a

    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    jp z, .spawn_char_left
    cp 2
    jp z, .spawn_char_right

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    bit 7, a
    jp nz, .spawn_char_left

.spawn_char_right:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 16
    jp c, .spawn_char_abort
    srl a
    srl a
    srl a
    cp 32
    jp nc, .spawn_char_abort
    ld (shoot_char_x), a
    ld c, a
    ld a, 2
    ld (shoot_char_dir), a
    jp .spawn_char_check_cell

.spawn_char_left:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    sub 8
    jp c, .spawn_char_abort
    srl a
    srl a
    srl a
    cp 32
    jp nc, .spawn_char_abort
    ld (shoot_char_x), a
    ld c, a
    ld a, 1
    ld (shoot_char_dir), a

.spawn_char_check_cell:
    call get_behavior_tile
    and #F0
    jp nz, .spawn_char_abort

    call .shoot_char_get_layout_tile
    ld (shoot_char_restore), a

    ld hl, entity_shoot_cooldown
    add hl, de
    ld (hl), 15

    ld a, 1
    ld (shoot_char_active), a
    ld a, (shoot_char_code)
    call .shoot_char_write_tile
    pop bc
    jp .shoot_done

.spawn_char_abort:
    pop bc
    jp .shoot_done

.shoot_char_get_layout_tile:
    ; Input B=row, C=column. Output A=visible char from current_screen_layout.
    push hl
    push de
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, (current_screen_layout)
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    ret

.shoot_char_write_tile:
    ; Input A=char, B=row, C=column. Writes to SCREEN 2 name table.
    push af
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    pop af
    call WRTVRM
    ret

.spawn_projectile:
    ; Spawn projectile entity
    ; Input: C = shooter entity index
    ; Destroys: AF, DE, HL
    push bc
    push de

    ; Find free entity slot
    ld hl, entity_comp_masks
    ld b, 32                      ; Check up to 32 entities
    ld d, 0                       ; Free slot index

.find_free_slot:
    ld a, (hl)                    ; Check low byte of mask
    or a
    jr z, .check_high_byte        ; Low byte is 0, check high byte

.next_free_slot:
    inc hl                        ; Next entity
    inc d                         ; Increment slot index
    djnz .find_free_slot          ; Loop for all entities

    ; No free slot found - abort spawn
    pop de
    pop bc
    ret

.check_high_byte:
    push hl
    ld hl, entity_comp_masks_hi
    ld e, d
    add hl, de
    ld a, (hl)                    ; Check high byte
    pop hl
    or a
    jr nz, .next_free_slot        ; High byte not zero, keep searching

.found_free_slot:
    ; D = Free entity index for projectile
    ; C = Shooter entity index
    ; Preserve both indexes in H/L while unwinding this helper's stack.
    ld h, c                       ; H = shooter entity index
    ld l, d                       ; L = projectile entity index
    pop de                        ; Restore caller DE saved at helper entry
    pop bc                        ; Restore caller BC saved at helper entry
    ld c, h                       ; C = shooter entity index
    ld b, l                       ; B = projectile entity index

    ; Copy shooter X + center offset into projectile X
    push bc
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shooter X
    add a, 8                      ; Offset to center (8 pixels)
    pop bc
    push bc
    ld hl, entity_x_pos
    ld e, b
    ld d, 0
    add hl, de
    ld (hl), a                    ; Set projectile X

    ; Copy shooter Y + center offset into projectile Y
    pop bc
    push bc
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shooter Y
    add a, 8                      ; Offset to center
    pop bc
    push bc
    ld hl, entity_y_pos
    ld e, b
    ld d, 0
    add hl, de
    ld (hl), a                    ; Set projectile Y

    ; Mark projectile active and attach minimal runtime components.
    ld hl, entity_active
    add hl, de
    ld (hl), 1

    ld hl, entity_comp_masks
    add hl, de
    ld (hl), #07                  ; POSITION | SPRITE | MOVEMENT (low byte)

    ld hl, entity_comp_masks_hi
    add hl, de
    ld (hl), 0                    ; High byte = 0

    ld hl, entity_screen_id
    add hl, de
    ld a, (current_screen_id)
    ld (hl), a

    ; Use the projectile sprite configured on the shooter, if any.
    pop bc
    push bc
    ld hl, entity_shoot_sprite_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    pop bc
    push bc
    ld hl, entity_sprite_asset_index
    ld e, b
    ld d, 0
    add hl, de
    ld (hl), a

    ; Assign a deterministic fallback hardware pattern/color for the new slot.
    ld a, b
    add a, a
    add a, a
    ld hl, sprite_pattern
    add hl, de
    ld (hl), a
    ld hl, sprite_color
    add hl, de
    ld (hl), 15

    ; Set projectile velocity based on shooter's facing direction
    ; Get shooter's velocity X to determine facing direction.
    pop bc
    push bc
    ld hl, entity_vel_x
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shooter's vel_x

    ; Check if shooter is moving left (negative velocity)
    bit 7, a                      ; Check sign bit
    jr z, .shoot_facing_right     ; vel_x >= 0, facing right

.shoot_facing_left:
    ; Shooter facing left - projectile velocity should be negative
    pop bc
    push bc
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)
    neg                           ; Negate to make it negative
    jr .shoot_vel_set

.shoot_facing_right:
    ; Shooter facing right - projectile velocity is positive
    pop bc
    push bc
    ld hl, entity_shoot_speed
    ld e, c                       ; Shooter index
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = shoot speed (positive)

.shoot_vel_set:
    pop bc
    push bc
    ld hl, entity_vel_x
    ld e, b                       ; Projectile index
    ld d, 0
    add hl, de
    ld (hl), a                    ; Set velocity X

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0                    ; Set velocity Y = 0 (horizontal)

    ; Set collision layer for player bullet (layer 4)
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), 4                    ; Player bullet layer

    ; Set collides with mask (collides with enemies = layer 2)
    ld hl, entity_collides_with
    add hl, de
    ld (hl), 2                    ; Collides with enemies

    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), 4

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), 6

    ; Set cooldown (15 frames @ 60fps ~= 250ms)
    pop bc                        ; B = projectile index, C = shooter index
    ld hl, entity_shoot_cooldown
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 15

    call mark_used_entity_list_dirty
    ret

.shoot_done:
    pop hl
    pop bc

.shoot_next_entity:
    dec b
    jp nz, .shoot_update_loop
    ret
    `;
}

/**
 * Generate Platform Riding System
 */
function generatePlatformRidingSystem(hasPlatformRiding: boolean): string {
    if (!hasPlatformRiding) {
        return `
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM (STUB)
    ; ==================================================================

init_platform_riding_system:
    ; Keep jump/ground checks deterministic even when dynamic platforms are absent.
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

; @mideas:block id=runtime.components.platform_riding_stub kind=routine owner=components
prepare_platform_detection:
    ret

update_platform_riding:
    ret
; @mideas:endblock id=runtime.components.platform_riding_stub
    `;
    }

    return `
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM
    ; ==================================================================
    ; Detects when entities are standing on platforms and transfers velocity
    ;
    ; Platform detection: Entity A is on platform B if:
    ; - A's bottom edge is at or near B's top edge
    ; - A has horizontal overlap with B
    ; - B has collision_layer bit 3 set (platform layer = 8)
    ;
    ; Grace frames: 6 frames tolerance when leaving platform

init_platform_riding_system:
    ; Initialize platform IDs to 255 (no platform)
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Initialize grace frames to 0
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

prepare_platform_detection:
    ; PHASE 1 - Called BEFORE collision detection
    ; Clear platform references from previous frame
    ; Entities that were on platforms get grace frames
    ; Collision detection will reset platform_id if still in contact

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.platform_clear_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check entity_platform_id[entity]
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl                 ; Save entity_platform_id pointer
    ld hl, entity_platform_grace
    add hl, de
    ld a, 6
    ld (hl), a              ; Set grace frames
    pop hl                  ; Restore entity_platform_id pointer

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    pop bc
    pop hl
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.grace_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check if entity has platform reference
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255
    jr nz, .grace_skip      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_skip       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_skip:
    pop bc
    pop hl
    djnz .grace_loop
    ret
    `;
}

/**
 * Generate Animation Component System
 */
function generateAnimationSystem(): string {
    return wrapMideasAsmBlock(`
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation component data
            ; Clear frames
            ld hl, entity_anim_frame
            ld de, entity_anim_frame+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear ticks
            ld hl, entity_anim_tick
            ld de, entity_anim_tick+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Default speed = ANIM_DEFAULT_SPEED
            ld hl, entity_anim_speed
            ld de, entity_anim_speed+1
            ld bc, 31
            ld (hl), ANIM_DEFAULT_SPEED
            ldir

            ; Default flags = playing + loop (loop cleared/set per-sprite by Action_ChangeSprite)
            ld hl, entity_anim_flags
            ld de, entity_anim_flags+1
            ld bc, 31
            ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP
            ldir
            ret

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - In preload mode, sprite rendering picks the frame directly from SAT pattern indices
            ; - In fallback mode, copies the selected frame's patterns to VRAM for this entity
            ld a, (anim_entity_count)
            or a
            ret z
            ld b, a                    ; Loop animated render entities only
            ld hl, anim_entity_list

        .anim_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .anim_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, .anim_next_entity
        .anim_not_fast_player:

            ; anim_entity_list already guarantees active + current_screen_id + animation + sprite

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jp z, anim_done_entity

            ; Only animate when moving?
            bit 2, a
            jr z, .tick

            ; vel_x != 0 || vel_y != 0
            ld hl, entity_vel_x
            add hl, de
            ld a, (hl)
            ld hl, entity_vel_y
            add hl, de
            or (hl)
            jp z, anim_done_entity

        .tick:
            ; ChangeSprite defers the frame sync to the next animation pass
            ; so sprite changes happen from the regular frame pipeline instead
            ; of mid-frame inside the state-machine action path.
            ld hl, entity_anim_flags
            add hl, de
            bit 4, (hl)
            jr z, .anim_tick_advance
            res 4, (hl)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index for forced upload
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            jp .anim_upload_frame

        .anim_tick_advance:
            ; tick++
            ld hl, entity_anim_tick
            add hl, de
            inc (hl)

            ; if tick < speed -> done
            ld a, (hl)
            ld hl, entity_anim_speed
            add hl, de
            cp (hl)
            jp c, anim_done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jp nc, .anim_has_multiple_frames

            ; 0/1-frame one-shots must still complete. This lets temporary
            ; sprites such as wall-jump poses restore automatically.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jp nz, anim_done_entity
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            jp anim_done_entity

.anim_has_multiple_frames:
            push af                    ; Save frameCount on stack

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)                 ; A = current frame
            inc a                      ; A = next frame
            pop de                     ; D = frameCount (was pushed as A)
            push de                    ; Keep frameCount on stack for .clamp_last
            cp d                       ; Compare frame with frameCount
            jr c, .store_frame

            ; Overflow: loop?
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            pop de                     ; D = frameCount
            push de                    ; Keep balanced
            ld a, d
            dec a                      ; frame = frameCount-1
            push af                    ; Preserve clamped frame index

            ; Mark one-shot completion and stop playback for non-loop anim.
            ; State machine condition ANIMATION_COMPLETE consumes this flag.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            pop af

        .store_frame:
            pop de                     ; Clean stack (discard frameCount)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld (hl), a                 ; store new frame index

        .anim_upload_frame:
            push af                    ; Preserve frame index
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .anim_upload_frame_fallback
            pop af
            jp anim_done_entity

        .anim_upload_frame_fallback:
            pop af

            ; Get pointer to this sprite asset's frame pointer list
            ld l, b
            ld h, 0
            add hl, hl                 ; index * 2
            ld de, sprite_asset_frame_ptr_table
            add hl, de
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = frame pointer list base

            ; HL = &frame_ptrs[frame]
            ld e, a
            ld d, 0
            add hl, de
            add hl, de                 ; + frame*2
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = source pattern data

            ; Get entity sprite config (base HW sprite + layer count)
            push hl                    ; save source
            ld e, c
            ld d, 0
            ld hl, entity_sprite_config
            add hl, de
            add hl, de                 ; entityIndex * 2
            ld a, (hl)                 ; base HW sprite
            inc hl
            ld c, (hl)                 ; layer count
            ld d, a                    ; D = base HW sprite (save)
            pop hl                     ; restore source

            ld a, c
            or a
            jp z, anim_done_entity     ; no layers for this entity

            ; BC = layerCount * 32
            ld a, c
            ld b, 0
            ld c, a
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b

            ; DE = SPRPAT + baseHwSprite*32
            push hl                    ; save source
            ld a, d
            ld l, a
            ld h, 0
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl                 ; HL = base * 32
            ld de, SPRPAT
            add hl, de
            ex de, hl                  ; DE = VRAM destination
            pop hl                     ; restore source

            call FAST_LDIRVM           ; copy pattern data to VRAM

anim_done_entity:
            pop hl
            pop bc

        .anim_next_entity:
            dec b
            jp nz, .anim_loop
    ret

refresh_player_animation_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    ret nz

    ld a, (player_runtime_enabled)
    push af
    ld a, (anim_entity_count)
    push af
    ld a, (anim_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (anim_entity_list), a
    ld a, 1
    ld (anim_entity_count), a
    call update_animation_component

    pop af
    ld (anim_entity_list), a
    pop af
    ld (anim_entity_count), a
    pop af                         ; Saved runtime was nonzero; force it back on.
    ld a, 1
    ld (player_runtime_enabled), a
    ret
    `, {
        id: 'runtime.components.animation',
        kind: 'routine',
        owner: 'components',
    });
}

/**
 * Generate Jump Component System
 */
function generateJumpSystem(): string {
    return wrapMideasAsmBlock(`
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ; Clear jump velocities (32 words = 64 bytes)
            ld hl, entity_jump_vel_y
            ld de, entity_jump_vel_y+1
            ld bc, 63
            ld (hl), 0
            ldir

            ; Clear jump counters
            ld hl, entity_jump_count
            ld de, entity_jump_count+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear temporary extra-jump charges granted by bonus pickups
            ld hl, entity_jump_bonus
            ld de, entity_jump_bonus+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize configured max jumps (default: single jump)
            ld hl, entity_jump_max
            ld de, entity_jump_max+1
            ld bc, 31
            ld (hl), 1
            ldir

            ; Initialize jump trigger to fire for backward compatibility
            ld hl, entity_jump_trigger
            ld de, entity_jump_trigger+1
            ld bc, 31
            ld (hl), COMP_TRIGGER_FIRE
            ldir

            ; Clear on-ground flags
            ld hl, entity_on_ground
            ld de, entity_on_ground+1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; Configured trigger edge starts jump for entities with Jump+Input
            ; Uses: entity_jump_count, entity_jump_max, entity_jump_bonus, entity_on_ground, entity_gravity_vel
            ; Uses global input_btn_curr/input_btn_prev and input_state/prev_input_state edge detection

            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                       ; Loop used entities only
            ld hl, active_entity_list

        jump_update_loop:
            ld c, (hl)                    ; C = entity index
            inc hl                        ; Advance list pointer
            push hl                       ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .jump_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .jump_skip_fast_player
        .jump_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)
            pop hl                        ; Restore list pointer
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jp z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jp z, jump_next_entity

            push bc
            push hl

            ; Ground detection is now handled by update_collision_component
            ; Just reset jump count if grounded
            ld e, c
            ld d, 0
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)                   ; Check if on ground
            jr z, .jump_check             ; Not grounded, skip reset

            ; Entity is grounded - reset jump count
            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

            ; Landing also clears any unused extra-jump bonus.
            ld hl, entity_jump_bonus
            add hl, de
            ld (hl), 0

        .jump_check:
            ld hl, entity_on_ladder
            add hl, de
            ld a, (hl)
            or a
            jp nz, jump_done_entity

            ; --- Jump trigger edge (configured trigger pressed now, not previous frame) ---
            ld hl, entity_jump_trigger
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            call component_trigger_edge_pressed_a
            jp z, jump_done_entity        ; not pressed

            ; Check jump count < configured max OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            ld e, c
            ld d, 0
            add hl, de
            ld b, (hl)
            ld hl, entity_jump_bonus
            add hl, de
            ld d, (hl)
            ld a, b
            add a, d
            ld b, a
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp b
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jp z, jump_done_entity

        .do_jump:
            ; Consume one bonus jump only when performing an airborne jump
            ; beyond the entity's base maxJumps.
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr nz, .skip_bonus_consume

            ld hl, entity_jump_count
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            add hl, de
            cp (hl)
            jr c, .skip_bonus_consume

            ld hl, entity_jump_bonus
            add hl, de
            ld a, (hl)
            or a
            jr z, .skip_bonus_consume
            dec (hl)

        .skip_bonus_consume:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; clear platform reference (prevent infinite jumps)
            ld hl, entity_platform_id
            add hl, de
            ld (hl), 255

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
            ld hl, entity_comp_masks_hi
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jp z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc
            jp jump_next_entity

        .jump_skip_fast_player:
            pop hl

        jump_next_entity:
            dec b
            jp nz, jump_update_loop
    ret
    `, {
        id: 'runtime.components.jump',
        kind: 'routine',
        owner: 'components',
    });
}

function generateAirControlHelpers(): string {
    return `
    ; ==================================================================
    ; AIR CONTROL HELPERS
    ; ==================================================================
    ; aircontrol_should_lock_horizontal_c
    ; Input: C = entity index
    ; Output: A = 1 when horizontal input must be ignored, else 0
    ; Clobbers: AF, DE, HL
    ; Preserves: BC
aircontrol_should_lock_horizontal_c:
    push bc
    ld e, c
    ld d, 0

    ; An active wall jump owns horizontal velocity while the entity is
    ; still ascending, regardless of generic air-control settings.
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #40                       ; COMP_MASK_WALL_JUMP (#4000)
    jp z, .aircontrol_check_component_lock

    ld hl, entity_walljump_locked_vx
    add hl, de
    ld a, (hl)
    or a
    jp z, .aircontrol_check_component_lock

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp nz, .aircontrol_clear_walljump_state

    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jp nz, .aircontrol_clear_walljump_state

    ld l, c
    ld h, 0
    add hl, hl
    push de
    ld de, entity_gravity_vel
    add hl, de
    pop de
    inc hl
    ld a, (hl)
    bit 7, a
    jp z, .aircontrol_clear_walljump_state

    ld a, 1
    or a
    pop bc
    ret

.aircontrol_clear_walljump_state:
    call walljump_clear_active_state_c

.aircontrol_check_component_lock:
    ; Requires both Gravity and AirControl components.
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #82                       ; COMP_MASK_AIR_CONTROL(#8000) + COMP_MASK_GRAVITY(#0200)
    cp #82
    jp nz, .aircontrol_no_lock

    ld hl, entity_aircontrol_cfg_mode
    add hl, de
    ld a, (hl)
    cp 1                          ; AIR_CONTROL_MODE_LOCKED
    jp nz, .aircontrol_no_lock

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp nz, .aircontrol_no_lock

    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jp nz, .aircontrol_no_lock

    ld a, 1
    or a
    pop bc
    ret

.aircontrol_no_lock:
    xor a
    pop bc
    ret
    `;
}

function generateWallGrabSystem(enableDirectWallProbe: boolean = false): string {
    return `
    ; ==================================================================
    ; WALL GRAB COMPONENT SYSTEM
    ; ==================================================================
    ; Holds the entity against a wall while INPUT_BTN_GRAB is held.
    ; Runs after Gravity and before WallJump/Position.

init_wallgrab_system:
    ld hl, entity_wallgrab_active
    ld de, entity_wallgrab_active+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_wallgrab_grace
    ld de, entity_wallgrab_grace+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_wallgrab_timer
    ld de, entity_wallgrab_timer+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_wallgrab_lockout
    ld de, entity_wallgrab_lockout+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir
    ret

update_wallgrab_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.wallgrab_loop:
    ld c, (hl)
    inc hl
    push hl
    ld a, (player_runtime_enabled)
    or a
    jr z, .wallgrab_process
    ld a, (player_entity_index)
    cp c
    jr z, .wallgrab_next
.wallgrab_process:
    push bc
    call wallgrab_process_entity_c
    pop bc
.wallgrab_next:
    pop hl
    djnz .wallgrab_loop
    ret

refresh_player_wallgrab_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a

    call wallgrab_process_entity_c
    ret

wallgrab_process_entity_c:
    ld e, c
    ld d, 0

    ld hl, entity_wallgrab_cfg_enabled
    add hl, de
    ld a, (hl)
    or a
    ret z

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; Require Gravity component
    ret z

    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    jp nz, .wallgrab_after_ground_check

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp nz, .grounded_clear_lockout

.wallgrab_after_ground_check:

    ld hl, entity_wallgrab_lockout
    add hl, de
    ld a, (hl)
    or a
    jp nz, .not_grabbing

    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jp nz, .not_grabbing

    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .not_grabbing

    call wallgrab_input_toward_wall_c
    or a
    jp z, .maybe_keep_grabbing
    call wallgrab_set_facing_dir_a

    ; --- Grabbing! ---
    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    jp nz, .ensure_grab_sprite

    ; Transition to grabbing
    ld (hl), 1
    call wallgrab_reset_grace_c
    call wallgrab_ensure_timer_c
    call wallgrab_commit_grab_sprite_if_needed_c
    jp .apply_physics

.ensure_grab_sprite:
    call wallgrab_reset_grace_c
    call wallgrab_commit_grab_sprite_if_needed_c
    jp .apply_physics

.maybe_keep_grabbing:
    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .not_grabbing

    ld hl, entity_wallgrab_grace
    add hl, de
    ld a, (hl)
    or a
    jp z, .not_grabbing
    dec (hl)
    call wallgrab_commit_grab_sprite_if_needed_c
    jp .apply_physics

.grounded_clear_lockout:
    ld hl, entity_wallgrab_lockout
    add hl, de
    ld (hl), 0
    ld hl, entity_wallgrab_timer
    add hl, de
    ld (hl), 0
    jp .not_grabbing

wallgrab_reset_grace_c:
    ; Input: DE = entity offset
    ; Clobbers: AF, HL. Preserves: BC, DE.
    ld hl, entity_wallgrab_grace
    add hl, de
    ld (hl), 2
    ret

wallgrab_ensure_timer_c:
    ; Input: DE = entity offset
    ; Clobbers: AF, HL. Preserves: BC, DE.
    ld hl, entity_wallgrab_timer
    add hl, de
    ld a, (hl)
    or a
    ret nz
    call wallgrab_reset_timer_c
    ret

wallgrab_reset_timer_c:
    ; Input: DE = entity offset
    ; Clobbers: AF, HL. Preserves: BC, DE.
    ld hl, entity_wallgrab_cfg_duration_frames
    add hl, de
    ld a, (hl)
    ld hl, entity_wallgrab_timer
    add hl, de
    ld (hl), a
    ret

wallgrab_input_toward_wall_c:
    ; Input: DE = entity offset
    ; Output: A = 0 none, 1 touching left wall, 2 touching right wall
    ; Clobbers: AF, HL. Preserves: BC, DE.
${enableDirectWallProbe ? `    ; Prefer a fresh adjacent-wall probe over previous-frame flags.
    jp .wg_probe_adjacent_wall
` : ''}
    ld hl, entity_wall_collision_flags
    add hl, de
    ld h, (hl)                     ; H = wall flags (bit2 LEFT, bit3 RIGHT)

    ld a, h
    and #04
    jp z, .wg_check_right_wall
    ld a, 1                        ; facing left
    ret

.wg_check_right_wall:
    ld a, h
    and #08
    jp z, .wg_probe_adjacent_wall
    ld a, 2                        ; facing right
    ret

${enableDirectWallProbe ? `
.wg_probe_adjacent_wall:
    ; WallGrab runs before WallCollision, so the directional flags can be
    ; empty when the player only holds GRAB with no horizontal movement.
    ; Probe the current hitbox edges directly against the behavior map.
    push bc

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a
    call wall_build_hitbox_cache

    ; Left wall: sample one pixel before the hitbox left edge.
    ld a, (wall_hit_left)
    or a
    jr z, .wg_probe_right_wall
    sub 1
    srl a
    srl a
    srl a
    ld c, a

    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jr nz, .wg_touch_left_wall

    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jr nz, .wg_touch_left_wall

.wg_probe_right_wall:
    ; Right wall: sample one pixel after the hitbox right edge.
    ld a, (wall_hit_right)
    inc a
    jr z, .wg_no_probe_wall
    srl a
    srl a
    srl a
    ld c, a

    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jr nz, .wg_touch_right_wall

    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jr nz, .wg_touch_right_wall

.wg_no_probe_wall:
    pop bc
    xor a
    ret

.wg_touch_left_wall:
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)
    pop bc
    ld a, 1
    ret

.wg_touch_right_wall:
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)
    pop bc
    ld a, 2
    ret
` : `
.wg_probe_adjacent_wall:
    xor a
    ret
`}

wallgrab_set_facing_dir_a:
    ; Input: A = 1 left or 2 right, DE = entity offset
    ; Clobbers: AF, HL. Preserves: BC, DE.
    cp 1
    jp z, .wg_write_facing
    cp 2
    ret nz
.wg_write_facing:
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    ret

wallgrab_commit_grab_sprite_if_needed_c:
    ; Input: C = entity index, DE = entity offset
    ; Clobbers: AF, BC, HL. Preserves: DE.
    ld hl, entity_wallgrab_cfg_grab_sprite
    add hl, de
    ld a, (hl)
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc

    push de
    call wallgrab_resolve_directional_sprite_c
    pop de
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld b, a                       ; B = resolved grab sprite asset index

    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (hl)
    cp b
    jr z, .refresh_grab_sprite    ; Keep runtime colors/frame bounds coherent.

    push de
    ld a, b
    call wallgrab_resolve_grab_loop_flag_c
    call wallgrab_commit_sprite_c
    pop de
    ret

.refresh_grab_sprite:
    push de
    ld a, b
    call wallgrab_resolve_grab_loop_flag_c
    call wallgrab_refresh_sprite_c
    pop de
    ret

wallgrab_resolve_grab_loop_flag_c:
    ; Input: A = grab sprite asset index
    ; Output: E = loop flag (#00/#02). Vertical grab input forces loop.
    ; Clobbers: F, D, HL. Preserves: A, BC.
    push af
    ld e, a
    ld d, 0
    ld hl, sprite_loop_flags
    add hl, de
    ld e, (hl)                    ; Native loop flag unless climbing.
    ld a, (input_state)
    cp STICK_UP
    jp z, .wg_grab_force_loop
    cp STICK_UPRIGHT
    jp z, .wg_grab_force_loop
    cp STICK_UPLEFT
    jp z, .wg_grab_force_loop
    cp STICK_DOWN
    jp z, .wg_grab_force_loop
    cp STICK_DOWNRIGHT
    jp z, .wg_grab_force_loop
    cp STICK_DOWNLEFT
    jp z, .wg_grab_force_loop
    pop af
    ret
.wg_grab_force_loop:
    ld e, ANIM_FLAG_LOOP
    pop af
    ret

wallgrab_restore_base_sprite_c:
    ; Input: C = entity index, DE = entity offset
    ; Clobbers: AF, BC, HL. Preserves: DE.
    ld b, 0
    ld hl, entity_sprite_asset_index_init
    add hl, bc
    ld a, (hl)
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc

    push de
    call wallgrab_resolve_directional_sprite_c
    pop de
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc

    push de
    push af
    ld e, a
    ld d, 0
    ld hl, sprite_loop_flags
    add hl, de
    ld e, (hl)                    ; Native loop flag for restored sprite.
    pop af
    call wallgrab_commit_sprite_c
    pop de
    ret

wallgrab_resolve_directional_sprite_c:
    ; Input: C = entity index, A = base sprite asset
    ; Output: A = direction-resolved sprite asset
    ; Clobbers: AF, B, DE, HL. Preserves: C.
    ld b, a
    ld h, 0
    ld l, c
    ld de, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    jp z, .wg_resolve_left
    cp 2
    jp z, .wg_resolve_right
    ld a, b
    ret

.wg_resolve_left:
    ld hl, sprite_dir_left_table
    jp .wg_resolve_lookup

.wg_resolve_right:
    ld hl, sprite_dir_right_table

.wg_resolve_lookup:
    ld e, b
    ld d, 0
    add hl, de
    ld a, (hl)
    ret

wallgrab_commit_sprite_c:
    ; Input: C = entity index, A = sprite asset index, E = loop flag (#00/#02)
    ; Clobbers: AF, BC, DE, HL
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld d, a                        ; D = sprite asset index
    ld b, 0

    ld hl, entity_sprite_asset_index
    add hl, bc
    ld (hl), d

    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0

    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0

    ld hl, entity_anim_flags
    add hl, bc
    ld a, ANIM_FLAG_PLAYING | ANIM_FLAG_FORCE_UPLOAD
    or e
    ld (hl), a

    ld a, d
    jp wallgrab_update_sprite_colors_c

wallgrab_refresh_sprite_c:
    ; Input: C = entity index, A = sprite asset index, E = loop flag (#00/#02)
    ; Preserves current frame/tick unless the frame is outside this sprite's range.
    ; Clobbers: AF, BC, DE, HL
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld d, a                        ; D = sprite asset index
    ld b, 0

    ld hl, entity_sprite_asset_index
    add hl, bc
    ld (hl), d

    push de                         ; Save sprite asset + loop flag.
    ld e, d
    ld d, 0
    ld hl, sprite_asset_frame_count
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wg_refresh_frame_count_ready
    ld a, 1
.wg_refresh_frame_count_ready:
    ld b, a                         ; B = frame count
    ld h, 0
    ld l, c
    ld de, entity_anim_frame
    add hl, de
    ld a, (hl)
    cp b
    jr c, .wg_refresh_frame_ok
    ld (hl), 0
.wg_refresh_frame_ok:
    ld b, 0
    pop de                          ; D = sprite asset index, E = loop flag

    ld hl, entity_anim_flags
    add hl, bc
    ld a, ANIM_FLAG_PLAYING
    or e
    ld (hl), a

    ld a, d
    jp wallgrab_update_sprite_colors_c

wallgrab_update_sprite_colors_c:
    ; Input: C = entity index, A = sprite asset index
    ; Clobbers: AF, BC, DE, HL
    ld d, a
    ; Keep per-layer runtime colors in sync with the temporary grab sprite.
    push bc
    push de
    push de
    ld h, 0
    ld l, c
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld c, (hl)                     ; C = base HW sprite slot
    pop de                         ; D = sprite asset index

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.wg_commit_mul_layers:
    add hl, de
    djnz .wg_commit_mul_layers
    ld de, SM_SpriteLayerColorTable
    add hl, de

    ld b, SPRITE_MAX_ENTITY_LAYERS
.wg_commit_color_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_colors
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz .wg_commit_color_loop

    pop de                          ; D = sprite asset index
    pop bc                          ; C = entity index

    ; Keep per-layer Y offsets in sync with the same temporary sprite.
    push de
    ld h, 0
    ld l, c
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld c, (hl)                     ; C = base HW sprite slot
    pop de                         ; D = sprite asset index

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.wg_commit_y_offset_mul_layers:
    add hl, de
    djnz .wg_commit_y_offset_mul_layers
    ld de, SM_SpriteLayerYOffsetTable
    add hl, de

    ld b, SPRITE_MAX_ENTITY_LAYERS
.wg_commit_y_offset_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_y_offsets
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz .wg_commit_y_offset_loop
    ret

.apply_physics:
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0

    call wallgrab_choose_vertical_velocity_c

    ld hl, entity_vel_y
    add hl, de
    ld (hl), b

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), b
    call wallgrab_tick_timer_c
    or a
    ret nz
    jp .not_grabbing

wallgrab_tick_timer_c:
    ; Input: DE = entity offset
    ; Output: A = 1 if the grab can continue, 0 if the timer expired
    ; Clobbers: AF, HL. Preserves: BC, DE.
    ld hl, entity_wallgrab_timer
    add hl, de
    ld a, (hl)
    or a
    jp z, .wg_timer_expired
    dec (hl)
    ld a, 1
    ret

.wg_timer_expired:
    ld hl, entity_wallgrab_lockout
    add hl, de
    ld (hl), 1
    xor a
    ret

wallgrab_choose_vertical_velocity_c:
    ; Input: DE = entity offset
    ; Output: B = signed vertical velocity for this grab frame
    ; Clobbers: AF, HL. Preserves: DE.
    ld a, (input_state)
    cp STICK_UP
    jp z, .wg_climb_up
    cp STICK_UPRIGHT
    jp z, .wg_climb_up
    cp STICK_UPLEFT
    jp z, .wg_climb_up
    cp STICK_DOWN
    jp z, .wg_climb_down
    cp STICK_DOWNRIGHT
    jp z, .wg_climb_down
    cp STICK_DOWNLEFT
    jp z, .wg_climb_down
    jp .wg_stop_vertical

.wg_climb_up:
    ld hl, entity_wallgrab_cfg_climb_speed
    add hl, de
    ld a, (hl)
    or a
    jp z, .wg_stop_vertical
    neg
    ld b, a
    ret

.wg_climb_down:
    ld hl, entity_wallgrab_cfg_climb_speed
    add hl, de
    ld a, (hl)
    or a
    jp z, .wg_stop_vertical
    ld b, a
    ret

.wg_stop_vertical:
    ld b, 0
    ret

.not_grabbing:
    ld hl, entity_wallgrab_active
    add hl, de
    ld a, (hl)
    or a
    ret z                         ; was not grabbing

    ; Transition to NOT grabbing
    ld (hl), 0
    ld hl, entity_wallgrab_grace
    add hl, de
    ld (hl), 0

    ; If a wall-jump one-shot animation has taken ownership, do not restore
    ; the base sprite here or it will immediately overwrite that animation.
    ld hl, entity_walljump_anim_active
    add hl, de
    ld a, (hl)
    or a
    ret nz
    
    ; Restore original sprite without sharing WallJump animation helpers.
    ld c, e
    call wallgrab_restore_base_sprite_c
    ret
    `;
}

function generateWallJumpSystem(): string {
    return `
    ; ==================================================================
    ; WALL JUMP COMPONENT SYSTEM
    ; ==================================================================
    ; Uses wall flags produced by the previous WallCollision pass.
    ; Runs after Gravity and before Position so slide/jump impulses affect
    ; the current frame movement without being overwritten by gravity.

init_walljump_system:
    ld hl, entity_walljump_lock
    ld de, entity_walljump_lock+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_walljump_locked_vx
    ld de, entity_walljump_locked_vx+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_walljump_anim_active
    ld de, entity_walljump_anim_active+1
    ld bc, 31
    xor a
    ld (hl), a
    ldir
    ret

update_walljump_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.walljump_loop:
    ld c, (hl)
    inc hl
    push hl
    ld a, (player_runtime_enabled)
    or a
    jp z, .walljump_check_mask
    ld a, (player_entity_index)
    cp c
    jp z, .walljump_skip_fast_player
.walljump_check_mask:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl
    and #40                       ; COMP_MASK_WALL_JUMP (#4000) => high byte bit 6
    jp z, .walljump_next

    push bc
    push hl
    call walljump_process_entity_c
    pop hl
    pop bc
    jp .walljump_next

.walljump_skip_fast_player:
    pop hl

.walljump_next:
    dec b
    jp nz, .walljump_loop
    ret

; ------------------------------------------------------------------
; walljump_process_entity_c
; Input: C = entity index
; Output: none
; Clobbers: AF, BC, DE, HL
; ------------------------------------------------------------------
walljump_process_entity_c:
    ld b, 0

    ld hl, entity_walljump_cfg_enabled
    add hl, bc
    ld a, (hl)
    or a
    ret z

    call walljump_restore_animation_if_done_c
    ld b, 0

    ld hl, entity_on_ground
    add hl, bc
    bit 0, (hl)
    jp z, .walljump_airborne
    call walljump_clear_active_state_c
    ret

.walljump_airborne:
    ld hl, entity_on_ladder
    add hl, bc
    ld a, (hl)
    or a
    jp z, .walljump_check_locked_impulse
    call walljump_clear_active_state_c
    ret

    ; Keep the horizontal wall-jump impulse alive for the whole ascent.
    ; lock_frames is now only the minimum guaranteed duration.
.walljump_check_locked_impulse:
    ; The Jump component can clear entity_on_ground earlier in this same
    ; frame. If the previous WallCollision pass still says DOWN, this was a
    ; ground jump beside a wall, not a valid wall jump.
    ld hl, entity_wall_collision_flags
    add hl, bc
    bit 1, (hl)
    jp z, .walljump_check_locked_vx
    call walljump_clear_active_state_c
    ret

.walljump_check_locked_vx:
    ld hl, entity_walljump_locked_vx
    add hl, bc
    ld a, (hl)
    or a
    jp z, .walljump_check_wall_flags
    push af

    ld l, c
    ld h, 0
    add hl, hl
    ld de, entity_gravity_vel
    add hl, de
    inc hl
    ld a, (hl)
    bit 7, a
    jp nz, .walljump_restore_locked_impulse
    pop af
    jp .walljump_clear_locked_impulse

.walljump_restore_locked_impulse:
    pop af
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), a
    ld hl, entity_walljump_lock
    add hl, bc
    ld a, (hl)
    or a
    jp z, .walljump_check_wall_flags
    dec (hl)
    jp .walljump_check_wall_flags

.walljump_clear_locked_impulse:
    call walljump_clear_active_state_c

.walljump_check_wall_flags:
    ld hl, entity_wall_collision_flags
    add hl, bc
    ld a, (hl)
    and #0C
    ret z
    ld e, a                       ; E = wall flags (bits 2/3)

    ; Optional wall slide: clamp fall speed while touching a wall.
    ld hl, entity_walljump_cfg_slide_fall_speed
    add hl, bc
    ld a, (hl)
    or a
    jr z, .walljump_check_jump
    ld d, a                       ; D = slide cap
    ld hl, entity_vel_y
    add hl, bc
    ld a, (hl)
    bit 7, a
    jr nz, .walljump_check_jump   ; moving up -> don't clamp
    cp d
    jr c, .walljump_check_jump
    jr z, .walljump_check_jump
    ld (hl), d
    ld hl, entity_gravity_vel
    add hl, bc
    add hl, bc
    ld (hl), 0
    inc hl
    ld (hl), d

.walljump_check_jump:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    ret z
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    ret nz

    ld hl, entity_walljump_cfg_require_away
    add hl, bc
    ld a, (hl)
    or a
    jr z, .walljump_select_free

    ld a, e
    bit 2, a
    jr z, .walljump_require_right_wall
    call walljump_input_is_right
    or a
    jr nz, .walljump_from_left
.walljump_require_right_wall:
    ld a, e
    bit 3, a
    ret z
    call walljump_input_is_left
    or a
    jr nz, .walljump_from_right
    ret

.walljump_select_free:
    ld a, e
    bit 2, a
    jr z, .walljump_select_right_only
    bit 3, a
    jr z, .walljump_from_left
    call walljump_input_is_right
    or a
    jr nz, .walljump_from_left
    call walljump_input_is_left
    or a
    jr nz, .walljump_from_right
    jr .walljump_from_left

.walljump_select_right_only:
    ld a, e
    bit 3, a
    ret z
    jr .walljump_from_right

.walljump_from_left:
    ld hl, entity_walljump_cfg_horizontal_push
    add hl, bc
    ld a, (hl)
    ld d, a
    jr .walljump_apply

.walljump_from_right:
    ld hl, entity_walljump_cfg_horizontal_push
    add hl, bc
    ld a, (hl)
    neg
    ld d, a

.walljump_apply:
    ld hl, entity_vel_x
    add hl, bc
    ld (hl), d
    ld hl, entity_walljump_locked_vx
    add hl, bc
    ld (hl), d
    ld a, d
    bit 7, a
    jr z, .walljump_face_right
    ld a, 1                       ; FACING_LEFT: jumped away from a right wall
    jr .walljump_store_facing
.walljump_face_right:
    ld a, 2                       ; FACING_RIGHT: jumped away from a left wall
.walljump_store_facing:
    ld hl, entity_facing_dir
    add hl, bc
    ld (hl), a

    ; Detach the hitbox from the wall immediately so the rebound has
    ; a visible opposite push from the first frame.
    ld a, d
    or a
    jr z, .walljump_store_lock
    ld hl, entity_x_pos
    add hl, bc
    bit 7, a
    jr z, .walljump_detach_right
    dec (hl)
    jr .walljump_store_lock
.walljump_detach_right:
    inc (hl)

.walljump_store_lock:
    ld hl, entity_walljump_cfg_lock_frames
    add hl, bc
    ld a, (hl)
    ld hl, entity_walljump_lock
    add hl, bc
    ld (hl), a

    ld l, c
    ld h, 0
    add hl, hl
    ld de, entity_walljump_cfg_vertical_impulse
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    push de
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    pop de
    ld (hl), e
    inc hl
    ld (hl), d

    ld a, d
    ld e, c
    ld d, 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255
    call walljump_start_jump_animation_c
    ret

; ------------------------------------------------------------------
; walljump_restore_animation_if_done_c
; Input: C = entity index
; Restores the entity's base directional sprite after the configured
; wall-jump one-shot animation reaches ANIM_FLAG_COMPLETED.
; Clobbers: AF, BC, DE, HL
; ------------------------------------------------------------------
walljump_restore_animation_if_done_c:
    ld b, 0
    ld hl, entity_walljump_anim_active
    add hl, bc
    ld a, (hl)
    or a
    ret z

    ld hl, entity_anim_flags
    add hl, bc
    bit 3, (hl)                    ; ANIM_FLAG_COMPLETED
    ret z
    res 3, (hl)

    ld hl, entity_walljump_anim_active
    add hl, bc
    xor a
    ld (hl), a

    ld hl, entity_sprite_asset_index_init
    add hl, bc
    ld a, (hl)
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld d, a                        ; D = base sprite asset

    ld hl, entity_facing_dir
    add hl, bc
    ld a, (hl)
    cp 1
    jp z, wj_anim_restore_left
    cp 2
    jp z, wj_anim_restore_right
    ld a, d
    jp wj_anim_restore_commit

wj_anim_restore_left:
    ld hl, sprite_dir_left_table
    jp wj_anim_restore_lookup

wj_anim_restore_right:
    ld hl, sprite_dir_right_table

wj_anim_restore_lookup:
    ld e, d
    ld d, 0
    add hl, de
    ld a, (hl)

wj_anim_restore_commit:
    push af
    ld e, a
    ld d, 0
    ld hl, sprite_loop_flags
    add hl, de
    ld e, (hl)                     ; Native loop flag for restored sprite
    pop af
    call walljump_commit_sprite_c
    ret

; ------------------------------------------------------------------
; walljump_start_jump_animation_c
; Input: C = entity index
; Starts the configured wall-jump animation as a one-shot. #FF means none.
; Clobbers: AF, BC, DE, HL
; ------------------------------------------------------------------
walljump_start_jump_animation_c:
    ld b, 0
    ld hl, entity_walljump_cfg_animation_sprite
    add hl, bc
    ld a, (hl)
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    push af
    ld hl, entity_walljump_anim_active
    add hl, bc
    ld (hl), 1
    pop af
    ld e, 0                        ; Force one-shot so completion restores base facing
    call walljump_commit_sprite_c
    ret

; ------------------------------------------------------------------
; walljump_commit_sprite_c
; Input: C = entity index, A = sprite asset index, E = loop flag (#00/#02)
; Clobbers: AF, BC, DE, HL
; ------------------------------------------------------------------
walljump_commit_sprite_c:
    cp #FF
    ret z
    cp SPRITE_ASSET_COUNT
    ret nc
    ld d, a                        ; D = sprite asset index
    ld b, 0

    ld hl, entity_sprite_asset_index
    add hl, bc
    ld (hl), d

    ld hl, entity_anim_frame
    add hl, bc
    ld (hl), 0

    ld hl, entity_anim_tick
    add hl, bc
    ld (hl), 0

    ld hl, entity_anim_flags
    add hl, bc
    ld a, ANIM_FLAG_PLAYING | ANIM_FLAG_FORCE_UPLOAD
    or e
    ld (hl), a

    ; Update runtime layer colors so the temporary animation and restored
    ; sprite render with their own palette immediately.
    push bc
    push de
    push de
    ld h, 0
    ld l, c
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld c, (hl)                     ; C = base HW sprite slot
    pop de                         ; D = sprite asset index

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
wj_commit_mul_layers:
    add hl, de
    djnz wj_commit_mul_layers
    ld de, SM_SpriteLayerColorTable
    add hl, de

    ld b, SPRITE_MAX_ENTITY_LAYERS
wj_commit_color_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_colors
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz wj_commit_color_loop

    pop de                         ; D = sprite asset index
    pop bc                         ; C = entity index

    ; Update runtime layer Y offsets alongside colors.
    push de
    ld h, 0
    ld l, c
    add hl, hl
    ld de, entity_sprite_config
    add hl, de
    ld c, (hl)                     ; C = base HW sprite slot
    pop de                         ; D = sprite asset index

    ld l, d
    ld h, 0
    ld e, l
    ld d, h
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
wj_commit_y_offset_mul_layers:
    add hl, de
    djnz wj_commit_y_offset_mul_layers
    ld de, SM_SpriteLayerYOffsetTable
    add hl, de

    ld b, SPRITE_MAX_ENTITY_LAYERS
wj_commit_y_offset_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc
    ld h, 0
    ld l, c
    ld de, sprite_layer_y_offsets
    add hl, de
    ld (hl), a
    pop bc
    pop hl
    inc c
    djnz wj_commit_y_offset_loop
    ret

walljump_clear_active_state_c:
    push de
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_walljump_lock
    add hl, de
    ld (hl), a
    ld hl, entity_walljump_locked_vx
    add hl, de
    ld (hl), a
    pop de
    ret

walljump_input_is_left:
    ld a, (input_state)
    cp STICK_DOWNLEFT
    jr c, .walljump_input_left_false
    cp 9
    jr c, .walljump_input_left_true
.walljump_input_left_false:
    xor a
    ret
.walljump_input_left_true:
    ld a, 1
    ret

walljump_input_is_right:
    ld a, (input_state)
    cp STICK_UPRIGHT
    jr c, .walljump_input_right_false
    cp STICK_DOWN
    jr c, .walljump_input_right_true
.walljump_input_right_false:
    xor a
    ret
.walljump_input_right_true:
    ld a, 1
    ret
    `;
}

/**
 * Generate Auto-Destroy Component System
 */
function generateAutoDestroySystem(): string {
    return `
    ; ==================================================================
    ; AUTO-DESTROY COMPONENT SYSTEM
    ; ==================================================================
    ; Entities with AUTO_DESTROY component have a lifetime counter
    ; When lifetime reaches 0, entity is automatically destroyed
    ; Useful for: projectiles and other temporary effects.

init_auto_destroy_system:
    ; Initialize all lifetimes to 0 (infinite by default)
    ld hl, entity_lifetime
    ld de, entity_lifetime+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

update_auto_destroy_component:
    ; Update lifetime counters and destroy entities when expired
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop used entities only
    ld hl, active_entity_list

    auto_destroy_loop:
        ld c, (hl)                    ; C = entity index
        inc hl                        ; Advance list pointer
        push hl                       ; Save list pointer
        ld e, c
        ld d, 0
        ld hl, entity_comp_masks_hi
        add hl, de
        ld a, (hl)
        pop hl                        ; Restore list pointer
        and #04                       ; AUTO_DESTROY bit (COMP_MASK_AUTO_DESTROY=#0400 -> high byte bit2)
        jr z, auto_destroy_next

        ; Entity has auto-destroy component
        push bc
        push hl

        ; Get lifetime for this entity
        ld e, c                       ; Entity index
        ld d, 0
        ld hl, entity_lifetime
        add hl, de
        ld a, (hl)                    ; A = lifetime

        ; Check if lifetime is 0 (infinite) or > 0
        or a
        jr z, auto_destroy_done       ; 0 = infinite lifetime, skip

        ; Decrement lifetime
        dec a
        ld (hl), a                    ; Store decremented value

        ; Check if lifetime reached 0
        or a
        jr nz, auto_destroy_done      ; Still alive

        ; Lifetime expired - destroy entity
        ; Clear component masks (deactivates entity)
        ld hl, entity_comp_masks
        ld e, c
        ld d, 0
        add hl, de
        ld (hl), 0                    ; Clear low byte

        ld hl, entity_comp_masks_hi
        add hl, de
        ld (hl), 0                    ; Clear high byte
        ld hl, active_entity_list_dirty
        ld (hl), 1

        ; Move entity off-screen
        ld hl, entity_x_pos
        add hl, de
        ld (hl), 255                  ; X = off-screen

        ld hl, entity_y_pos
        add hl, de
        ld (hl), 212                  ; Y = below screen (192 + 20)

auto_destroy_done:
        pop hl
        pop bc

auto_destroy_next:
        dec b
        jp nz, auto_destroy_loop
        ret
    `;
}

/**
 * Generate Cursors Component System
 * For menu navigation and cursor control
 */
function generateCursorsSystem(): string {
    return `
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; NOTE:
    ; This system is intentionally disabled in runtime gameplay.
    ; Directional movement is already handled by update_input_component.
    ; Keeping cursor movement here causes double movement/jitter.

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Disabled no-op (reserved for future menu-only cursor implementation)
; ------------------------------------------------------------------
update_cursors_component:
    ret
    `;
}

/**
 * Generate Carry Component System
 * For entities that carry other entities (like picking up items)
 */
function generateCarrySystem(analysis: ProjectAnalysis, targetFormat: string, romMode: string): string {
    const runtimeData = buildCarryRuntimeData(analysis);
    const hideSpriteCall = usesMapperBanking(romMode) ? 'call_hide_sprite_resident' : 'hide_sprite';
    return wrapMideasAsmBlock(applyMapperDataWindowPage(`
    ; ==================================================================
    ; CARRY COMPONENT SYSTEM
    ; ==================================================================
    ; Action2 toggles pickup/drop for comp_carry entities.
    ; Boxes can exist as sprites while carried and as map tiles when dropped.

${runtimeData.dataAsm}

init_carry_system:
    ld a, 255
    ld hl, entity_carried_by
    call component_fill_32_a
    ld hl, entity_carry_held
    call component_fill_32_a
    ld hl, entity_carry_base_sprite
    call component_fill_32_a

    xor a
    ld hl, entity_box_state
    call component_fill_32_a
    ld hl, entity_box_tile_x
    call component_fill_32_a
    ld hl, entity_box_tile_y
    call component_fill_32_a
    ld hl, entity_box_restore_valid
    call component_fill_32_a
    ret

; ------------------------------------------------------------------
; update_carry_component
; Update carried positions, then react to one Action2 edge per frame.
; ------------------------------------------------------------------
update_carry_component:
    call carry_update_followers
    ld a, COMP_TRIGGER_ACTION2
    call component_trigger_edge_pressed_a
    ret z
    jp carry_handle_action

; ------------------------------------------------------------------
; carry_sync_current_screen_followers
; Move carried entities into the current screen before room buckets rebuild.
; This makes carrying a box from screen1 to screen2 a real ownership move.
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------------
carry_sync_current_screen_followers:
    ld c, 0

.sync_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ld e, c
    ld d, 0
    ld hl, entity_carried_by
    add hl, de
    ld a, (hl)
    cp 255
    jr z, .sync_next

    ld b, a                       ; B = carrier ID, C = carried entity
    ld e, b
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .sync_next

    ld a, (current_screen_id)
    ld e, c
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    cp (hl)
    jr z, .sync_next
    ld (hl), a
    ld a, 1
    ld (active_entity_list_dirty), a

.sync_next:
    inc c
    jr .sync_loop

; ------------------------------------------------------------------
; carry_apply_dropped_box_tiles_current_screen
; Rewrites tile-materialized boxes after a screen reload. Dropped boxes
; are persistent runtime state, while screen loaders rebuild the base map.
; Clobbers AF, BC, DE, HL.
; ------------------------------------------------------------------
carry_apply_dropped_box_tiles_current_screen:
    ld c, 0

.apply_box_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ld e, c
    ld d, 0
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    cp BOX_STATE_DROPPED_TILE
    jp nz, .apply_box_next

    ld hl, entity_screen_id
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .apply_box_next

    ld hl, entity_box_tile_width_init
    add hl, de
    ld a, (hl)
    or a
    jp z, .apply_box_next
    ld (carry_tmp_byte_7), a

    ld hl, entity_box_tile_height_init
    add hl, de
    ld a, (hl)
    or a
    jp z, .apply_box_next
    ld (carry_tmp_byte_8), a

    ld hl, entity_box_tile_x
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_5), a

    ld hl, entity_box_tile_y
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_6), a

    ld a, c
    ld (carry_tmp_byte_2), a
    push bc
    call carry_write_box_tiles
    call carry_hide_materialized_box_sprites
    pop bc

.apply_box_next:
    inc c
    jp .apply_box_loop

carry_handle_action:
    ld c, 0                       ; C = carrier candidate

.carrier_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ld e, c
    ld d, 0
    ld hl, entity_carry_enabled_init
    add hl, de
    ld a, (hl)
    or a
    jp z, .carrier_next

    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .carrier_next

    ld hl, entity_screen_id
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .carrier_next

    ld hl, entity_carry_held
    add hl, de
    ld a, (hl)
    cp 255
    jp z, carry_try_pickup_box

    ld b, a                       ; B = currently held box
    jp carry_drop_box

.carrier_next:
    inc c
    jp .carrier_loop

carry_try_pickup_box:
    ld b, 0                       ; B = box candidate

.box_loop:
    ld a, b
    cp MAX_ENTITIES
    ret z

    ld e, b
    ld d, 0
    ld hl, entity_box_carriable_init
    add hl, de
    ld a, (hl)
    or a
    jp z, .box_next

    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .box_next

    ld hl, entity_screen_id
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .box_next

    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    cp BOX_STATE_CARRIED
    jp z, .box_next

    push bc
    call carry_box_in_reach
    pop bc
    or a
    jp z, .box_next

    jp carry_pickup_box

.box_next:
    inc b
    jp .box_loop

; Input: C = carrier, B = box. Output: A=1 when close enough.
carry_box_in_reach:
    push bc

    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_1), a           ; carrier X
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_2), a           ; carrier Y

    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, carry_tmp_byte_1
    sub (hl)
    jp nc, .dx_ready
    neg
.dx_ready:
    cp 25
    jp nc, .not_in_reach

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, carry_tmp_byte_2
    sub (hl)
    jp nc, .dy_ready
    neg
.dy_ready:
    cp 33
    jp nc, .not_in_reach

    pop bc
    ld a, 1
    or a
    ret

.not_in_reach:
    pop bc
    xor a
    ret

carry_pickup_box:
    ld a, b
    ld (carry_tmp_byte_2), a           ; box index for hide/update helpers

    ; If the box is currently materialized as tiles, erase those cells first.
    ld e, b
    ld d, 0
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    cp BOX_STATE_DROPPED_TILE
    jr nz, .pickup_state_ready
    push bc
    call carry_clear_box_tiles_for_b
    pop bc

.pickup_state_ready:
    ld e, c
    ld d, 0
    ld hl, entity_carry_held
    add hl, de
    ld (hl), b

    ld e, b
    ld d, 0
    ld hl, entity_carried_by
    add hl, de
    ld (hl), c

    ld a, (current_screen_id)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a

    ld hl, entity_box_state
    add hl, de
    ld (hl), BOX_STATE_CARRIED
    call carry_hide_materialized_box_sprites

    xor a
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), a
    ld hl, entity_collides_with
    add hl, de
    ld (hl), a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    call carry_apply_carrier_sprite
    ret

carry_drop_box:
    ; Input C = carrier, B = box.
    ld a, c
    ld (carry_tmp_byte_1), a           ; carrier index
    ld a, b
    ld (carry_tmp_byte_2), a           ; box index

    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_3), a           ; drop pixel X

    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1                          ; 1 = left
    jr z, .drop_left

.drop_right:
    ld a, (carry_tmp_byte_3)
    add a, 16
    jp c, carry_drop_box_blocked
    jr .drop_x_ready

.drop_left:
    ld a, (carry_tmp_byte_3)
    sub 16
    jp c, carry_drop_box_blocked

.drop_x_ready:
    ld (carry_tmp_byte_3), a
    ld h, a
    srl a
    srl a
    srl a
    ld (carry_tmp_byte_5), a           ; tile X
    ld a, h

    ld a, (carry_tmp_byte_1)
    ld e, a
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_4), a           ; drop pixel Y
    srl a
    srl a
    srl a
    ld (carry_tmp_byte_6), a           ; tile Y

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_tile_width_init
    add hl, de
    ld a, (hl)
    or a
    jp z, carry_drop_box_as_sprite
    ld (carry_tmp_byte_7), a           ; matrix width

    ld hl, entity_box_tile_height_init
    add hl, de
    ld a, (hl)
    or a
    jp z, carry_drop_box_as_sprite
    ld (carry_tmp_byte_8), a           ; matrix height

    call carry_can_place_box_tiles
    or a
    jp z, carry_drop_box_blocked
    ld (carry_tmp_byte_15), a          ; 1 = clear/no support, 2 = clear/supported

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (carry_tmp_byte_3)
    ld (hl), a
    ld hl, entity_y_pos
    add hl, de
    ld a, (carry_tmp_byte_4)
    ld (hl), a

    ld a, (carry_tmp_byte_15)
    cp 2
    jp nz, carry_drop_box_as_sprite

    ; Gravity boxes must re-enter the physics path when dropped. They will
    ; materialize as tiles from WallCollision once they actually touch floor.
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, carry_drop_box_as_sprite

    ld hl, entity_box_tile_x
    add hl, de
    ld a, (carry_tmp_byte_5)
    ld (hl), a
    ld hl, entity_box_tile_y
    add hl, de
    ld a, (carry_tmp_byte_6)
    ld (hl), a

    call carry_write_box_tiles
    ld a, BOX_STATE_DROPPED_TILE
    call carry_finish_drop_state_a
    ret

carry_drop_box_blocked:
    ; Keep the box carried if the target cells are not empty.
    ; Nothing is dropped, and the physical box entity remains hidden.
    call carry_update_followers
    call carry_hide_materialized_box_sprites
    ret

carry_drop_box_as_sprite:
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (carry_tmp_byte_3)
    ld (hl), a
    ld hl, entity_y_pos
    add hl, de
    ld a, (carry_tmp_byte_4)
    ld (hl), a

    ld a, BOX_STATE_ENTITY
    call carry_finish_drop_state_a

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_collision_layer_init
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), a

    ld hl, entity_box_collides_with_init
    add hl, de
    ld a, (hl)
    ld hl, entity_collides_with
    add hl, de
    ld (hl), a

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)
    ld hl, entity_wall_collision_flags
    add hl, de
    ld (hl), 0
    ret

carry_finish_drop_state_a:
    ld (carry_tmp_byte_9), a           ; desired box state
    ld a, (carry_tmp_byte_1)
    ld e, a
    ld d, 0
    ld hl, entity_carry_held
    add hl, de
    ld (hl), 255

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_carried_by
    add hl, de
    ld (hl), 255
    ld hl, entity_box_state
    add hl, de
    ld a, (carry_tmp_byte_9)
    ld (hl), a

    ld a, (current_screen_id)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a

    xor a
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), a
    ld hl, entity_collides_with
    add hl, de
    ld (hl), a

    ld a, (carry_tmp_byte_1)
    ld c, a
    call carry_restore_carrier_sprite
    ret

carry_apply_carrier_sprite:
    ; Input C = carrier.
    ld e, c
    ld d, 0
    ld hl, entity_carry_sprite_index_init
    add hl, de
    ld a, (hl)
    cp 255
    ret z
    ld (carry_tmp_byte_10), a

    ld hl, entity_carry_base_sprite
    add hl, de
    ld a, (hl)
    cp 255
    jr nz, .base_already_saved
    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (hl)
    ld hl, entity_carry_base_sprite
    add hl, de
    ld (hl), a

.base_already_saved:
    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (carry_tmp_byte_10)
    ld (hl), a
    xor a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), a
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), a
    ret

carry_restore_carrier_sprite:
    ; Input C = carrier.
    ld e, c
    ld d, 0
    ld hl, entity_carry_base_sprite
    add hl, de
    ld a, (hl)
    cp 255
    ret z
    ld (carry_tmp_byte_10), a
    ld (hl), 255
    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (carry_tmp_byte_10)
    ld (hl), a
    xor a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), a
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), a
    ret

carry_materialize_landed_box:
    ; Input DE = box entity index. Converts a grounded sprite box into map tiles.
    ld a, e
    ld (carry_tmp_byte_2), a           ; box index

    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    or a
    ret nz                        ; already carried or materialized

    ld hl, entity_box_tile_width_init
    add hl, de
    ld a, (hl)
    or a
    ret z                         ; no dropped tile configured
    ld (carry_tmp_byte_7), a           ; matrix width

    ld hl, entity_box_tile_height_init
    add hl, de
    ld a, (hl)
    or a
    ret z
    ld (carry_tmp_byte_8), a           ; matrix height

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    srl a
    srl a
    srl a
    ld (carry_tmp_byte_5), a           ; tile X

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    srl a
    srl a
    srl a
    ld (carry_tmp_byte_6), a           ; tile Y

    ld hl, entity_box_tile_x
    add hl, de
    ld a, (carry_tmp_byte_5)
    ld (hl), a
    ld hl, entity_box_tile_y
    add hl, de
    ld a, (carry_tmp_byte_6)
    ld (hl), a

    call carry_can_place_box_tiles
    cp 2
    ret nz

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    call carry_write_box_tiles

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_state
    add hl, de
    ld (hl), BOX_STATE_DROPPED_TILE

    ld a, (current_screen_id)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a

    xor a
    ld hl, entity_collision_layer
    add hl, de
    ld (hl), a
    ld hl, entity_collides_with
    add hl, de
    ld (hl), a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), a
    inc hl
    ld (hl), a

    call carry_hide_materialized_box_sprites
    ret

carry_can_place_box_tiles:
    ; Input:
    ;   carry_tmp_byte_5 = tile X
    ;   carry_tmp_byte_6 = tile Y
    ;   carry_tmp_byte_7 = matrix width
    ;   carry_tmp_byte_8 = matrix height
    ; Output:
    ;   A = 0 if blocked, 1 if clear without support, 2 if clear with support.
    ; Notes:
    ;   Target/support cells use behavior solidity only. Visible NoSolid chars may
    ;   be covered temporarily; carry_write_box_tiles stores and restores them.
    ld a, (carry_tmp_byte_5)
    ld h, a
    ld a, (carry_tmp_byte_7)
    add a, h
    jp c, .blocked
    cp 33
    jp nc, .blocked

    ld a, (carry_tmp_byte_6)
    ld h, a
    ld a, (carry_tmp_byte_8)
    add a, h
    jp c, .blocked
    cp 25
    jp nc, .blocked

    ld a, (carry_tmp_byte_8)
    ld (carry_tmp_byte_11), a          ; rows remaining
    ld a, (carry_tmp_byte_6)
    ld (carry_tmp_byte_13), a          ; current Y

.check_row:
    ld a, (carry_tmp_byte_11)
    or a
    jp z, .check_support
    ld a, (carry_tmp_byte_7)
    ld (carry_tmp_byte_12), a          ; columns remaining
    ld a, (carry_tmp_byte_5)
    ld (carry_tmp_byte_14), a          ; current X

.check_col:
    ld a, (carry_tmp_byte_12)
    or a
    jp z, .check_next_row
    ld a, (carry_tmp_byte_13)
    ld b, a                            ; B = row
    ld a, (carry_tmp_byte_14)
    ld c, a                            ; C = column
    call get_behavior_tile
    and #F0
    or a
    jp nz, .blocked
    ld hl, carry_tmp_byte_14
    inc (hl)
    ld hl, carry_tmp_byte_12
    dec (hl)
    jp .check_col

.check_next_row:
    ld hl, carry_tmp_byte_13
    inc (hl)
    ld hl, carry_tmp_byte_11
    dec (hl)
    jp .check_row

.check_support:
    ld a, (carry_tmp_byte_6)
    ld h, a
    ld a, (carry_tmp_byte_8)
    add a, h                           ; A = row below the box footprint
    jp c, .unsupported
    cp 24
    jp nc, .unsupported
    ld (carry_tmp_byte_13), a          ; support Y
    ld a, (carry_tmp_byte_7)
    ld (carry_tmp_byte_12), a          ; columns remaining
    ld a, (carry_tmp_byte_5)
    ld (carry_tmp_byte_14), a          ; current X

.support_col:
    ld a, (carry_tmp_byte_12)
    or a
    jp z, .clear
    ld a, (carry_tmp_byte_13)
    ld b, a                            ; B = row below box
    ld a, (carry_tmp_byte_14)
    ld c, a                            ; C = column
    call get_behavior_tile
    and #F0
    or a
    jp z, .unsupported                 ; every footprint column needs support
    ld hl, carry_tmp_byte_14
    inc (hl)
    ld hl, carry_tmp_byte_12
    dec (hl)
    jp .support_col

.clear:
    ld a, 2
    ret

.unsupported:
    ld a, 1
    ret

.blocked:
    xor a
    ret

carry_get_layout_tile:
    ; Input B = row, C = column. Output A = visible char from current_screen_layout.
    ld a, b
    cp 24
    jp nc, .layout_oob
    ld a, c
    cp 32
    jp nc, .layout_oob

    push hl
    push de
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, (hl)
    push af
    call mapper_pop_p2
    pop af
    pop de
    pop hl
    ret

.layout_oob:
    ld a, 1
    ret

carry_get_restore_char_ptr:
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    sla e
    rl d
    sla e
    rl d
    sla e
    rl d
    sla e
    rl d
    ld hl, entity_box_restore_chars
    add hl, de
    ld a, (carry_tmp_byte_10)
    ld e, a
    ld d, 0
    add hl, de
    ret

carry_save_box_restore_cell:
    ld a, (carry_tmp_byte_13)
    ld b, a
    ld a, (carry_tmp_byte_14)
    ld c, a
    call carry_get_layout_tile
    push af
    call carry_get_restore_char_ptr
    pop af
    ld (hl), a
    ret

carry_hide_materialized_box_sprites:
    ; Uses carry_tmp_byte_2 = box entity index. Hide every HW sprite layer for it.
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de
    ld c, (hl)                    ; C = base HW sprite index
    inc hl
    ld b, (hl)                    ; B = layer count
    ld a, b
    or a
    ret z
.hide_layer:
    ld a, c
    call ${hideSpriteCall}
    inc c
    djnz .hide_layer
    ret

carry_update_followers:
    ld c, 0

.follow_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ld e, c
    ld d, 0
    ld hl, entity_carried_by
    add hl, de
    ld a, (hl)
    cp 255
    jr z, .follow_next

    ld b, a                       ; B = carrier ID
    push bc

    ld e, b
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)

    pop bc
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_screen_id
    add hl, de
    cp (hl)
    jr z, .follow_screen_ready
    ld (hl), a
    ld a, 1
    ld (active_entity_list_dirty), a

.follow_screen_ready:
    pop bc
    push bc

    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)

    pop bc
    push bc
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld (hl), a

    pop bc
    push bc
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    sub 16

    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld (hl), a

.follow_next:
    inc c
    jr .follow_loop

carry_clear_box_tiles_for_b:
    ; Input B = box.
    ld a, b
    ld (carry_tmp_byte_2), a
    ld e, b
    ld d, 0
    ld hl, entity_box_tile_width_init
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_7), a
    ld hl, entity_box_tile_height_init
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_8), a
    ld hl, entity_box_tile_x
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_5), a
    ld hl, entity_box_tile_y
    add hl, de
    ld a, (hl)
    ld (carry_tmp_byte_6), a

carry_clear_box_tiles:
    xor a
    ld (carry_tmp_byte_10), a          ; restore cell index 0..15
    ld a, (carry_tmp_byte_8)
    ld (carry_tmp_byte_11), a          ; rows remaining
    ld a, (carry_tmp_byte_6)
    ld (carry_tmp_byte_13), a          ; current Y

.clear_row:
    ld a, (carry_tmp_byte_11)
    or a
    jp z, .clear_done
    ld a, (carry_tmp_byte_7)
    ld (carry_tmp_byte_12), a          ; columns remaining
    ld a, (carry_tmp_byte_5)
    ld (carry_tmp_byte_14), a          ; current X

.clear_col:
    ld a, (carry_tmp_byte_12)
    or a
    jr z, .clear_next_row
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_restore_valid
    add hl, de
    ld a, (hl)
    or a
    jp z, .clear_zero_cell

    call carry_get_restore_char_ptr
    ld a, (hl)
    ld (carry_tmp_byte_15), a
    xor a
    ld (carry_tmp_byte_9), a
    jp .clear_write_cell

.clear_zero_cell:
    xor a
    ld (carry_tmp_byte_15), a
    ld (carry_tmp_byte_9), a

.clear_write_cell:
    ld a, (carry_tmp_byte_14)
    ld d, a
    ld a, (carry_tmp_byte_13)
    ld e, a
    ld a, (carry_tmp_byte_9)
    ld c, a
    ld a, (carry_tmp_byte_15)
    call carry_write_tile_at_xy
    ld hl, carry_tmp_byte_10
    inc (hl)
    ld hl, carry_tmp_byte_14
    inc (hl)
    ld hl, carry_tmp_byte_12
    dec (hl)
    jr .clear_col

.clear_next_row:
    ld hl, carry_tmp_byte_13
    inc (hl)
    ld hl, carry_tmp_byte_11
    dec (hl)
    jr .clear_row

.clear_done:
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_restore_valid
    add hl, de
    ld (hl), 0
    ret

carry_write_box_tiles:
    xor a
    ld (carry_tmp_byte_10), a          ; restore cell index 0..15
    ld a, (carry_tmp_byte_6)           ; choose SCREEN 2 vertical pattern bank from tile Y
    srl a
    srl a
    srl a
    cp 3
    jr c, .tile_bank_ok
    ld a, 2
.tile_bank_ok:
    ld b, a                       ; B = bank index 0..2
    ld a, (carry_tmp_byte_2)
    ld c, a
    add a, a
    add a, c                      ; A = box index * 3
    add a, b                      ; A = box-bank matrix index
    ld e, a
    ld d, 0
    ld hl, entity_box_tile_matrix_ptrs
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (carry_tmp_word_1), hl

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_tile_behavior_matrix_ptrs
    add hl, de
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ld (carry_tmp_word_2), hl

    ld a, (carry_tmp_byte_8)
    ld (carry_tmp_byte_11), a          ; rows remaining
    ld a, (carry_tmp_byte_6)
    ld (carry_tmp_byte_13), a          ; current Y

.write_row:
    ld a, (carry_tmp_byte_11)
    or a
    jp z, .write_done
    ld a, (carry_tmp_byte_7)
    ld (carry_tmp_byte_12), a          ; columns remaining
    ld a, (carry_tmp_byte_5)
    ld (carry_tmp_byte_14), a          ; current X

.write_col:
    ld a, (carry_tmp_byte_12)
    or a
    jr z, .write_next_row
    ld hl, (carry_tmp_word_1)
    ld a, (hl)
    inc hl
    ld (carry_tmp_word_1), hl
    ld (carry_tmp_byte_15), a          ; tile char to write
    ld hl, (carry_tmp_word_2)
    ld a, (hl)
    inc hl
    ld (carry_tmp_word_2), hl
    ld (carry_tmp_byte_9), a           ; behavior byte to write

    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_restore_valid
    add hl, de
    ld a, (hl)
    or a
    call z, carry_save_box_restore_cell

    ld a, (carry_tmp_byte_14)
    ld d, a                       ; D = tile X
    ld a, (carry_tmp_byte_13)
    ld e, a                       ; E = tile Y
    ld a, (carry_tmp_byte_9)
    ld c, a                       ; C = behavior byte
    ld a, (carry_tmp_byte_15)     ; A = tile char
    call carry_write_tile_at_xy
    ld hl, carry_tmp_byte_10
    inc (hl)
    ld hl, carry_tmp_byte_14
    inc (hl)
    ld hl, carry_tmp_byte_12
    dec (hl)
    jr .write_col

.write_next_row:
    ld hl, carry_tmp_byte_13
    inc (hl)
    ld hl, carry_tmp_byte_11
    dec (hl)
    jr .write_row

.write_done:
    ld a, (carry_tmp_byte_2)
    ld e, a
    ld d, 0
    ld hl, entity_box_restore_valid
    add hl, de
    ld (hl), 1
    ret

carry_write_tile_at_xy:
    ; Input: A = tile char, C = behavior byte, D = tile X, E = tile Y.
    push af
    ld a, d
    cp 32
    jr nc, .write_out
    ld a, e
    cp 24
    jr nc, .write_out
    pop af

    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de
    ld b, a
    ld a, c
    ld (carry_tmp_byte_9), a

    push hl
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, b
    ld (hl), a
    call mapper_pop_p2
    pop hl

    push hl
    ld de, (current_behavior_map)
    add hl, de
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, (carry_tmp_byte_9)
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ld a, #FF
    ld (behavior_cache_row), a

    ld de, NAMETBL
    add hl, de
    ld a, b
    call WRTVRM
    ret

.write_out:
    pop af
    ret
    `, targetFormat), {
        id: 'runtime.components.carry',
        kind: 'routine',
        owner: 'components',
        roots: ['init_carry_system', 'update_carry_component', 'carry_sync_current_screen_followers', 'carry_apply_dropped_box_tiles_current_screen'],
    });
}

/**
 * Generate WallCollision Component System
 * For wall sliding and collision prevention
 * Uses 2-point checks per direction for robust collision
 * Snaps entity position to wall edge (not just zero velocity)
 */
function generateWallCollisionSystem(romMode: string = 'simple32k'): string {
    return wrapMideasAsmBlock(`
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Uses per-entity hitbox (offset + width/height)
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; wall_behavior_is_full_blocker
; Input:  A = behavior byte or family bits
; Output: Z = passable / top-solid platform, NZ = full blocker
; Clobbers: AF
; Notes:
;   - familyId 2 (#20) is treated as one-way/top-solid, so it must not
;     block horizontal motion or upward motion.
; ------------------------------------------------------------------
wall_behavior_is_full_blocker:
    and #F0
    ret z
    cp #20
    ret z
    or a
    ret

; ------------------------------------------------------------------
; wall_down_behavior_blocks
; Input:
;   - A  = behavior byte or family bits from get_behavior_tile
;   - B  = tile row of the floor probe
;   - DE = entity index
; Output:
;   - Z  = passable
;   - NZ = blocks downward movement / supports standing
; Clobbers: AF, C, HL
; Preserved: B, DE
; Notes:
;   - familyId 2 (#20) is top-solid: it only blocks when the entity was
;     already above the tile before this frame's vertical movement.
;   - update_position_component already applied vel_y before WallCollision,
;     so previous_bottom = wall_hit_bottom - entity_vel_y.
; ------------------------------------------------------------------
wall_down_behavior_blocks:
    and #F0
    ret z
    cp #20
    jr z, .platform_check
    or a
    ret

.platform_check:
    push bc
    push hl
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = tileTop = row * 8
    add a, 2
    ld c, a                       ; C = tileTop + tolerance
    ld a, (wall_hit_bottom)
    ld hl, entity_vel_y
    add hl, de
    sub (hl)                      ; previous_bottom = current_bottom - vel_y
    cp c
    pop hl
    pop bc
    jr c, .platform_blocks
    jr z, .platform_blocks
    xor a
    ret

.platform_blocks:
    ld a, 1
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; ------------------------------------------------------------------
; Check wall collisions and prevent movement through solid tiles.
; Uses behavior map (current_behavior_map) for collision detection.
; Entity position is cached in wall_temp_x/y and converted to hitbox bounds.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Iterate all entity slots; for each active entity with
;            WallCollision eligibility, probe solid tiles in movement
;            direction(s) and snap position + zero velocity on hit.
;   Inputs:
;     - entity_active[]         : 1 = entity exists
;     - active_entity_list[] / active_entity_count : compact active list already current
;     - entity_comp_masks[]     : low byte component bitmask
;     - entity_comp_masks_hi[]  : high byte (COMP_MASK_GRAVITY at bit 1)
;     - entity_collides_with[]  : must include COLLISION_LAYER_PLATFORM (#08)
;                                 for tile/wall blocking; entitiesGenerator
;                                 sets this for comp_wall_collision.
;     - entity_x_pos/y_pos[]    : world position
;     - entity_vel_x/vel_y[]    : signed 8-bit velocity (negative = left/up)
;     - entity_gravity_vel[]    : 16-bit signed gravity accumulator (word)
;     - entity_collision_offset_x/y[]: signed offset from origin to hitbox corner
;     - entity_collision_hitbox_w/h[]: hitbox size (minimum 1 if zero)
;     - current_behavior_map    : pointer to active screen behavior map
;   Outputs:
;     - entity_x_pos/y_pos[]    : snapped on collision
;     - entity_vel_x/vel_y[]    : zeroed on collision axis
;     - entity_gravity_vel[]    : zeroed on vertical collision
;     - entity_on_ground[]      : bit 0 set=floor, cleared at loop start
;     - entity_wall_collision_flags[]: bits 0=UP,1=DOWN,2=LEFT,3=RIGHT
;   Clobbers: AF, BC, DE, HL
;   Preserved: (none — uses scratch RAM wall_temp_x/y, wall_hit_*, wall_probe_*)
;   Notes:
;     - Opt-B: loop uses active_entity_list (entities guaranteed active + on screen).
;       Eliminates ~29 wasted iterations vs 0..MAX_ENTITIES scan (3 entities active).
;     - Caller must refresh active_entity_list earlier in the frame.
;     - Opt-C: wall_build_hitbox_cache is skipped on DOWN snap when new Y == current Y
;       (entity already on floor). Saves ~200 cycles/entity/frame when standing still.
;     - wall_build_hitbox_cache is called once at entity entry, and after each snap
;       where the position actually changes.
;     - Gravity floor check (.check_wall_y_gravity) runs even when vel_y=0
;       so entity_on_ground stays accurate when entity is standing still.
; ------------------------------------------------------------------
update_wallcollision_component:
    ; update_all_entities refreshed active_entity_list before entering the
    ; component chain, so we can consume it directly here.
    ld a, (collision_entity_count)
    or a
    ret z                         ; no active entities → done
    ld b, a                       ; B = entity count (loop counter for djnz)
    ld hl, collision_entity_list

.wall_loop:
    ; ---- Load next entity index from compact list ----
    ld e, (hl)                    ; E = entity index
    ld d, 0                       ; DE = entity index (word)
    push hl                       ; save list pointer (clobbered by hl arithmetic below)
    push bc                       ; save loop counter

    ; Carried or tile-dropped boxes should not be snapped by wall collision.
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    or a
    jp nz, .wall_next

    ; --- Filter A: entity must have Collision component ---
    ; (entity_active and entity_screen_id are implicit via active_entity_list)
    ; Hitbox data lives in Collision arrays; no Collision = no valid hitbox.
    ; Opt-D: read comp_masks into B (B is free — loop counter saved on stack above).
    ; B holds comp_masks for Filter C reuse, eliminating a second memory read.
    ld hl, entity_comp_masks
    add hl, de
    ld b, (hl)                    ; B = comp_masks[E] (safe: loop ctr on stack)
    ld a, b
    and COMP_MASK_COLLISION       ; low byte, bit 3
    jp z, .wall_next

    ; --- Filter B: entity must collide with the Platform layer ---
    ; entity_collides_with is a bitmask; COLLISION_LAYER_PLATFORM (#08) = map tiles.
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)
    and COLLISION_LAYER_PLATFORM
    jp z, .wall_next

    ; --- Filter C: entity must move or fall (Input, Movement, or Gravity component) ---
    ; Static entities (platforms, decorations) have no velocity to correct.
    ; Opt-D: reuse comp_masks from B — no extra ld hl/add hl,de/ld a,(hl) needed (saves 28 cycles/entity).
    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp nz, .wall_entity_can_move
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp z, .wall_next
.wall_entity_can_move:

    ; ---- Entity passed all filters — cache its position ----
    ; wall_temp_x/y are scratch RAM used by wall_build_hitbox_cache and
    ; the snap routines to avoid repeated indexed array lookups.
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; scratch X = entity_x_pos[E]
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; scratch Y = entity_y_pos[E]

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; Build initial hitbox cache for this entity.
    call wall_build_hitbox_cache

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - probe one pixel before hitbox left edge
    ld a, (wall_hit_left)
    or a
    jp z, .check_wall_y           ; already at left boundary
    sub 1
    srl a
    srl a
    srl a                         ; Column = (left-1) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_left_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom = hitbox_bottom - inset ≤ 191 → row ≤ 23, col = (left-1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (LEFT wall):
    ;   C = tile column that blocked us (from (left-1)/8 probe)
    ;   new_hitbox_left = (C + 1) * 8   → first pixel right of the wall
    ;   entity_x = new_hitbox_left - collision_offset_x
    ;              (wall_sub_signed_offset_clamped reverses the offset)
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 2 (LEFT) set.
    ; ---------------------------------------------------------------
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (C+1)*8 = new hitbox left pixel
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel leftward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; bit 2 = LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - probe one pixel after hitbox right edge
    ld a, (wall_hit_right)
    inc a
    jp z, .check_wall_y           ; overflow (right==255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_right_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom ≤ 191 → row ≤ 23, col = (right+1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (RIGHT wall):
    ;   C = tile column that blocked us (from (right+1)/8 probe)
    ;   wall_left_of_tile = C * 8           → left pixel of blocking tile
    ;   new_hitbox_left   = C*8 - hitbox_w  → push entity left so right edge
    ;                                         just touches the tile's left side
    ;   If underflow (hitbox_w > C*8): clamp new_hitbox_left to 0.
    ;   entity_x = new_hitbox_left - collision_offset_x
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 3 (RIGHT) set.
    ; ---------------------------------------------------------------
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = C * 8 = left pixel of blocking tile
    ld b, a                       ; B = C*8
    ld a, (wall_hit_w)
    ld c, a                       ; C = hitbox width
    ld a, b
    sub c                         ; A = C*8 - hitbox_w = new hitbox left
    jr nc, .wall_right_left_ok
    xor a                         ; underflow: clamp to 0
.wall_right_left_ok:
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel rightward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; bit 3 = RIGHT wall collision

.check_wall_y:
    ; ---- CHECK VERTICAL VELOCITY ----
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y_gravity   ; vel_y=0, but check floor for gravity entities

    bit 7, a
    jp z, .wall_check_down

.wall_check_up:
    ; Moving up - probe one pixel above hitbox top edge
    ld a, (wall_hit_top)
    or a
    jp z, .wall_up_top_edge       ; top=0, clamp + stop upward velocity
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (top-1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ; NOTE: uses get_behavior_tile (with bounds) — entity_y can wrap off-screen,
    ; making B = (top-1)/8 > 23 (e.g. top=252 → row=31). Bounds check returns 0.
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_up_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp z, .wall_next              ; Both passable

.wall_up_top_edge:
    ; ---------------------------------------------------------------
    ; Screen top boundary clamp (wall_hit_top == 0, no tile above row 0).
    ; This path is entered when wall_hit_left == 0 (entity already at top
    ; screen boundary) or when the UP probe is at row -1 (invalid).
    ; Sanity guard: only snap if entity_y < 24 (i.e. truly near the top).
    ; If entity_y >= 24, the "top=0" probe is a false positive — just
    ; cancel velocity via .wall_up_cancel_only without moving entity.
    ; new_hitbox_top = 0, entity_y = 0 - offset_y (clamped).
    ; ---------------------------------------------------------------
    ld a, (wall_temp_y)
    cp 24
    jp nc, .wall_up_cancel_only
    xor a
    push af                       ; keep new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped
    ld (wall_temp_y), a
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Clamp entity Y to top boundary
    call wall_build_hitbox_cache  ; Refresh hitbox cache after snap

    ; Zero Y velocity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum at top edge
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_up_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (UP / ceiling):
    ;   B = tile row that blocked us (from (top-1)/8 probe)
    ;   new_hitbox_top = (B + 1) * 8  → first pixel below the ceiling tile
    ;   Safety guard: if new_top < current wall_hit_top, the snap would
    ;   push us further into the ceiling (sub-pixel rounding artefact).
    ;   In that case, fall through to .wall_up_cancel_only to just
    ;   cancel velocity without moving the entity.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, wall_collision_flags bit 0 (UP) set.
    ; ---------------------------------------------------------------
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (B+1)*8 = new hitbox top pixel
    ; Guard: new_top must be >= current hitbox top (no upward nudge)
    ld c, a
    ld hl, wall_hit_top
    ld a, c
    cp (hl)                       ; new_top < current_top? → carry set
    jp c, .wall_up_cancel_only    ; invalid snap: only cancel momentum
    ld a, c
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel upward velocity and gravity accumulator
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; bit 0 = UP wall collision
    jp .wall_next

.wall_up_cancel_only:
    ; ---------------------------------------------------------------
    ; Defensive path: snap would move entity upward (invalid) or
    ; entity is far from the screen top boundary.
    ; Keep current Y position, but cancel upward momentum this frame.
    ; ---------------------------------------------------------------
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_check_down:
    ; Moving down - probe one pixel below hitbox bottom edge
    ld a, (wall_hit_bottom)
    inc a
    jp z, .wall_next              ; overflow (bottom==255), skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (bottom+1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp nz, .wall_down_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (DOWN / floor):
    ;   B = tile row that blocked us (from (bottom+1)/8 probe)
    ;   floor_top_pixel  = B * 8          → top pixel of the floor tile
    ;   new_hitbox_top   = B*8 - hitbox_h → push entity up so bottom edge
    ;                                       just sits on the floor surface
    ;   If underflow (hitbox_h > B*8): clamp new_hitbox_top to 0.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, entity_on_ground bit 0 set,
    ;             entity_wall_collision_flags bit 1 (DOWN) set.
    ; Note: jp .wall_next skips .check_wall_y_gravity intentionally —
    ;       floor already detected; no redundant gravity probe needed.
    ; ---------------------------------------------------------------
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = B*8 = top pixel of floor tile
    ld b, a                       ; B = floor_top_pixel
    ld a, (wall_hit_h)
    ld c, a                       ; C = hitbox height
    ld a, b
    sub c                         ; A = B*8 - hitbox_h = new hitbox top
    jr nc, .wall_down_top_ok
    xor a                         ; underflow: clamp to 0
.wall_down_top_ok:
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ; Opt-C: skip rebuild if new Y == current Y (entity already on floor).
    ; Saves ~200 cycles/frame for standing-still entities (most common state).
    ; Falls through to normal snap path on actual position change (e.g. landing).
    cp (hl)
    jp z, .wall_down_at_floor     ; position unchanged → hitbox still valid
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change
.wall_down_at_floor:
    ; Cancel downward velocity and gravity accumulator (landing)
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Mark entity as on-ground and flag DOWN wall collision
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)                       ; bit 0 = standing on solid floor
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; bit 1 = DOWN wall collision
    call carry_materialize_landed_box
    jp .wall_next                     ; floor handled; skip gravity floor check

.check_wall_y_gravity:
    ; ---------------------------------------------------------------
    ; vel_y == 0, but gravity entities still need a floor probe every
    ; frame to keep entity_on_ground accurate (e.g. entity walks off
    ; a platform edge — vel_y is 0 at that instant but the flag must
    ; be cleared promptly so the gravity system can accelerate it).
    ; Only enter .wall_check_down if entity has COMP_MASK_GRAVITY
    ; (stored in entity_comp_masks_hi bit 1).
    ; Non-gravity entities: skip vertical check entirely.
    ; ---------------------------------------------------------------
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; gravity entity → check floor
    ; No gravity component → no vertical wall check needed
.wall_next:
    ; Opt-B: restore list pointer and count, advance to next entity.
    ; NOTE: djnz range is ±127 bytes — wall_loop body is too large.
    ; Use dec b / jp nz instead (jp supports any distance).
    pop bc
    pop hl
    inc hl                        ; next entry in active_entity_list
    dec b
    jp nz, .wall_loop
    ret

; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready    ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
    `, {
        id: 'runtime.components.wallcollision',
        kind: 'routine',
        owner: 'components',
    });
}

/**
 * Generate Tile Interaction System
 * Detects when an entity with COMP_INPUT overlaps an Interactable tile
 * (mapId & #08 != 0 = NoSolid+Interactable, e.g. gems/coins on the screen map).
 * On contact: clears tile from VRAM Name Table + runtime_behavior_map, increments gem_count.
 */
function buildSoundAssetIndexMap(sounds?: any[]): Record<string, number> {
    const soundMap: Record<string, number> = {};
    (sounds || []).forEach((sound, index) => {
        const id = typeof sound?.id === 'string' ? sound.id : '';
        const name = typeof sound?.name === 'string' ? sound.name : '';
        if (id) {
            soundMap[id] = index;
            soundMap[id.toLowerCase()] = index;
        }
        if (name) {
            soundMap[name] = index;
            soundMap[name.toLowerCase()] = index;
        }
    });
    return soundMap;
}

function resolveSoundAssetIndex(soundRef: any, soundMap: Record<string, number>): number | null {
    if (typeof soundRef === 'number' && Number.isFinite(soundRef)) {
        return Math.max(0, Math.min(255, soundRef | 0));
    }

    if (typeof soundRef === 'string') {
        const trimmed = soundRef.trim();
        if (!trimmed) return null;
        const directIndex = soundMap[trimmed];
        if (directIndex !== undefined) return directIndex;
        const lowerIndex = soundMap[trimmed.toLowerCase()];
        if (lowerIndex !== undefined) return lowerIndex;
        const parsedIndex = parseInt(trimmed, 10);
        if (!isNaN(parsedIndex)) return Math.max(0, Math.min(255, parsedIndex));
    }

    return null;
}

function clampTileCollectorAmount(rawValue: any): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.max(0, Math.min(65535, Math.round(parsed)));
}

function coerceTileCollectorAssignValue(rawValue: any): number {
    if (typeof rawValue === 'boolean') return rawValue ? 1 : 0;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(0, Math.min(65535, Math.round(parsed)));
}

function clampTileCollectorByte(rawValue: any): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.max(0, Math.min(255, Math.round(parsed)));
}

function buildTileIdToBaseCharMap(tiles?: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    if (!tiles || tiles.length === 0) return map;

    let nextCharCode = 128;
    tiles.forEach((tile) => {
        if (!tile || !tile.id) return;
        map[tile.id] = nextCharCode;
        if (tile.name) {
            map[String(tile.name)] = nextCharCode;
            map[String(tile.name).toLowerCase()] = nextCharCode;
        }
        const charsWide = Math.max(1, Math.ceil((Number(tile.width) || 8) / 8));
        const charsHigh = Math.max(1, Math.ceil((Number(tile.height) || 8) / 8));
        nextCharCode += charsWide * charsHigh;
    });

    return map;
}

function resolveTileCharCode(value: any, tileIdToCharCode?: Record<string, number>): number {
    if (typeof value === 'string' && tileIdToCharCode) {
        if (tileIdToCharCode[value] !== undefined) return tileIdToCharCode[value];
        const lower = value.toLowerCase();
        if (tileIdToCharCode[lower] !== undefined) return tileIdToCharCode[lower];
    }

    const parsed = parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(255, parsed | 0));
}

function buildGlobalVariableInfoMap(analysis: ProjectAnalysis): Record<string, { asmName: string; isWord: boolean }> {
    const variableMap: Record<string, { asmName: string; isWord: boolean }> = {};
    const globalVariables = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];

    for (const variable of globalVariables as any[]) {
        const name = typeof variable?.name === 'string' ? variable.name.trim() : '';
        const asmName = typeof variable?.asmName === 'string' ? variable.asmName.trim() : '';
        if (!name || !asmName) continue;

        const type = String(variable?.type || '').toLowerCase();
        const isWord = type === 'word' || type === '16bit';
        variableMap[name] = { asmName, isWord };
        variableMap[name.toLowerCase()] = { asmName, isWord };
        variableMap[asmName] = { asmName, isWord };
        variableMap[asmName.toLowerCase()] = { asmName, isWord };
    }

    return variableMap;
}

function buildOrderedGlobalVariableInfos(analysis: ProjectAnalysis): Array<{ asmName: string; isWord: boolean }> {
    const orderedVariables: Array<{ asmName: string; isWord: boolean }> = [];
    const seenAsmNames = new Set<string>();
    const globalVariables = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];

    for (const variable of globalVariables as any[]) {
        const asmName = typeof variable?.asmName === 'string' ? variable.asmName.trim() : '';
        if (!asmName) continue;

        const key = asmName.toLowerCase();
        if (seenAsmNames.has(key)) continue;
        seenAsmNames.add(key);

        const type = String(variable?.type || '').toLowerCase();
        orderedVariables.push({
            asmName,
            isWord: type === 'word' || type === '16bit',
        });
    }

    return orderedVariables;
}

function resolveConfiguredVariableInfo(
    variableRef: any,
    variableMap: Record<string, { asmName: string; isWord: boolean }>
): { asmName: string; isWord: boolean } | null {
    if (typeof variableRef !== 'string') return null;
    const trimmed = variableRef.trim();
    if (!trimmed) return null;

    return variableMap[trimmed] || variableMap[trimmed.toLowerCase()] || null;
}

function extractTileCollectorConfig(candidate: any) {
    if (!candidate || candidate.isEnabled === false || candidate.isEnabled === 'false') {
        return null;
    }

    return {
        collectionSoundId: candidate.collectionSoundId,
        replacementTileId: candidate.replacementTileId,
        targetVariable: candidate.targetVariable ?? candidate.scoreVariable ?? candidate.scoreVariableName,
        incrementAmount: candidate.incrementAmount ?? candidate.scoreAmount ?? candidate.collectionValue ?? 0,
        flagVariable: candidate.flagVariable ?? candidate.eventVariable ?? candidate.modifiedFlagVariable,
        flagValue: candidate.flagValue ?? candidate.eventValue ?? 1,
        bonusTileId: candidate.bonusTileId,
        bonusReplacementTileId: candidate.bonusReplacementTileId,
        bonusSoundId: candidate.bonusSoundId,
        bonusIsPersistent: candidate.bonusIsPersistent,
        bonusEntityEffect: candidate.bonusEntityEffect,
        bonusEffectAmount: candidate.bonusEffectAmount,
        bonusSlashStrength: candidate.bonusSlashStrength,
        bonusRespawnSeconds: candidate.bonusRespawnSeconds,
    };
}

function resolveTileCollectorRuntimeConfig(analysis: ProjectAnalysis): {
    soundAssetIndex: number | null;
    replacementTileChar: number;
    targetVariable: { asmName: string; isWord: boolean } | null;
    incrementAmount: number;
    flagVariable: { asmName: string; isWord: boolean } | null;
    flagValue: number;
    bonusTileChar: number | null;
    bonusReplacementTileChar: number;
    bonusSoundAssetIndex: number | null;
    bonusIsPersistent: boolean;
    bonusEntityEffect: string;
    bonusEffectAmount: number;
    bonusSlashStrength: number;
    bonusRespawnSeconds: number;
} {
    const soundMap = buildSoundAssetIndexMap((analysis as any).sounds);
    const variableMap = buildGlobalVariableInfoMap(analysis);
    const tileIdToCharCode = buildTileIdToBaseCharMap((analysis as any).tiles);

    const entities = Array.isArray(analysis.entities) ? analysis.entities : [];
    for (const entity of entities as any[]) {
        const config = extractTileCollectorConfig(entity?.componentOverrides?.['comp_tile_collector']);
        if (!config) continue;

        const soundAssetIndex = resolveSoundAssetIndex(config.collectionSoundId, soundMap);
        const replacementTileChar = resolveTileCharCode(config.replacementTileId ?? 0, tileIdToCharCode);
        const targetVariable = resolveConfiguredVariableInfo(config.targetVariable, variableMap);
        const incrementAmount = clampTileCollectorAmount(config.incrementAmount);
        const flagVariable = resolveConfiguredVariableInfo(config.flagVariable, variableMap);
        const flagValue = coerceTileCollectorAssignValue(config.flagValue);
        const bonusTileChar = config.bonusTileId ? resolveTileCharCode(config.bonusTileId, tileIdToCharCode) : null;
        const bonusReplacementTileChar = resolveTileCharCode(config.bonusReplacementTileId ?? 0, tileIdToCharCode);
        const bonusSoundAssetIndex = resolveSoundAssetIndex(config.bonusSoundId, soundMap);
        const bonusIsPersistent = config.bonusIsPersistent === true || config.bonusIsPersistent === 'true';
        const bonusEntityEffect = typeof config.bonusEntityEffect === 'string'
            ? config.bonusEntityEffect.trim().toLowerCase()
            : 'none';
        const bonusEffectAmount = clampTileCollectorAmount(config.bonusEffectAmount);
        const bonusSlashStrength = clampTileCollectorByte(config.bonusSlashStrength ?? 8);
        const bonusRespawnSeconds = clampTileCollectorByte(config.bonusRespawnSeconds);

        if (
            soundAssetIndex !== null ||
            replacementTileChar !== 0 ||
            (targetVariable && incrementAmount > 0) ||
            flagVariable !== null ||
            bonusTileChar !== null ||
            bonusSoundAssetIndex !== null ||
            (bonusEntityEffect !== 'none' && bonusEffectAmount > 0) ||
            (bonusTileChar !== null && bonusRespawnSeconds > 0)
        ) {
            return {
                soundAssetIndex,
                replacementTileChar,
                targetVariable,
                incrementAmount,
                flagVariable,
                flagValue,
                bonusTileChar,
                bonusReplacementTileChar,
                bonusSoundAssetIndex,
                bonusIsPersistent,
                bonusEntityEffect,
                bonusEffectAmount,
                bonusSlashStrength,
                bonusRespawnSeconds,
            };
        }
    }

    const templates = Array.isArray(analysis.templates) ? analysis.templates : [];

    for (const template of templates as any[]) {
        const collectorComp = template?.components?.find((c: any) => c.definitionId === 'comp_tile_collector');
        if (!collectorComp) continue;

        const config = extractTileCollectorConfig(collectorComp.defaultValues || {});
        if (!config) continue;

        const soundAssetIndex = resolveSoundAssetIndex(config.collectionSoundId, soundMap);
        const replacementTileChar = resolveTileCharCode(config.replacementTileId ?? 0, tileIdToCharCode);
        const targetVariable = resolveConfiguredVariableInfo(config.targetVariable, variableMap);
        const incrementAmount = clampTileCollectorAmount(config.incrementAmount);
        const flagVariable = resolveConfiguredVariableInfo(config.flagVariable, variableMap);
        const flagValue = coerceTileCollectorAssignValue(config.flagValue);
        const bonusTileChar = config.bonusTileId ? resolveTileCharCode(config.bonusTileId, tileIdToCharCode) : null;
        const bonusReplacementTileChar = resolveTileCharCode(config.bonusReplacementTileId ?? 0, tileIdToCharCode);
        const bonusSoundAssetIndex = resolveSoundAssetIndex(config.bonusSoundId, soundMap);
        const bonusIsPersistent = config.bonusIsPersistent === true || config.bonusIsPersistent === 'true';
        const bonusEntityEffect = typeof config.bonusEntityEffect === 'string'
            ? config.bonusEntityEffect.trim().toLowerCase()
            : 'none';
        const bonusEffectAmount = clampTileCollectorAmount(config.bonusEffectAmount);
        const bonusSlashStrength = clampTileCollectorByte(config.bonusSlashStrength ?? 8);
        const bonusRespawnSeconds = clampTileCollectorByte(config.bonusRespawnSeconds);

        if (
            soundAssetIndex !== null ||
            replacementTileChar !== 0 ||
            (targetVariable && incrementAmount > 0) ||
            flagVariable !== null ||
            bonusTileChar !== null ||
            bonusSoundAssetIndex !== null ||
            (bonusEntityEffect !== 'none' && bonusEffectAmount > 0) ||
            (bonusTileChar !== null && bonusRespawnSeconds > 0)
        ) {
            return {
                soundAssetIndex,
                replacementTileChar,
                targetVariable,
                incrementAmount,
                flagVariable,
                flagValue,
                bonusTileChar,
                bonusReplacementTileChar,
                bonusSoundAssetIndex,
                bonusIsPersistent,
                bonusEntityEffect,
                bonusEffectAmount,
                bonusSlashStrength,
                bonusRespawnSeconds,
            };
        }
    }

    return {
        soundAssetIndex: null,
        replacementTileChar: 0,
        targetVariable: null,
        incrementAmount: 0,
        flagVariable: null,
        flagValue: 1,
        bonusTileChar: null,
        bonusReplacementTileChar: 0,
        bonusSoundAssetIndex: null,
        bonusIsPersistent: false,
        bonusEntityEffect: 'none',
        bonusEffectAmount: 0,
        bonusSlashStrength: 8,
        bonusRespawnSeconds: 0,
    };
}

function replaceAsmLabelRange(
    asm: string,
    startLabel: string,
    endLabel: string,
    replacement: string
): string {
    const startNeedle = `\n${startLabel}:`;
    const endNeedle = `\n${endLabel}:`;
    const start = asm.indexOf(startNeedle);
    if (start === -1) return asm;

    const end = asm.indexOf(endNeedle, start + startNeedle.length);
    if (end === -1) return asm;

    return `${asm.slice(0, start + 1)}${replacement.trimEnd()}\n${asm.slice(end + 1)}`;
}

function stripUnusedTileSlashRuntime(asm: string): string {
    return replaceAsmLabelRange(
        asm,
        'update_slash_component',
        'record_bonus_respawn_slot',
        `; ------------------------------------------------------------------
; update_slash_component
; Filtered out: no tile bonus uses grant_extra_jump/slash in this project.
; Public label is kept because older generated call paths may still reference it.
; ------------------------------------------------------------------
update_slash_component:
    ret
`
    );
}

function projectHasBossRuntime(analysis: ProjectAnalysis): boolean {
    return Array.isArray((analysis as any).bosses) && (analysis as any).bosses.length > 0;
}

function projectHasBreakableTiles(analysis: ProjectAnalysis): boolean {
    return Array.isArray((analysis as any).tiles) && (analysis as any).tiles.some((tile: any) => {
        const props = tile?.logicalProperties || {};
        return props.isBreakable === true || props.isBreakable === 'true' || ((props.mapId ?? 0) & 0x01) !== 0;
    });
}

function stripUnusedPlayerDashOptionalRuntime(
    asm: string,
    options: { hasBosses: boolean; hasBreakableTiles: boolean }
): string {
    if (options.hasBosses || options.hasBreakableTiles) {
        return asm;
    }

    let optimizedAsm = asm.replace(
        /    call player_dash_break_front_tile_c\r?\n    call player_dash_hit_boss_weakpoint\r?\n/g,
        ''
    );

    optimizedAsm = replaceAsmLabelRange(
        optimizedAsm,
        'player_dash_break_front_tile_c',
        'player_dash_hit_boss_weakpoint',
        `player_dash_break_front_tile_c:
    ret
`
    );
    optimizedAsm = replaceAsmLabelRange(
        optimizedAsm,
        'player_dash_hit_boss_weakpoint',
        'player_dash_cleanup_dead_boss_attacks',
        `player_dash_hit_boss_weakpoint:
    ret
`
    );
    optimizedAsm = replaceAsmLabelRange(
        optimizedAsm,
        'player_dash_cleanup_dead_boss_attacks',
        'update_player_fastpath',
        `player_dash_cleanup_dead_boss_attacks:
    ret
`
    );

    return optimizedAsm;
}

function collectUsedScreenInteractionTypes(analysis: ProjectAnalysis): Set<number> {
    const usedTypes = new Set<number>();
    const screens = Array.isArray((analysis as any).screenMaps) ? (analysis as any).screenMaps : [];
    const tiles = Array.isArray((analysis as any).tiles) ? (analysis as any).tiles : [];

    for (const screen of screens) {
        const maps = buildScreenInteractionMaps(screen, tiles);
        for (const value of maps.typeMap) {
            const typeId = Number(value) & 0xff;
            if (typeId !== 0) {
                usedTypes.add(typeId);
            }
        }
    }

    return usedTypes;
}

function stripUnusedTileInteractionDispatchRuntime(asm: string, usedInteractionTypes: Set<number>): string {
    const onlyCollectibleInteractions =
        usedInteractionTypes.size > 0 &&
        Array.from(usedInteractionTypes).every((typeId) => typeId === 1);

    if (!onlyCollectibleInteractions) {
        return asm;
    }

    let optimizedAsm = asm.replace(
        /    ld a, \(last_interaction_type\)\r?\n    cp 5\r?\n    jr z, \.ti_dispatch_ready\r?\n    call interaction_clear_button_contact_c\r?\n\.ti_dispatch_ready:\r?\n    ld a, \(last_interaction_type\)\r?\n    cp 1\r?\n    jp z, \.ti_collect_gem\r?\n    cp 2\r?\n    jp z, \.ti_collect_item\r?\n    cp 3\r?\n    jp z, \.ti_add_energy\r?\n    cp 4\r?\n    jp z, \.ti_lever_toggle\r?\n    cp 5\r?\n    jp z, \.ti_button_press\r?\n    cp 6\r?\n    jp z, \.ti_jumper\r?\n    cp 7\r?\n    jp z, \.ti_next\r?\n    jp \.ti_next/,
        `    ld a, (last_interaction_type)
    cp 1
    jp z, .ti_collect_gem
    jp .ti_next`
    );

    optimizedAsm = replaceAsmLabelRange(
        optimizedAsm,
        'interaction_set_last_value_default1',
        'interaction_clear_button_contact_c',
        ''
    );

    optimizedAsm = replaceAsmLabelRange(
        optimizedAsm,
        '.ti_collect_item',
        '.ti_collect_bonus',
        ''
    );

    optimizedAsm = optimizedAsm.replace(
        /\.ti_no_collect:\r?\n    pop hl                         ; Balance idx push\r?\n    pop de                         ; Balance tileX\/tileY push\r?\n    pop bc                         ; Restore B=count, C=entity\r?\n    push bc\r?\n    call interaction_clear_button_contact_c\r?\n/,
        `.ti_no_collect:
    pop hl                         ; Balance idx push
    pop de                         ; Balance tileX/tileY push
`
    );

    return optimizedAsm;
}

function generateWallHitboxHelpers(): string {
    return `
; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready     ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
`;
}

function generateDeadlyTilesSystem(): string {
    const asm = `
; ------------------------------------------------------------------
; DEADLY TILES COMPONENT SYSTEM
; Purpose:
;   Scan active entities that carry COMP_MASK_DEADLY_TILES and update
;   entity_flag_deadly_tile bit 0 when their hitbox overlaps a deadly
;   behavior-map tile (TILE_DEADLY = #04).
; Notes:
;   - Uses the same hitbox sampling strategy as Preview/runtime helpers.
;   - Entities without the component have the flag forcibly cleared.
; ------------------------------------------------------------------
  init_deadly_tiles_system:
    xor a
    ld (tileDead), a
    ld (tileDeadLatched), a
    ld (tileDeadX), a
    ld (tileDeadY), a
    ld (tileDeadValue), a

    ld hl, entity_flag_deadly_tile
    ld de, entity_flag_deadly_tile + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Seed default hitboxes so marker-only entities still have a stable
    ; 16x16 probe area even when comp_collision is absent.
    ld hl, entity_collision_hitbox_w
    ld de, entity_collision_hitbox_w + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_hitbox_h
    ld de, entity_collision_hitbox_h + 1
    ld bc, 31
    ld (hl), 16
    ldir

    ld hl, entity_collision_offset_x
    ld de, entity_collision_offset_x + 1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_collision_offset_y
    ld de, entity_collision_offset_y + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

  deadly_tiles_runtime_tile_is_deadly_nb:
      ; Shared deadly probe helper. Mirrors the late-frame path used by
      ; check_tile_interaction so DeadlyTiles and Tile Collector keep parity.
      push hl
      push de

      ld hl, prof_deadly_behavior_reads
      inc (hl)
      jr nz, .dttid_prof_counted
      inc hl
      inc (hl)
.dttid_prof_counted:

      ld a, c
      ld (tileDeadX), a
      ld a, b
      ld (tileDeadY), a
  
      ld a, b
      cp 24
      jr nc, .dttid_out_of_bounds
    ld a, c
    cp 32
    jr nc, .dttid_out_of_bounds

    ld h, 0
    ld l, b                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld e, c
    ld d, 0
    add hl, de                     ; HL = idx
      ld de, runtime_behavior_map
      add hl, de                     ; HL = &runtime_behavior_map[idx]
      ld a, (hl)
      ld (tileDeadValue), a
      and TILE_DEADLY
      jr .dttid_done
  
  .dttid_out_of_bounds:
      ld a, #FF
      ld (tileDeadValue), a
      xor a
  
  .dttid_done:
      pop de
      pop hl
    ret

update_entity_deadly_flag_runtime:
    ; Preserve the caller's entity index before building the hitbox cache.
    ; wall_build_hitbox_cache may clobber BC, and deadly flag writes must
    ; still target the original entity slot on every exit path.
    push bc

    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a

    call wall_build_hitbox_cache

    ; Deadly tiles use a single sample point at the entity center.
    ; This avoids early kills when the hitbox edges approach a deadly tile.
    ; Center row = top + floor(height / 2)
    ld a, (wall_hit_h)
    srl a
    ld c, a
    ld a, (wall_hit_top)
    add a, c
    srl a
    srl a
    srl a
    ld b, a

    ; Center column = left + floor(width / 2)
    ld a, (wall_hit_w)
    srl a
    ld c, a
    ld a, (wall_hit_left)
    add a, c
    srl a
    srl a
    srl a
    ld c, a
    call deadly_tiles_runtime_tile_is_deadly_nb
    or a
    jp nz, .det_found
    jp .det_clear

  .det_found:
      pop bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      set 0, (hl)
      ld a, c
      or a
      ret nz
      ld a, 1
      ld (tileDead), a
      ld (tileDeadLatched), a
      ret
  
  .det_clear:
      pop bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      res 0, (hl)
      ld a, c
      or a
      ret nz
      xor a
      ld (tileDead), a
      ret

update_deadly_tiles_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.deadly_tiles_loop:
    ld c, (hl)
    inc hl
    push hl
    ld a, (player_runtime_enabled)
    or a
    jp z, .deadly_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, .deadly_skip_fast_player
.deadly_not_fast_player:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    pop hl
    and #20                       ; COMP_MASK_DEADLY_TILES (#2000) => high byte bit 5
    jr nz, .deadly_tiles_update

      push bc
      ld hl, entity_flag_deadly_tile
      ld e, c
      ld d, 0
      add hl, de
      res 0, (hl)
      ld a, c
      or a
      jr nz, .deadly_tiles_skip_debug_clear
      xor a
      ld (tileDead), a
.deadly_tiles_skip_debug_clear:
      pop bc
      jr .deadly_tiles_next

.deadly_tiles_update:
    push bc
    call update_entity_deadly_flag_runtime
    pop bc
    jr .deadly_tiles_next

.deadly_skip_fast_player:
    pop hl

.deadly_tiles_next:
    dec b
    jp nz, .deadly_tiles_loop
    ret

refresh_player_deadly_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #20
    jr nz, .player_deadly_update
    ld hl, entity_flag_deadly_tile
    add hl, de
    res 0, (hl)
    ret
.player_deadly_update:
    call update_entity_deadly_flag_runtime
    ret
`;
    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.deadly_tiles',
        kind: 'routine',
        owner: 'components',
        roots: ['init_deadly_tiles_system', 'update_deadly_tiles_component', 'update_entity_deadly_flag_runtime', 'deadly_tiles_runtime_tile_is_deadly_nb', 'refresh_player_deadly_fastpath'],
    });
}

function generateInWaterSystem(): string {
    return `
; ------------------------------------------------------------------
; IN WATER COMPONENT SYSTEM
; Purpose:
;   Scan active entities marked with comp_in_water and update
;   entity_flag_in_water bit 0 when the entity center is inside a
;   runtime Effect Zone whose type is EFFECT_TYPE_WATER.
; Notes:
;   - Detection uses effect zones, not behavior-map tile flags.
;   - The component is stored in entity_in_water_cfg_enabled because
;     the 16-bit ECS component mask has no free bit left.
; ------------------------------------------------------------------
init_in_water_system:
    ld hl, entity_flag_in_water
    ld de, entity_flag_in_water + 1
    ld bc, 31
    xor a
    ld (hl), a
    ldir
    ret

update_entity_in_water_flag_runtime:
    ; Input: C = entity index
    ; Output: entity_flag_in_water[C] bit 0 refreshed
    ; Clobbers: AF, BC, DE, HL, IX
    ; Preserves: original entity index by stack until writeback
    push bc

    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld (wall_temp_x), a           ; center X in cells

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld (wall_temp_y), a           ; center Y in cells

    ld a, (current_effect_zone_count)
    or a
    jp z, .in_water_clear

    ld d, a                       ; D = remaining zone count
    ld ix, runtime_effect_zone_table

.in_water_scan_loop:
    ld a, d
    or a
    jp z, .in_water_clear

    ld a, (ix+4)
    cp EFFECT_TYPE_WATER
    jp nz, .in_water_next_entry

    ld a, (wall_temp_x)
    cp (ix+0)                     ; zone.x
    jp c, .in_water_next_entry
    sub (ix+0)
    ld e, a                       ; E = deltaX

    ld a, (wall_temp_y)
    cp (ix+1)                     ; zone.y
    jp c, .in_water_next_entry
    sub (ix+1)
    ld h, a                       ; H = deltaY

    ld a, (ix+2)                  ; zone.width
    cp e                          ; width > deltaX?
    jp z, .in_water_next_entry
    jp c, .in_water_next_entry

    ld a, (ix+3)                  ; zone.height
    cp h                          ; height > deltaY?
    jp z, .in_water_next_entry
    jp c, .in_water_next_entry

    jp .in_water_found

.in_water_next_entry:
    ld bc, EFFECT_ZONE_ENTRY_SIZE
    add ix, bc
    dec d
    jp .in_water_scan_loop

.in_water_found:
    pop bc
    ld hl, entity_flag_in_water
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)
    ret

.in_water_clear:
    pop bc
    ld hl, entity_flag_in_water
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)
    ret

update_in_water_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.in_water_entity_loop:
    ld c, (hl)
    inc hl
    push hl
    push bc

    ld e, c
    ld d, 0
    ld hl, entity_in_water_cfg_enabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .in_water_entity_clear

    call update_entity_in_water_flag_runtime
    jp .in_water_entity_done

.in_water_entity_clear:
    ld hl, entity_flag_in_water
    add hl, de
    res 0, (hl)

.in_water_entity_done:
    pop bc
    pop hl
    dec b
    jp nz, .in_water_entity_loop
    ret
`;
}

function generateTileInteractionSystem(
    analysis: ProjectAnalysis,
    tileCollectorConfig: {
        soundAssetIndex: number | null;
        replacementTileChar: number;
        targetVariable: { asmName: string; isWord: boolean } | null;
        incrementAmount: number;
        flagVariable: { asmName: string; isWord: boolean } | null;
        flagValue: number;
        bonusTileChar: number | null;
        bonusReplacementTileChar: number;
        bonusSoundAssetIndex: number | null;
        bonusIsPersistent: boolean;
        bonusEntityEffect: string;
        bonusEffectAmount: number;
        bonusSlashStrength: number;
        bonusRespawnSeconds: number;
    },
    canUseSoundAssetPlayback: boolean,
    hasWallCollision: boolean = false
): string {
    const collectionSoundAssetIndex = tileCollectorConfig.soundAssetIndex;
    const interactionTargetVariables = buildOrderedGlobalVariableInfos(analysis);
    const replacementTileChar = tileCollectorConfig.replacementTileChar;
    const bonusSlashStrength = Math.max(1, Math.min(32, tileCollectorConfig.bonusSlashStrength || 8));
    const bonusSlashUpStrength = Math.max(1, bonusSlashStrength - 1);
    const bonusSlashDownStrength = Math.max(1, bonusSlashStrength - 2);
    const bonusSlashLeftByte = `#${((256 - bonusSlashStrength) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`;
    const bonusSlashUpLeftByte = `#${((256 - bonusSlashUpStrength) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`;
    const bonusSlashDownLeftByte = `#${((256 - bonusSlashDownStrength) & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`;
    const collectionSoundCode =
        collectionSoundAssetIndex !== null && canUseSoundAssetPlayback
            ? `    ; Tile Collector UI-configured collection sound.
    ; Preserve DE because it still carries the tile index for persistence.
    push de
    ld a, ${collectionSoundAssetIndex}
    call SM_PlaySoundAsset
    pop de
`
            : collectionSoundAssetIndex !== null
                ? `    ; collectionSoundId is configured in the Tile Collector UI,
    ; but this build has no state-machine sound asset runtime.
    ; Stay silent instead of forcing the wrong built-in beep.
`
                : `    ; No collectionSoundId configured in the Tile Collector UI.
`;
    const bonusSoundCode =
        tileCollectorConfig.bonusSoundAssetIndex !== null && canUseSoundAssetPlayback
            ? `    ; Tile Collector bonus pickup sound.
    push de
    ld a, ${tileCollectorConfig.bonusSoundAssetIndex}
    call SM_PlaySoundAsset
    pop de
`
            : tileCollectorConfig.bonusSoundAssetIndex !== null
                ? `    ; bonusSoundId is configured, but this build has no state-machine sound asset runtime.
`
                : `    ; No bonusSoundId configured.
`;
    const buildHudSyncCode = (variableInfo: { asmName: string; isWord: boolean } | null) => variableInfo?.asmName === 'global_var_score'
        ? `    ; Keep HUD Score text in sync with the updated global variable.
    push de
    call force_render_hud
    pop de
`
        : variableInfo?.asmName === 'global_var_lives'
            ? `    ; Keep HUD Lives text in sync with the updated global variable.
    push de
    ld a, (${variableInfo.asmName})
    call update_hud_lives
    call force_render_hud
    pop de
`
            : '';
    const interactionTargetPointerTableCode = `interaction_target_variable_ptr_table:
    dw 0
${interactionTargetVariables.map((variable) => `    dw ${variable.asmName}`).join('\n')}
`;
    const interactionTargetWordFlagTableCode = `interaction_target_variable_word_table:
    db 0
${interactionTargetVariables.map((variable) => `    db ${variable.isWord ? 1 : 0}`).join('\n')}
`;
    const hudSyncCode = buildHudSyncCode(tileCollectorConfig.targetVariable);

    const variableIncrementCode = tileCollectorConfig.targetVariable && tileCollectorConfig.incrementAmount > 0
        ? tileCollectorConfig.targetVariable.isWord
            ? `    ; Tile Collector configured variable increment (16-bit).
    ld hl, ${tileCollectorConfig.targetVariable.asmName}
    ld a, (hl)
    add a, ${(tileCollectorConfig.incrementAmount & 0xFF)}
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, ${((tileCollectorConfig.incrementAmount >> 8) & 0xFF)}
    ld (hl), a
${hudSyncCode}
`
            : `    ; Tile Collector configured variable increment (8-bit).
    ld hl, ${tileCollectorConfig.targetVariable.asmName}
    ld a, (hl)
    add a, ${Math.min(255, tileCollectorConfig.incrementAmount)}
    ld (hl), a
${hudSyncCode}
`
        : `    ; No targetVariable/incrementAmount configured in the Tile Collector UI.
`;
    const flagAssignCode = tileCollectorConfig.flagVariable
        ? tileCollectorConfig.flagVariable.isWord
            ? `    ; Tile Collector pickup flag assignment (16-bit).
    ld hl, ${tileCollectorConfig.flagVariable.asmName}
    ld a, ${(tileCollectorConfig.flagValue & 0xFF)}
    ld (hl), a
    inc hl
    ld a, ${((tileCollectorConfig.flagValue >> 8) & 0xFF)}
    ld (hl), a
${buildHudSyncCode(tileCollectorConfig.flagVariable)}
`
            : `    ; Tile Collector pickup flag assignment (8-bit).
    ld hl, ${tileCollectorConfig.flagVariable.asmName}
    ld a, ${Math.min(255, tileCollectorConfig.flagValue)}
    ld (hl), a
${buildHudSyncCode(tileCollectorConfig.flagVariable)}
`
        : `    ; No flagVariable configured in the Tile Collector UI.
`;
    const slashTotalPixels = bonusSlashStrength * 8;  // 10 * 8 = 80px = 10 tiles
    const slashTotalPixelsNeg = ((256 - slashTotalPixels) & 0xFF);
    const bonusEffectCode =
        tileCollectorConfig.bonusEntityEffect === 'grant_extra_jump' && tileCollectorConfig.bonusEffectAmount > 0
            ? `    ; Bonus tile effect: 8px-per-frame slash in current movement direction.
    ; Covers ${bonusSlashStrength} tiles (${slashTotalPixels}px). Checks solid tiles each step.
    push de
    ld e, c
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ; --- Set slash_vel_x = sign(vel_x) * ${slashTotalPixels} ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_x_zero
    bit 7, a
    jp nz, .ti_slash_x_neg
    ld a, ${slashTotalPixels}          ; +${slashTotalPixels} (moving right)
    jp .ti_slash_x_set
.ti_slash_x_neg:
    ld a, #${slashTotalPixelsNeg.toString(16).toUpperCase().padStart(2, '0')}          ; -${slashTotalPixels} (moving left)
.ti_slash_x_set:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), a
    jp .ti_slash_x_done
.ti_slash_x_zero:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
.ti_slash_x_done:

    ; --- Set slash_vel_y = sign(vel_y) * ${slashTotalPixels} ---
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_y_zero
    bit 7, a
    jp nz, .ti_slash_y_neg
    ld a, ${slashTotalPixels}          ; +${slashTotalPixels} (moving down)
    jp .ti_slash_y_set
.ti_slash_y_neg:
    ld a, #${slashTotalPixelsNeg.toString(16).toUpperCase().padStart(2, '0')}          ; -${slashTotalPixels} (moving up)
.ti_slash_y_set:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), a
    jp .ti_slash_y_done
.ti_slash_y_zero:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
.ti_slash_y_done:

    ; Zero gravity so it doesn't fight the vertical slash
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.ti_bonus_done:
    pop de
`
            : `    ; No supported bonus entity effect configured.
`;
    const bonusCollectBranchCode = tileCollectorConfig.bonusTileChar !== null
        ? `    ld a, b
    cp ${tileCollectorConfig.bonusTileChar}
    jp z, .ti_collect_bonus
`
        : '';
    const bonusPersistenceCode = tileCollectorConfig.bonusIsPersistent
        ? `    ; Bonus tile configured as persistent: record it like a normal collectible.
    jp .ti_record_persistent
`
        : `    ; Bonus tile is visit-local only: do not persist across screen reloads.
    jp .ti_next
`;
    const timedBonusRespawnEnabled = tileCollectorConfig.bonusTileChar !== null && tileCollectorConfig.bonusRespawnSeconds > 0;
    const bonusRespawnContinuationCode = timedBonusRespawnEnabled
        ? `    ; Timed bonus respawn enabled: queue tile restoration and skip persistence.
    call record_bonus_respawn_slot
    jp .ti_next
`
        : bonusPersistenceCode;
    const bonusRespawnRuntimeCode = timedBonusRespawnEnabled
        ? `
record_bonus_respawn_slot:
    ld a, d
    push af
    ld a, e
    push af
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.rbr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .rbr_store
    inc c
    dec b
    jp nz, .rbr_loop
    pop af
    pop af
    ret
.rbr_store:
    ld (hl), ${tileCollectorConfig.bonusRespawnSeconds}
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    pop af
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    pop af
    ld (hl), a
    ret

update_bonus_respawns:
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.ubr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    ld a, (hl)
    push af
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    ld a, (hl)
    ld d, a
    pop af
    ld e, a
    push bc
    ld hl, NAMETBL
    add hl, de
    ld a, ${tileCollectorConfig.bonusTileChar}
    call FAST_WRTVRM
    pop bc
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), #08
.ubr_clear_slot:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld (hl), 0
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 0
.ubr_next:
    inc c
    dec b
    jp nz, .ubr_loop
    ret
`
        : `
record_bonus_respawn_slot:
    ret

update_bonus_respawns:
    ret
`;
    const hasBonusSlashEffect = tileCollectorConfig.bonusEntityEffect === 'grant_extra_jump' && tileCollectorConfig.bonusEffectAmount > 0;
    const wallBehaviorHelperCode = hasWallCollision || !hasBonusSlashEffect
        ? ``
        : `
; ------------------------------------------------------------------
; wall_behavior_is_full_blocker
; Input:  A = behavior byte or family bits
; Output: Z = passable / top-solid platform, NZ = full blocker
; Clobbers: AF
; Notes:
;   - TileInteraction slash movement can exist without WallCollision.
;     Keep this helper local to that case so Glass always has a target.
; ------------------------------------------------------------------
wall_behavior_is_full_blocker:
    and #F0
    ret z
    cp #20
    ret z
    or a
    ret
`;

    let asm = `
; ==================================================================
; TILE INTERACTION SYSTEM
; ==================================================================
; Checks if any entity with COMP_INPUT overlaps a tile marked as
; Interactable (mapId & #08 != 0) in the runtime behavior map.
; When found: removes tile from screen and increments gem_count.
; ------------------------------------------------------------------
; Called once per frame from update_all_entities.
; ------------------------------------------------------------------
${wallBehaviorHelperCode}

${interactionTargetPointerTableCode}
${interactionTargetWordFlagTableCode}

init_tile_interaction_system:
    ld hl, entity_slash_vel_x
    ld de, entity_slash_vel_x+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_slash_vel_y
    ld de, entity_slash_vel_y+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_x
    ld de, entity_button_contact_x+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_y
    ld de, entity_button_contact_y+1
    ld bc, 31
    ld (hl), 0
    ldir
    xor a
    ld (last_interaction_pending), a
    ret

; ------------------------------------------------------------------
; update_slash_component
; Tile-by-tile slash: moves entity exactly 8px per frame, checking
; for solid tiles before each step.  Covers the remaining distance
; stored in entity_slash_vel_x/y (decayed by 8 each frame).
; ------------------------------------------------------------------
update_slash_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.slash_loop:
    ld c, (hl)
    inc hl
    push hl                    ; Save list pointer
    ld e, c
    ld d, 0

    ; Check if entity has any slash velocity (X or Y)
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    ld hl, entity_slash_vel_y
    add hl, de
    or (hl)
    jp z, .slash_next          ; both zero → skip

    push bc

    ; --- Build hitbox for tile checks (reuse wall_hit_* scratch) ---
    ; hitbox_left = entity_x + collision_offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    add a, (hl)
    ld (wall_hit_left), a

    ; hitbox_right = left + w - 1
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_w_ok
    ld a, 1
.sl_w_ok:
    ld c, a
    ld a, (wall_hit_left)
    add a, c
    dec a
    ld (wall_hit_right), a

    ; hitbox_top = entity_y + collision_offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    ld (wall_hit_top), a

    ; hitbox_bottom = top + h - 1
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_h_ok
    ld a, 1
.sl_h_ok:
    ld c, a
    ld a, (wall_hit_top)
    add a, c
    dec a
    ld (wall_hit_bottom), a

    ; ============ PROCESS X SLASH ============
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_x_done
    bit 7, a
    jp nz, .slash_x_left

.slash_x_right:
    ; Check tile at column (hitbox_right + 8) / 8
    ld a, (wall_hit_right)
    add a, 8
    jp c, .slash_x_stop        ; overflow → screen edge
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = +8, decay slash_vel_x by 8
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_x_store
    xor a
.slash_x_store:
    ld (hl), a
    jp .slash_x_done

.slash_x_left:
    ; Check tile at column (hitbox_left - 8) / 8
    ld a, (wall_hit_left)
    cp 8
    jp c, .slash_x_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = -8, decay slash_vel_x by 8 toward 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_x_store_l
    xor a                      ; crossed zero → clamp
.slash_x_store_l:
    ld (hl), a
    jp .slash_x_done

.slash_x_stop:
    ; Hit solid tile or screen edge → kill X slash and X velocity
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0

.slash_x_done:

    ; ============ PROCESS Y SLASH ============
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_y_done
    bit 7, a
    jp nz, .slash_y_up

.slash_y_down:
    ; Check tile at row (hitbox_bottom + 8) / 8
    ld a, (wall_hit_bottom)
    add a, 8
    cp 192
    jp nc, .slash_y_stop       ; off-screen bottom
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = +8, decay slash_vel_y by 8
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_y_store
    xor a
.slash_y_store:
    ld (hl), a
    jp .slash_y_done

.slash_y_up:
    ; Check tile at row (hitbox_top - 8) / 8
    ld a, (wall_hit_top)
    cp 8
    jp c, .slash_y_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = -8, decay slash_vel_y by 8 toward 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_y_store_u
    xor a
.slash_y_store_u:
    ld (hl), a
    jp .slash_y_done

.slash_y_stop:
    ; Hit solid tile or screen edge → kill Y slash and Y velocity
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

.slash_y_done:
    pop bc

.slash_next:
    pop hl
    dec b
    jp nz, .slash_loop
    ret

${bonusRespawnRuntimeCode}

; ------------------------------------------------------------------
; Generic interaction helpers
; ------------------------------------------------------------------
resolve_interaction_target_ptr:
    push de
    ld e, a
    ld d, 0
    push de
    ld hl, interaction_target_variable_ptr_table
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    pop de
    push hl
    ld hl, interaction_target_variable_word_table
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    ret

interaction_add_last_value_default1:
    push bc
    push de
    ld a, (last_interaction_target)
    or a
    jr z, .iat_add_done
    call resolve_interaction_target_ptr
    ld b, a
    ld a, h
    or l
    jr z, .iat_add_done
    ld a, (last_interaction_value)
    or a
    jr nz, .iat_add_have_amount
    ld a, 1
.iat_add_have_amount:
    ld c, a
    ld a, b
    or a
    jr z, .iat_add_byte
    ld a, (hl)
    add a, c
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, 0
    ld (hl), a
    jr .iat_add_sync
.iat_add_byte:
    ld a, (hl)
    add a, c
    ld (hl), a
.iat_add_sync:
    call force_render_hud
.iat_add_done:
    pop de
    pop bc
    ret

interaction_set_last_value_default1:
    push bc
    push de
    ld a, (last_interaction_target)
    or a
    jr z, .iat_set_done
    call resolve_interaction_target_ptr
    ld b, a
    ld a, h
    or l
    jr z, .iat_set_done
    ld a, (last_interaction_value)
    or a
    jr nz, .iat_set_have_value
    ld a, 1
.iat_set_have_value:
    ld c, a
    ld a, b
    or a
    jr z, .iat_set_byte
    ld a, c
    ld (hl), a
    inc hl
    xor a
    ld (hl), a
    jr .iat_set_sync
.iat_set_byte:
    ld a, c
    ld (hl), a
.iat_set_sync:
    call force_render_hud
.iat_set_done:
    pop de
    pop bc
    ret

interaction_toggle_target_lowbit:
    push bc
    push de
    ld a, (last_interaction_target)
    or a
    jr z, .iat_toggle_done
    call resolve_interaction_target_ptr
    ld a, h
    or l
    jr z, .iat_toggle_done
    ld a, (hl)
    xor 1
    ld (hl), a
    call force_render_hud
.iat_toggle_done:
    pop de
    pop bc
    ret

interaction_clear_button_contact_c:
    push hl
    push de
    ld e, c
    ld d, 0
    ld hl, entity_button_contact_active
    add hl, de
    ld (hl), 0
    pop de
    pop hl
    ret

interaction_clear_behavior_at_de:
    push hl
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop hl
    ret

interaction_clear_vram_tile_at_de:
    push hl
    ld hl, NAMETBL
    add hl, de
    ld a, ${replacementTileChar}
    call FAST_WRTVRM
    pop hl
    ret

; ------------------------------------------------------------------
; check_tile_interaction
; Purpose:
;   Scan active input-driven entities against the interactable tile map,
;   dispatch the configured per-tile interaction, and update persistence/runtime state.
; Input:
;   None (reads active_entity_list / input_entity_count and runtime maps)
; Output:
;   None
; Clobbers:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; ------------------------------------------------------------------
check_tile_interaction:
    xor a
    ld (last_interaction_pending), a
    call scan_tile_interaction_entities
    call update_bonus_respawns
    ret

scan_tile_interaction_entities:
    ld a, (input_entity_count)
    or a
    ret z                         ; No active entities

    ld hl, input_entity_list
    ld b, a                        ; B = entity count

.ti_loop:
    ld c, (hl)                     ; C = entity index
    ld a, (player_runtime_enabled)
    or a
    jp z, .ti_process_entity
    ld a, (player_entity_index)
    cp c
    jp z, .ti_skip_fast_player
.ti_process_entity:
    push hl                        ; Save list pointer
    push bc                        ; Save count(B) + entity(C)

    ; Check COMP_MASK_INPUT (bit 4, value #10 in low mask byte)
    ld e, c
    ld d, 0                        ; DE = entity index
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .ti_next                 ; No input component → skip

    ; Deadly state is produced earlier by update_deadly_tiles_component.
    ; Tile interaction only consumes entity_flag_deadly_tile.

    ; Get center X
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center X = x + 8
    push af                        ; Save centerX

    ; Get center Y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center Y = y + 8
    ld e, a                        ; E = centerY

    pop af                         ; A = centerX
    ld d, a                        ; D = centerX, E = centerY

    ; Convert pixel → tile coords (div 8 via 3x rrca + and #1F)
    ld a, d
    rrca
    rrca
    rrca
    and #1F
    ld d, a                        ; D = tileX (0-31)

    ld a, e
    rrca
    rrca
    rrca
    and #1F
    ld e, a                        ; E = tileY (0-23)

    ; Keep a foot probe row for floor-mounted interactions such as jumpers.
    ; Center sampling is still tried first to preserve collectible behavior.
    push de                        ; Preserve center tileX/tileY
    ld e, c
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 16                      ; one pixel below a 16px player footprint
    rrca
    rrca
    rrca
    and #1F
    pop de                         ; Restore center tileX/tileY
    push af                        ; Save foot tileY for fallback
    push de                        ; Save tileX/tileY for last_interaction_*

    ; Compute idx = tileY * 32 + tileX
    ld h, 0
    ld l, e                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld b, 0
    ld c, d                        ; BC = tileX
    add hl, bc                     ; HL = idx

    push hl                        ; Save idx

    ; Check runtime_behavior_map[idx]
    ld de, runtime_behavior_map
    add hl, de                     ; HL = &runtime_behavior_map[idx]
    ld a, (hl)
    and #08                        ; INTERACTABLE flag (bit 3)
    jp z, .ti_try_feet_probe

.ti_interaction_found:
    ; Recover tile index and tile coordinates for the interaction dispatcher.
    pop de                         ; DE = idx
    pop hl                         ; H = tileX, L = tileY
    pop af                         ; Discard saved probe row
    pop bc                         ; B = loop count, C = entity index
    push bc                        ; Restore loop state for .ti_next
    ld a, h
    ld (last_interaction_x), a
    ld a, l
    ld (last_interaction_y), a
    ld a, c
    ld (last_interaction_entity), a

    ; 0. Read char code from VRAM Name Table BEFORE clearing VRAM.
    ;    Stored in last_interaction_char / last_gem_char for SM comparisons.
    push de                        ; Preserve DE = idx across VRAM read setup
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx (VRAM address to read)
    ; MSX1 direct VRAM read (port #99 = address register, port #98 = data)
    ld a, l
    out (#99), a                   ; Set VRAM address low byte
    ld a, h
    and #3F                        ; Bits 7,6 = 0 → read mode
    out (#99), a                   ; Set VRAM address high byte
    nop                            ; Short delay for VDP address latch
    nop
    in a, (#98)                    ; A = char code from VRAM data port
    ld (last_interaction_char), a
    ld b, a                        ; Preserve collected char code for bonus-tile compare
    pop de                         ; Restore DE = idx

    push de
    ld hl, runtime_interaction_type_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_type), a
    pop de

    push de
    ld hl, runtime_interaction_value_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_value), a
    pop de

    push de
    ld hl, runtime_interaction_target_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_target), a
    pop de

    ld a, (last_interaction_type)
    cp 5
    jr z, .ti_dispatch_ready
    call interaction_clear_button_contact_c
.ti_dispatch_ready:
    ld a, (last_interaction_type)
    cp 1
    jp z, .ti_collect_gem
    cp 2
    jp z, .ti_collect_item
    cp 3
    jp z, .ti_add_energy
    cp 4
    jp z, .ti_lever_toggle
    cp 5
    jp z, .ti_button_press
    cp 6
    jp z, .ti_jumper
    cp 7
    jp z, .ti_next
    jp .ti_next

.ti_collect_gem:
    call interaction_clear_behavior_at_de
${bonusCollectBranchCode}
    jp .ti_collect_gem_normal

.ti_collect_gem_normal:
    call interaction_clear_vram_tile_at_de

    ; 3. Increment gem_count
    ld hl, gem_count
    inc (hl)

${variableIncrementCode}
${flagAssignCode}
    call interaction_add_last_value_default1

${collectionSoundCode}

    ; 4. Record in persistent collected list (survives screen re-entry via apply_collected_tiles)
    ;    FAST_WRTVRM preserves all registers, so DE = idx is still valid here.
.ti_record_persistent:
    ld a, (collected_count)
    cp MAX_COLLECTIBLES
    jp nc, .ti_next                ; List full - skip recording
    ld c, a                        ; C = index = old collected_count
    ld b, 0                        ; BC = (0, index)
    ; Store world+screen ID of the collected tile
    ld hl, collected_world
    add hl, bc
    ld a, (current_world_id)
    ld (hl), a
    ld hl, collected_screen
    add hl, bc
    ld a, (current_screen_id)
    ld (hl), a
    ; Store tile name-table index (DE = idx, preserved by FAST_WRTVRM)
    ld hl, collected_idx_l
    add hl, bc
    ld (hl), e                     ; E = idx low byte
    ld hl, collected_idx_h
    add hl, bc
    ld (hl), d                     ; D = idx high byte
    ; Increment collected_count
    ld hl, collected_count
    inc (hl)

    jp .ti_next

.ti_collect_item:
    call interaction_clear_behavior_at_de
    call interaction_clear_vram_tile_at_de
    call interaction_add_last_value_default1
    jp .ti_record_persistent

.ti_add_energy:
    call interaction_clear_behavior_at_de
    call interaction_clear_vram_tile_at_de
    ld a, (last_interaction_value)
    or a
    jr nz, .ti_add_energy_amount_ready
    ld a, 1
.ti_add_energy_amount_ready:
    call increase_entity_lives
    call interaction_add_last_value_default1
    jp .ti_record_persistent

.ti_lever_toggle:
    call interaction_clear_behavior_at_de
    call interaction_toggle_target_lowbit
    jp .ti_next

.ti_button_press:
    ld e, c
    ld d, 0
    ld hl, entity_button_contact_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .ti_button_press_arm

    push hl
    ld hl, entity_button_contact_x
    add hl, de
    ld a, (last_interaction_x)
    cp (hl)
    jr nz, .ti_button_press_rearm
    ld hl, entity_button_contact_y
    add hl, de
    ld a, (last_interaction_y)
    cp (hl)
    jr nz, .ti_button_press_rearm
    pop hl
    jp .ti_next

.ti_button_press_rearm:
    pop hl
.ti_button_press_arm:
    ld (hl), 1
    ld hl, entity_button_contact_x
    add hl, de
    ld a, (last_interaction_x)
    ld (hl), a
    ld hl, entity_button_contact_y
    add hl, de
    ld a, (last_interaction_y)
    ld (hl), a
    ld a, 1
    ld (last_interaction_pending), a
    jp .ti_next

.ti_jumper:
    ld a, (last_interaction_value)
    cp 8
    jr nc, .ti_jumper_strength_ready
    ld a, 8
.ti_jumper_strength_ready:
    ld b, a
    ld e, c
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)
    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255
    ld a, b
    cpl
    inc a
    push af
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), a
    pop af
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    jp .ti_next

.ti_collect_bonus:
    ; Bonus tile path: independent from normal collectible gem logic.
    push hl
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx
    ld a, ${tileCollectorConfig.bonusReplacementTileChar}
    call FAST_WRTVRM
    pop hl

${bonusEffectCode}

${bonusSoundCode}

${bonusRespawnContinuationCode}

.ti_try_feet_probe:
    pop hl                         ; Discard center idx
    pop de                         ; D = center tileX, E = center tileY
    pop af                         ; A = foot tileY
    cp e
    jp z, .ti_no_collect_unstacked ; Same row already tested
    ld e, a                        ; Retry with same tileX and foot tileY
    push af                        ; Keep stack shape consistent with center probe
    push de                        ; Save foot tileX/tileY for last_interaction_*
    ld h, 0
    ld l, e                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld b, 0
    ld c, d                        ; BC = tileX
    add hl, bc                     ; HL = idx
    push hl                        ; Save idx
    ld de, runtime_behavior_map
    add hl, de
    ld a, (hl)
    and #08
    jp nz, .ti_interaction_found

.ti_no_collect:
    pop hl                         ; Balance idx push
    pop de                         ; Balance tileX/tileY push
    pop af                         ; Balance saved probe row
    pop bc                         ; Restore B=count, C=entity
    push bc
    call interaction_clear_button_contact_c
    jp .ti_next

.ti_no_collect_unstacked:
    pop bc                         ; Restore B=count, C=entity
    push bc
    call interaction_clear_button_contact_c

.ti_next:
    pop bc                         ; Restore B=count, C=entity
    pop hl                         ; Restore list pointer
    inc hl                         ; Advance to next entity
    dec b
    jp nz, .ti_loop                ; djnz replaced with jp nz (loop body > 127 bytes)
    ret

.ti_skip_fast_player:
    inc hl
    dec b
    jp nz, .ti_loop
    ret

refresh_player_tile_interaction_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z

    ld a, (player_runtime_enabled)
    push af
    ld a, (input_entity_count)
    push af
    ld a, (input_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (input_entity_list), a
    ld a, 1
    ld (input_entity_count), a
    call scan_tile_interaction_entities

    pop af
    ld (input_entity_list), a
    pop af
    ld (input_entity_count), a
    pop af                         ; Saved runtime was nonzero; force it back on.
    ld a, 1
    ld (player_runtime_enabled), a
    ret
`;

    if (!hasBonusSlashEffect) {
        asm = stripUnusedTileSlashRuntime(asm);
    }

    return wrapMideasAsmBlock(asm, {
        id: 'runtime.components.tile_interaction',
        kind: 'routine',
        owner: 'components',
        roots: [
            'update_slash_component',
            'check_tile_interaction',
            'scan_tile_interaction_entities',
            'refresh_player_tile_interaction_fastpath',
        ],
    });
}

/**
 * Generate apply_collected_tiles function.
 * Re-applies the persistent collection list for the current world/screen after any screen load,
 * so collected gems/tiles do not respawn when the player re-enters a screen.
 */
function generateApplyCollectedTiles(): string {
    return wrapMideasAsmBlock(`
; ------------------------------------------------------------------
; apply_collected_tiles
; Re-clears tiles that were previously collected on the current world/screen.
; Called after every screen load so collected tiles do not respawn.
; Input:  current_world_id and current_screen_id must already be set.
; Output: None
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
apply_collected_tiles:
    ld a, (collected_count)
    or a
    ret z                          ; Nothing collected yet - return early

    ld b, a                        ; B = djnz counter (total collected entries)
    ld c, 0                        ; C = loop index
.apply_ct_loop:
    ; DE = (0, index) used for all three table lookups.
    ; add hl, de does NOT modify DE, so we can reuse it for all 3 tables.
    ld d, 0
    ld e, c                        ; DE = (0, current index)

    ; Check if this entry belongs to current world
    ld hl, collected_world
    add hl, de                     ; HL = &collected_world[index]
    ld a, (current_world_id)       ; A = world currently loaded
    cp (hl)                        ; Compare with stored world ID
    jr nz, .apply_ct_skip          ; Different world - skip

    ; Check if this entry belongs to current screen
    ld hl, collected_screen
    add hl, de                     ; HL = &collected_screen[index]
    ld a, (current_screen_id)      ; A = screen currently loaded
    cp (hl)                        ; Compare with stored screen ID
    jr nz, .apply_ct_skip          ; Different screen - skip

    ; Entry matches current screen: re-clear this tile
    push bc                        ; Save B=count, C=index across FAST_WRTVRM

    ; Build tile index: D = idx_h, E = idx_l
    ; (DE is still (0, index) because add hl, de never modifies DE)
    ld hl, collected_idx_l
    add hl, de                     ; HL = &collected_idx_l[index]
    ld a, (hl)
    push af                        ; Save idx_l on stack

    ld hl, collected_idx_h
    add hl, de                     ; HL = &collected_idx_h[index], DE still (0, index)
    ld a, (hl)
    ld d, a                        ; D = idx_h

    pop af                         ; A = idx_l
    ld e, a                        ; E = idx_l
    ; DE = tile index (D=high, E=low)

    ; Re-clear runtime_behavior_map[idx]
    push de                        ; Save idx
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop de                         ; Restore idx

    ; Re-clear VRAM Name Table (NAMETBL + idx)
    ld hl, NAMETBL
    add hl, de
    xor a                          ; A = 0 (empty tile char)
    call FAST_WRTVRM               ; Preserves all registers

    pop bc                         ; Restore B=count, C=index

.apply_ct_skip:
    inc c
    djnz .apply_ct_loop
    ret
`, {
        id: 'runtime.components.collected_tiles',
        kind: 'routine',
        owner: 'components',
        roots: ['apply_collected_tiles'],
    });
}

/**
 * Generate Collectible Component System
 * For items that can be collected (coins, power-ups, etc.)
 */
function generateCollectibleSystem(): string {
    return `
    ; ==================================================================
    ; COLLECTIBLE COMPONENT SYSTEM
    ; ==================================================================
    ; Items that can be collected when player touches them
    ; Increments score/counters and deactivates item

init_collectible_system:
    ld hl, entity_collectible_enabled
    ld de, entity_collectible_enabled + 1
    ld bc, 31
    xor a
    ld (hl), a
    ldir
    ret

; ------------------------------------------------------------------
; update_collectible_component
; Check collisions between collectibles and player
; When collected: deactivate item, increment score
; ------------------------------------------------------------------
update_collectible_component:
    call resolve_runtime_hero_entity
    cp #FF
    ret z
    ld c, 0                       ; Entity index

.collect_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jp z, .collect_next

    ; Skip the hero and any non-collectible entities.
    ld a, (hero_entity_id)
    cp c
    jp z, .collect_next
    ld hl, entity_collectible_enabled
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jp z, .collect_next

    ; Check collision against resolved hero entity
    ; Get collectible position
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible X

    ; Get player X position
    ld hl, entity_x_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player X

    ; Check X distance
    sub b                         ; A = collectible_x - player_x
    ; Check if within range (-16 to +16)
    cp 240                        ; Negative check (< -16)
    jp c, .collect_next
    cp 16                         ; Positive check (> +16)
    jp nc, .collect_next

    ; X is close, check Y
    ld hl, entity_y_pos
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = collectible Y

    ld hl, entity_y_pos
    ld a, (hero_entity_id)
    ld e, a
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = player Y

    sub b                         ; A = collectible_y - player_y
    cp 240
    jp c, .collect_next
    cp 16
    jp nc, .collect_next

    ; Collision detected - collect item!
    push bc

    ; Deactivate collectible (set entity_active[c] = 0)
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld (hl), 0                    ; Deactivate entity
    ld hl, active_entity_list_dirty
    ld (hl), 1

    ; TODO: Increment score or item counter
    ; ld hl, player_score
    ; inc (hl)

    ; Built-in collection sound (coin)
    ld a, 4
    call play_sound_effect

    pop bc

.collect_next:
    inc c
    jp .collect_loop
    `;
}

function generateRetractableGateSystem(targetFormat: string = 'konami'): string {
    return applyMapperDataWindowPage(`
init_retractable_gate_system:
    ld hl, entity_gate_current_step
    ld de, entity_gate_current_step + 1
    ld bc, 31
    xor a
    ld (hl), a
    ldir

    ld hl, entity_gate_step_timer
    ld de, entity_gate_step_timer + 1
    ld bc, 31
    xor a
    ld (hl), a
    ldir
    ret

; ------------------------------------------------------------------
; update_retractable_gate_component
; Drives one-shot retractable gates with timed per-char shifting.
; Entity arrays hold gate geometry and a global variable trigger.
; ------------------------------------------------------------------
update_retractable_gate_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld d, a
    ld hl, active_entity_list

.rg_loop:
    ld a, d
    or a
    ret z

    ld c, (hl)
    inc hl
    push hl
    push de
    ld b, 0

    ld hl, entity_gate_cfg_enabled
    add hl, bc
    ld a, (hl)
    or a
    jp z, .rg_next

    ld hl, entity_gate_current_step
    add hl, bc
    ld e, (hl)
    ld hl, entity_gate_cfg_total_steps
    add hl, bc
    ld a, (hl)
    cp e
    jp z, .rg_next
    jp c, .rg_next

    push bc
    call gate_trigger_condition_true
    pop bc
    or a
    jp z, .rg_next

    ld hl, entity_gate_current_step
    add hl, bc
    ld a, (hl)
    or a
    jr nz, .rg_check_timer

    push bc
    call gate_shift_area_one_step
    pop bc

    ld hl, entity_gate_current_step
    add hl, bc
    inc (hl)

    ld hl, entity_gate_cfg_step_delay
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, entity_gate_step_timer
    add hl, bc
    ld (hl), e
    jr .rg_next

.rg_check_timer:
    ld hl, entity_gate_step_timer
    add hl, bc
    ld a, (hl)
    or a
    jr z, .rg_arm_timer
    dec (hl)
    jr nz, .rg_next

    push bc
    call gate_shift_area_one_step
    pop bc

    ld hl, entity_gate_current_step
    add hl, bc
    inc (hl)

    ld hl, entity_gate_cfg_step_delay
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, entity_gate_step_timer
    add hl, bc
    ld (hl), e
    jr .rg_next

.rg_arm_timer:
    ld hl, entity_gate_cfg_step_delay
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, entity_gate_step_timer
    add hl, bc
    ld (hl), e

.rg_next:
    pop de
    pop hl
    dec d
    jp .rg_loop

; ------------------------------------------------------------------
; gate_trigger_condition_true
; Input: C = entity index
; Output: A = 1 when trigger condition is true, 0 otherwise
; Clobbers: AF, BC, DE, HL
; ------------------------------------------------------------------
gate_trigger_condition_true:
    ld b, 0

    ld l, c
    ld h, 0
    add hl, hl
    ld de, entity_gate_cfg_trigger_ptr
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ld hl, entity_gate_cfg_trigger_is_word
    add hl, bc
    ld a, (hl)
    or a
    ld hl, 0
    jr z, .rg_trigger_read_byte
    ld a, (de)
    ld l, a
    inc de
    ld a, (de)
    ld h, a
    jr .rg_trigger_current_ready

.rg_trigger_read_byte:
    ld a, (de)
    ld l, a

.rg_trigger_current_ready:
    ex de, hl                 ; DE = current value
    push de                   ; Preserve current value while loading target/operator

    ld l, c
    ld h, 0
    add hl, hl
    ld de, entity_gate_cfg_trigger_value
    add hl, de
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a                   ; HL = target value

    push hl
    ld hl, entity_gate_cfg_trigger_operator
    add hl, bc
    ld a, (hl)
    pop hl
    pop de                    ; DE = current value

    cp 1
    jr z, .rg_cmp_ne
    cp 2
    jr z, .rg_cmp_gt
    cp 3
    jr z, .rg_cmp_lt
    cp 4
    jr z, .rg_cmp_ge
    cp 5
    jr z, .rg_cmp_le

.rg_cmp_eq:
    ld a, d
    cp h
    jr nz, .rg_false
    ld a, e
    cp l
    jr nz, .rg_false
    jr .rg_true

.rg_cmp_ne:
    ld a, d
    cp h
    jr nz, .rg_true
    ld a, e
    cp l
    jr nz, .rg_true
    jr .rg_false

.rg_cmp_gt:
    or a
    sbc hl, de                ; target - current
    jr c, .rg_true
    jr .rg_false

.rg_cmp_lt:
    or a
    sbc hl, de                ; target - current
    jr z, .rg_false
    jr nc, .rg_true
    jr .rg_false

.rg_cmp_ge:
    or a
    sbc hl, de                ; target - current
    jr c, .rg_true
    jr z, .rg_true
    jr .rg_false

.rg_cmp_le:
    or a
    sbc hl, de                ; target - current
    jr nc, .rg_true
    jr .rg_false

.rg_true:
    ld a, 1
    ret

.rg_false:
    xor a
    ret

; ------------------------------------------------------------------
; gate_shift_area_one_step
; Input: C = entity index
; Shifts the configured gate window by exactly one char.
; ------------------------------------------------------------------
gate_shift_area_one_step:
    ld b, 0

    ld hl, entity_gate_cfg_fill_char
    add hl, bc
    ld a, (hl)
    ld (temp_byte_1), a

    ld hl, entity_gate_cfg_x
    add hl, bc
    ld a, (hl)
    ld (temp_byte_2), a

    ld hl, entity_gate_cfg_y
    add hl, bc
    ld a, (hl)
    ld (temp_byte_3), a

    ld hl, entity_gate_cfg_width
    add hl, bc
    ld a, (hl)
    ld (temp_byte_4), a

    ld hl, entity_gate_cfg_height
    add hl, bc
    ld a, (hl)
    ld (temp_byte_5), a

    ld hl, entity_gate_cfg_direction
    add hl, bc
    ld a, (hl)
    cp 2
    jp z, .rg_shift_down
    cp 3
    jp z, .rg_shift_left
    cp 4
    jp z, .rg_shift_right

.rg_shift_up:
    xor a
    ld (temp_byte_6), a       ; row
.rg_up_row_loop:
    ld a, (temp_byte_6)
    ld b, a
    ld a, (temp_byte_5)
    dec a
    cp b
    jr c, .rg_up_fill_last_row
    jr z, .rg_up_fill_last_row
    xor a
    ld (temp_byte_7), a       ; col
.rg_up_col_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_4)
    cp b
    jr z, .rg_up_next_row
    ld a, (temp_byte_2)
    add a, b
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_6)
    inc a
    add a, e
    ld e, a
    call gate_read_tile_at_xy
    ld b, a
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_7)
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_6)
    add a, e
    ld e, a
    ld a, b
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_up_col_loop
.rg_up_next_row:
    ld a, (temp_byte_6)
    inc a
    ld (temp_byte_6), a
    jr .rg_up_row_loop
.rg_up_fill_last_row:
    xor a
    ld (temp_byte_7), a
.rg_up_fill_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_4)
    cp b
    ret z
    ld a, (temp_byte_2)
    add a, b
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_5)
    dec a
    add a, e
    ld e, a
    ld a, (temp_byte_1)
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_up_fill_loop

.rg_shift_down:
    ld a, (temp_byte_5)
    dec a
    ld (temp_byte_6), a       ; row = height - 1
.rg_down_row_loop:
    ld a, (temp_byte_6)
    or a
    jr z, .rg_down_fill_first_row
    xor a
    ld (temp_byte_7), a
.rg_down_col_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_4)
    cp b
    jr z, .rg_down_prev_row
    ld a, (temp_byte_2)
    add a, b
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_6)
    dec a
    add a, e
    ld e, a
    call gate_read_tile_at_xy
    ld b, a
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_7)
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_6)
    add a, e
    ld e, a
    ld a, b
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_down_col_loop
.rg_down_prev_row:
    ld a, (temp_byte_6)
    dec a
    ld (temp_byte_6), a
    jr .rg_down_row_loop
.rg_down_fill_first_row:
    xor a
    ld (temp_byte_7), a
.rg_down_fill_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_4)
    cp b
    ret z
    ld a, (temp_byte_2)
    add a, b
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_1)
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_down_fill_loop

.rg_shift_left:
    xor a
    ld (temp_byte_6), a       ; col
.rg_left_col_loop:
    ld a, (temp_byte_6)
    ld b, a
    ld a, (temp_byte_4)
    dec a
    cp b
    jr c, .rg_left_fill_last_col
    jr z, .rg_left_fill_last_col
    xor a
    ld (temp_byte_7), a       ; row
.rg_left_row_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_5)
    cp b
    jr z, .rg_left_next_col
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_6)
    inc a
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    call gate_read_tile_at_xy
    ld b, a
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_6)
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    ld a, b
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_left_row_loop
.rg_left_next_col:
    ld a, (temp_byte_6)
    inc a
    ld (temp_byte_6), a
    jr .rg_left_col_loop
.rg_left_fill_last_col:
    xor a
    ld (temp_byte_7), a
.rg_left_fill_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_5)
    cp b
    ret z
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_4)
    dec a
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    ld a, (temp_byte_1)
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_left_fill_loop

.rg_shift_right:
    ld a, (temp_byte_4)
    dec a
    ld (temp_byte_6), a       ; col = width - 1
.rg_right_col_loop:
    ld a, (temp_byte_6)
    or a
    jr z, .rg_right_fill_first_col
    xor a
    ld (temp_byte_7), a       ; row
.rg_right_row_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_5)
    cp b
    jr z, .rg_right_prev_col
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_6)
    dec a
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    call gate_read_tile_at_xy
    ld b, a
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_6)
    add a, d
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    ld a, b
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_right_row_loop
.rg_right_prev_col:
    ld a, (temp_byte_6)
    dec a
    ld (temp_byte_6), a
    jr .rg_right_col_loop
.rg_right_fill_first_col:
    xor a
    ld (temp_byte_7), a
.rg_right_fill_loop:
    ld a, (temp_byte_7)
    ld b, a
    ld a, (temp_byte_5)
    cp b
    ret z
    ld a, (temp_byte_2)
    ld d, a
    ld a, (temp_byte_3)
    ld e, a
    ld a, (temp_byte_7)
    add a, e
    ld e, a
    ld a, (temp_byte_1)
    call gate_write_tile_at_xy
    ld a, (temp_byte_7)
    inc a
    ld (temp_byte_7), a
    jr .rg_right_fill_loop

gate_read_tile_at_xy:
    ld a, d
    cp 32
    jr nc, .rg_read_out
    ld a, e
    cp 24
    jr nc, .rg_read_out

    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de

    push hl
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, (hl)
    ld b, a
    call mapper_pop_p2
    pop hl
    ld a, b
    ret

.rg_read_out:
    xor a
    ret

gate_write_tile_at_xy:
    push af
    ld a, d
    cp 32
    jr nc, .rg_write_out
    ld a, e
    cp 24
    jr nc, .rg_write_out
    pop af

    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de
    ld b, a

    push hl
    ld de, (current_screen_layout)
    add hl, de
    call mapper_push_p2
    ld a, (current_screen_layout_bank)
    call mapper_set_bank_p2
    ld a, b
    ld (hl), a
    call mapper_pop_p2
    pop hl

    push hl
    ld de, (current_behavior_map)
    add hl, de
    call mapper_push_p2
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
    ld a, b
    or a
    jr z, .rg_write_store_passable
    ld a, 1
.rg_write_store_passable:
    ld (hl), a
    call mapper_pop_p2
    pop hl

    ld a, #FF
    ld (behavior_cache_row), a

    ld de, NAMETBL
    add hl, de
    ld a, b
    call WRTVRM
    ret

.rg_write_out:
    pop af
    ret
`, targetFormat);
}

function generateResolveRuntimeHeroEntityHelper(): string {
    return `
; ------------------------------------------------------------------
; resolve_runtime_hero_entity
; Preferred order:
;   1) hero_entity_id if valid
;   2) first input entity of current screen
;   3) entity 0 if still active (legacy compatibility)
; Output: A = entity index, or #FF when unavailable
; Clobbers: AF, HL
; ------------------------------------------------------------------
resolve_runtime_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret nz
    ld a, (input_entity_count)
    or a
    jr z, .resolve_legacy_entity0
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
    ret

.resolve_legacy_entity0:
    ld a, (entity_active)
    or a
    jr z, .resolve_none
    xor a
    ld (hero_entity_id), a
    ret

.resolve_none:
    ld a, #FF
    ret

`;
}

/**
 * Generate entity management helper functions
 */
function generateEntityManagement(): string {
    return wrapMideasAsmBlock(`
    ; ==================================================================
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system)
    ; ==================================================================

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
    ; Guard invalid indices to avoid RAM table corruption.
            cp MAX_ENTITIES
            ret nc
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte

    ; Mark entity as active
            ld hl, entity_active
            add hl, de
            ld (hl), 1                    ; entity_active[entity] = 1
            ld hl, active_entity_list_dirty
            ld (hl), 1

    ; Default job scheduler profile for newly created entities
    ; period=1 (100%), entry=0
            ld hl, entity_job_period
            add hl, de
            ld (hl), 1
            ld hl, entity_job_entry
            add hl, de
            ld (hl), 0

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

    ret 

    ; ------------------------------------------------------------------
    ; entity_job_set
    ; Set/update job scheduler profile for one entity.
    ; Input:  A = entity index (0..31)
    ;         B = period in frames (0 treated as 1)
    ;         C = entry slot (wrapped to 0..period-1)
    ; Output: entity_job_period/entry updated for that entity
    ; Destroys: AF, DE, HL
    ; ------------------------------------------------------------------
entity_job_set:
            cp MAX_ENTITIES
            ret nc
            ld e, a
            ld d, 0

            ld a, b
            or a
            jr nz, entity_job_set_period_ok
            ld a, 1
entity_job_set_period_ok:
            ld b, a

            ld a, c
entity_job_set_entry_wrap:
            cp b
            jr c, entity_job_set_entry_ok
            sub b
            jr entity_job_set_entry_wrap
entity_job_set_entry_ok:
            ld c, a

            ld hl, entity_job_period
            add hl, de
            ld a, b
            ld (hl), a

            ld hl, entity_job_entry
            add hl, de
            ld a, c
            ld (hl), a
            ld a, b
            cp 1
            jr nz, entity_job_set_enable_scheduler
            ld a, c
            or a
            ret z
entity_job_set_enable_scheduler:
            ld a, 1
            ld (entity_job_scheduler_active), a
            ret

    ; ------------------------------------------------------------------
    ; entity_job_should_run_c
    ; Evaluate per-entity cadence gate for current frame.
    ; Input:  C = entity index (0..31)
    ; Output: A = 1 when entity should run this frame, 0 otherwise
    ; Destroys: AF, BC, DE, HL
    ; Notes:
    ;   - Fast path for power-of-two periods using bitmask modulo.
    ;   - Fallback path uses 16-bit frame modulo with fixed 16-iteration cost.
    ; ------------------------------------------------------------------
entity_job_should_run_c:
            ld a, c
            cp MAX_ENTITIES
            jr c, .entity_job_run_idx_ok
            xor a
            ret
.entity_job_run_idx_ok:
            push bc
            push de
            push hl

            ld e, c
            ld d, 0

            ld hl, entity_job_period
            add hl, de
            ld a, (hl)
            or a
            jr nz, entity_job_run_period_ok
            ld a, 1
entity_job_run_period_ok:
            cp 1
            jr z, entity_job_run_active
            ld b, a

            ld hl, entity_job_entry
            add hl, de
            ld a, (hl)
            ld e, a

            ; Fast modulo for power-of-two period:
            ; if (period & (period - 1)) == 0 then use AND mask.
            ld a, b
            dec a
            ld d, a                    ; D = period - 1
            ld a, d
            and b
            jr nz, entity_job_run_fallback_mod

            ld a, e
            and d
            ld e, a
            ld a, (interrupt_counter)
            and d
            cp e
            jr nz, entity_job_run_inactive
            jr entity_job_run_active

entity_job_run_fallback_mod:
            ld a, e
entity_job_run_entry_mod:
            cp b
            jr c, entity_job_run_entry_ready
            sub b
            jr entity_job_run_entry_mod
entity_job_run_entry_ready:
            ld e, a

            ; 16-bit frame modulo: (interrupt_counter % period) in A
            ; Uses shift/subtract division with fixed 16 iterations.
            ld hl, (interrupt_counter)
            xor a
            ld d, 16
entity_job_run_frame_mod16:
            add hl, hl
            adc a, a
            cp b
            jr c, entity_job_run_frame_mod16_no_sub
            sub b
entity_job_run_frame_mod16_no_sub:
            dec d
            jr nz, entity_job_run_frame_mod16

            cp e
            jr nz, entity_job_run_inactive
entity_job_run_active:
            ld a, 1
            jr entity_job_run_done
entity_job_run_inactive:
            xor a
entity_job_run_done:
            pop hl
            pop de
            pop bc
            ret

    ; Initialize position component for entity(A = entity ID)
        init_entity_position:
            ld hl, entity_x_pos
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 100; Default X position

            ld hl, entity_y_pos
            add hl, de
            ld (hl), 100; Default Y position
    ret

    ; Initialize sprite component for entity(A = entity ID)
        init_entity_sprite:
    ; Set sprite as visible with default pattern
            ld hl, sprite_pattern
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 0; Pattern 0

            ld hl, sprite_color
            add hl, de
            ld (hl), 15; White color
            ret
    `, {
        id: 'runtime.components.entity_management',
        kind: 'routine',
        owner: 'components',
        roots: ['create_entity', 'entity_job_set', 'entity_job_should_run_c', 'force_update_entity_sprite'],
    });
}

/**
 * Generate init_components function with conditional initialization
 */
function generateInitComponents(usage: ComponentUsageAnalysis): string {
    const usedComponents = usage.usedComponents;

    let code = `BOX_STATE_ENTITY EQU 0
BOX_STATE_CARRIED EQU 1
BOX_STATE_DROPPED_TILE EQU 2

component_fill_32_a:
        ld (hl), a
        ld d, h
        ld e, l
        inc de
        ld bc, 31
        ldir
        ret

init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: ${Array.from(usedComponents).join(', ')} 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
        ld (current_world_id), a
        ld (current_screen_index), a
        ld (screen_transition_cooldown), a
        ld hl, active_entity_list_dirty
        ld (hl), 1

    ; Reset collectible persistence state on new game / restart.
    ; Cartridge RAM is not guaranteed to be zeroed.
        ld hl, gem_count
        ld de, gem_count + 1
        ld bc, 361                 ; bytes to clear - 1 (gem_count..bonus_respawn_frames, including last_interaction_*)
        xor a
        ld (hl), a
        ldir

    ; Clear all component masks 
        ld hl, entity_comp_masks 
        call component_fill_32_a

    ; Clear all component masks (high byte)
        ld hl, entity_comp_masks_hi
        call component_fill_32_a

    ; Initialize carry/box runtime flags even when the Carry system is filtered out.
        ld a, 255
        ld hl, entity_carried_by
        call component_fill_32_a
        ld hl, entity_carry_held
        call component_fill_32_a
        ld hl, entity_carry_base_sprite
        call component_fill_32_a

        xor a
        ld hl, entity_box_state
        call component_fill_32_a
        ld hl, entity_box_tile_x
        call component_fill_32_a
        ld hl, entity_box_tile_y
        call component_fill_32_a
        ld hl, entity_box_restore_valid
        call component_fill_32_a

    ; Initialize entity job scheduler defaults
    ; period=1 (100%), entry=0 for every entity slot
        ld a, 1
        ld hl, entity_job_period
        call component_fill_32_a

        xor a
        ld hl, entity_job_entry
        call component_fill_32_a
        ld (entity_job_scheduler_active), a
 
    `;

    code += `    ; Initialize position system (always)
    call init_position_system
    `;


    if (usedComponents.has('Sprite')) {
        code += `    ; Initialize sprite system
    call init_sprite_system
    `;
    }

    if (usedComponents.has('Movement')) {
        code += `    ; Initialize movement system
    call init_movement_system
    `;
    }

    if (usedComponents.has('Collision')) {
        code += `    ; Initialize collision system
    call init_collision_system
    `;
    }

    if (usedComponents.has('Input')) {
        code += `    ; Initialize input system
    call init_input_system
    `;
    }

    if (usedComponents.has('Behavior')) {
        code += `    ; Initialize behavior system
    call init_behavior_system
    `;
    }

    if (usedComponents.has('Health')) {
        code += `    ; Initialize health system
    call init_health_system
    `;
    }

    if (usedComponents.has('Animation') || usedComponents.has('Sprite')) {
        code += `    ; Initialize animation state defaults (also needed by sprite rendering frame selection)
    call init_animation_system
    `;
    }

    if (usedComponents.has('Jump')) {
        code += `    ; Initialize jump system
    call init_jump_system
    `;
    }

    if (usedComponents.has('Gravity')) {
        code += `    ; Initialize gravity system
    call init_gravity_system
    `;
    }

    if (usedComponents.has('Mirror')) {
        code += `    ; Initialize mirror system
    call init_mirror_system
    `;
    }

    if (usedComponents.has('WallGrab')) {
        code += `    ; Initialize wall grab system
    call init_wallgrab_system
    `;
    }

    if (usedComponents.has('WallJump')) {
        code += `    ; Initialize wall jump system
    call init_walljump_system
    `;
    }

    if (usedComponents.has('AutoDestroy')) {
        code += `    ; Initialize auto-destroy system
    call init_auto_destroy_system
    `;
    }

    if (usedComponents.has('StateMachine')) {
        code += `    ; Initialize state machine system (stub)
    call init_statemachine_system
    `;
    }

    if (usedComponents.has('RetractableGate')) {
        code += `    ; Initialize retractable gate system
    call init_retractable_gate_system
    `;
    }

    if (usedComponents.has('Carry') || usedComponents.has('Box')) {
        code += `    ; Initialize carry system (stub)
    call init_carry_system
    `;
    }

    if (usedComponents.has('Damage')) {
        code += `    ; Initialize damage system
    call init_damage_system
    `;
    }

    if (usedComponents.has('Shoot')) {
        code += `    ; Initialize shoot system
    call init_shoot_system
    `;
    }

    // Platform riding always initialized (physics feature)
    code += `    ; Initialize platform riding system
    call init_platform_riding_system
    `;

    if (usedComponents.has('WallCollision')) {
        code += `    ; Initialize wall collision system (stub)
    call init_wallcollision_system
    `;
    }

    if (usedComponents.has('DeadlyTiles')) {
        code += `    ; Initialize deadly tile detection system
    call init_deadly_tiles_system
    `;
    }

    if (usedComponents.has('InWater')) {
        code += `    ; Initialize water effect zone detection system
    call init_in_water_system
    `;
    }

    if (usedComponents.has('Collectible')) {
        code += `    ; Initialize collectible system (stub)
    call init_collectible_system
    `;
    }

    if (usedComponents.has('TileInteraction')) {
        code += `    ; Initialize tile interaction system
    call init_tile_interaction_system
    `;
    }

    code += `
    ret
    `;

    return wrapMideasAsmBlock(code, {
        id: 'runtime.components.init',
        kind: 'routine',
        owner: 'components',
        roots: ['init_components', 'component_fill_32_a'],
    });
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

function hasActivePlatformLayerEntity(analysis: ProjectAnalysis, componentUsage: ComponentUsageAnalysis): boolean {
    const templates = Array.isArray(analysis.templates) ? analysis.templates : [];
    const templateById = new Map<string, any>(templates.map((template: any) => [String(template.id), template]));

    for (const entity of componentUsage.activeEntities) {
        const template = templateById.get(String(entity?.entityTemplateId || ''));
        const collisionComponent = template?.components?.find((component: any) =>
            (component.definitionId || component.componentDefinitionId) === 'comp_collision'
        );
        const defaults = collisionComponent?.defaultValues || {};
        const overrides = entity?.componentOverrides?.comp_collision || {};
        const values = { ...defaults, ...overrides };
        const layer = Number(values.collisionLayer ?? values.layer ?? 0);

        if ((layer & 0x08) !== 0) {
            return true;
        }
    }

    return false;
}

function hasRuntimeSecretZone(screen: any): boolean {
    if (!Array.isArray(screen?.effectZones)) return false;

    return screen.effectZones.some((zone: any) => {
        const rect = zone?.rect || {};
        const width = Number(rect.width ?? zone?.width ?? 0);
        const height = Number(rect.height ?? zone?.height ?? 0);
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return false;
        }

        if (zone?.effectType === 'secretZone') return true;

        const hasKnownEffectType = typeof zone?.effectType === 'string' && zone.effectType.length > 0;
        const mask = Number(zone?.mask ?? 0);
        const hasLegacyNonSecretMask = Number.isFinite(mask) && mask !== 0;

        return !hasKnownEffectType && !hasLegacyNonSecretMask;
    });
}

/**
 * Generate ECS component systems file (components.asm)
 *
 * Implements a complete Entity-Component-System architecture based on Mideas React.js patterns.
 * NOW WITH INTELLIGENT FILTERING - Only generates code for components actually used.
 *
 * @param analysis - Project analysis with entities and tiles
 * @returns ASM code string with ECS component systems
 */
export function generateComponentsFile(analysis: ProjectAnalysis, romMode: string = 'simple32k', targetFormat: string = 'konami'): string {
    const usesMapper = usesMapperBanking(romMode);
    // Skip ECS system if no entities in project
    if (!analysis.entities || analysis.entities.length === 0) {
        return wrapMideasAsmBlock(`; ==================================================================
; GAME COMPONENT SYSTEMS(SKIPPED - NO ENTITIES DETECTED)
    ; File: components.asm
        ; ==================================================================

; No entities detected in project - ECS system not needed
    ; This saves ~650 lines of unused component management code

; Constants required by state machine action handlers
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

COMP_POSITION   EQU 0
COMP_SPRITE     EQU 1
COMP_MOVEMENT   EQU 2
COMP_COLLISION  EQU 3
COMP_INPUT      EQU 4
COMP_BEHAVIOR   EQU 5
COMP_HEALTH     EQU 6
COMP_ANIMATION  EQU 7
COMP_JUMP       EQU 8
COMP_GRAVITY    EQU 9
COMP_DEADLY_TILES EQU 13

COMP_MASK_POSITION   EQU #0001
COMP_MASK_SPRITE     EQU #0002
COMP_MASK_MOVEMENT   EQU #0004
COMP_MASK_COLLISION  EQU #0008
COMP_MASK_INPUT      EQU #0010
COMP_MASK_BEHAVIOR   EQU #0020
COMP_MASK_HEALTH     EQU #0040
COMP_MASK_ANIMATION  EQU #0080
COMP_MASK_JUMP       EQU #0100
COMP_MASK_GRAVITY    EQU #0200
COMP_MASK_AUTO_DESTROY EQU #0400
COMP_MASK_DAMAGE     EQU #0800
COMP_MASK_SHOOT      EQU #1000
COMP_MASK_DEADLY_TILES EQU #2000
COMP_MASK_WALL_JUMP EQU #4000
COMP_MASK_AIR_CONTROL EQU #8000

COMP_TRIGGER_FIRE    EQU 0
COMP_TRIGGER_ACTION2 EQU 1
COMP_TRIGGER_UP      EQU 2

    ; Minimal stub functions for compatibility
init_components:
    ret
init_entities:
    ret
update_all_entities:
    ret
update_player_fastpath:
    ret
execute_all_state_machines:
    ret
refresh_player_deadly_fastpath:
    ret
refresh_player_tile_interaction_fastpath:
    ret
refresh_player_state_machine_fastpath:
    ret
refresh_player_wallgrab_fastpath:
    ret
refresh_player_animation_fastpath:
    ret
refresh_player_sprite_fastpath:
    ret
create_entity:
    ret
entity_job_set:
    ret
entity_job_should_run_c:
    ld a, 1
    ret
force_update_entity_sprite:
    ret
sync_player_runtime_from_entity:
    ret

mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

ensure_used_entity_list_current:
    call rebuild_used_entity_list
    ret

rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld (coll_list_count), a
    ld (active_entity_list_dirty), a
    ld a, #FF
    ld (hero_entity_id), a
    ret

; @mideas:block id=runtime.components.filtered_update_stubs kind=routine owner=components
update_input_component:
    ret
update_position_component:
    ret
update_movement_component:
    ret
update_collision_component:
    ret
update_sprite_component:
    ret
update_behavior_component:
    ret
update_health_component:
    ret
update_animation_component:
    ret
update_jump_component:
    ret
update_gravity_component:
    ret
update_wallgrab_component:
    ret
update_mirror_component:
    ret
update_slash_component:
    ret
update_auto_destroy_component:
    ret
update_cursors_component:
    ret
update_statemachine_component:
    ret
update_carry_component:
    ret
update_damage_component:
    ret
update_shoot_component:
    ret
update_wallcollision_component:
    ret
update_deadly_tiles_component:
    ret
update_in_water_component:
    ret
update_collectible_component:
    ret
check_tile_interaction:
    ret
apply_collected_tiles:
    ret
; @mideas:endblock id=runtime.components.filtered_update_stubs

init_position_system:
    ret
init_sprite_system:
    ret
init_movement_system:
    ret
init_collision_system:
    ret
init_input_system:
    ret
init_behavior_system:
    ret
init_health_system:
    ret
init_animation_system:
    ret
init_jump_system:
    ret
init_gravity_system:
    ret
init_mirror_system:
    ret
init_wallgrab_system:
    ret
init_auto_destroy_system:
    ret
init_cursors_system:
    ret
init_statemachine_system:
    ret
init_carry_system:
    ret
init_damage_system:
    ret
init_shoot_system:
    ret
init_platform_riding_system:
    ret
init_wallcollision_system:
    ret
init_deadly_tiles_system:
    ret
init_in_water_system:
    ret
init_collectible_system:
    ret
init_tile_interaction_system:
    ret
init_entity_position:
    ret
init_entity_sprite:
    ret
wallgrab_process_entity_c:
    ret

    ; Component Data Structure EQUs (referenced by state machine actions)
entity_jump_vel_y   EQU temp_word_3
entity_slash_vel_x  EQU temp_byte_3
entity_slash_vel_y  EQU temp_byte_28
entity_jump_count   EQU temp_byte_4
entity_jump_max     EQU temp_byte_25
entity_jump_bonus   EQU temp_byte_27
entity_jump_trigger EQU temp_byte_29
entity_on_ground    EQU temp_byte_5
entity_gravity_vel  EQU temp_word_4
entity_health_current EQU temp_byte_6
entity_health_max     EQU temp_byte_7
entity_flag_deadly_tile EQU temp_byte_8
entity_deadly_collision EQU temp_byte_8
entity_flag_in_water EQU temp_byte_31
entity_mirror_flags  EQU temp_byte_32
tileDead EQU tileDead_dbg
tileDeadLatched EQU tileDead_latched_dbg
tileDeadX EQU tileDead_x_dbg
tileDeadY EQU tileDead_y_dbg
tileDeadValue EQU tileDead_value_dbg
entity_invincibility_frames EQU temp_byte_9
entity_damage_amount        EQU temp_byte_10
entity_shoot_cooldown   EQU temp_byte_11
entity_shoot_sprite_id  EQU temp_byte_12
entity_shoot_speed      EQU temp_byte_13
entity_shoot_trigger    EQU temp_byte_30
entity_collision_layer  EQU temp_byte_14
entity_collides_with    EQU temp_byte_15
entity_platform_id      EQU temp_byte_16
entity_platform_grace   EQU temp_byte_17
entity_wall_collision_flags EQU temp_byte_18
entity_collision_hitbox_w EQU temp_byte_19
entity_collision_hitbox_h EQU temp_byte_20
entity_collision_offset_x EQU temp_byte_21
entity_collision_offset_y EQU temp_byte_22
entity_entity_collision_flags EQU temp_byte_23
entity_last_collision_entity EQU temp_byte_24

    ; ==================================================================
; END OF COMPONENTS(MINIMAL VERSION)
    ; ==================================================================
        `, {
            id: 'runtime.components.stub',
            kind: 'routine',
            owner: 'components',
            preserve: true,
            roots: ['compatibility-stubs'],
        });
    }

    // INTELLIGENT FILTERING: Analyze which components are actually used
    const componentUsage: ComponentUsageAnalysis = analyzeComponentUsage(analysis);
    const usedComponents = componentUsage.usedComponents;
    const hasPlatformRiding = hasActivePlatformLayerEntity(analysis, componentUsage);
    const hasInteractableTiles = Array.isArray(analysis.tiles) &&
        analysis.tiles.some((t: any) => ((t.logicalProperties?.mapId ?? 0) & 0x08) !== 0);
    const tileCollectorRuntimeConfig = resolveTileCollectorRuntimeConfig(analysis);
    const hasStateMachineSoundPlayback = Array.isArray(analysis.stateMachines) && analysis.stateMachines.length > 0;

    if (hasInteractableTiles && usedComponents.has('Input')) {
        usedComponents.add('TileInteraction');
    }

    const conditionTreeHas = (condition: any, types: Set<string>): boolean => {
        if (!condition || typeof condition !== 'object') return false;
        const conditionType = String(condition.type || '').toUpperCase();
        if (types.has(conditionType)) return true;
        const nested = Array.isArray(condition.conditions) ? condition.conditions : [];
        for (const subCondition of nested) {
            if (conditionTreeHas(subCondition, types)) return true;
        }
        return false;
    };

    const stateMachines = Array.isArray((analysis as any).stateMachines) ? (analysis as any).stateMachines : [];
    const collisionConditionTypes = new Set<string>(['HAS_COLLISION', 'HAS_DEADLY_TILE_COLLISION']);
    const needsCollisionFromStateMachine = stateMachines.some((stateMachine: any) => {
        const transitions = Array.isArray(stateMachine?.transitions) ? stateMachine.transitions : [];
        return transitions.some((transition: any) => conditionTreeHas(transition?.conditions, collisionConditionTypes));
    });

    if (needsCollisionFromStateMachine && !usedComponents.has('Collision')) {
        console.log('  - Forcing Collision system: required by state machine conditions');
        usedComponents.add('Collision');
    }

    console.log('🎯 Generating optimized components.asm...');
    const generatedComponentNames = [
        'Position', 'Sprite', 'Movement', 'Collision', 'Input', 'Behavior', 'Health', 'Animation',
        'Jump', 'Gravity', 'AirControl', 'WallGrab', 'WallJump', 'AutoDestroy', 'Cursors',
        'StateMachine', 'RetractableGate', 'Carry', 'Damage', 'Shoot', 'WallCollision',
        'InWater', 'DeadlyTiles', 'Collectible', 'TileInteraction', 'Patrol', 'AutoControlScript', 'Mirror'
    ];
    const filteredOutComponentCount = generatedComponentNames.filter(component => !usedComponents.has(component)).length;

    console.log(`  - Active entities: ${componentUsage.activeEntities.length} `);
    console.log(`  - Used components: ${Array.from(usedComponents).join(', ')} `);
    console.log(`  - Dynamic platform riding: ${hasPlatformRiding ? 'ENABLED' : 'STUB'} `);
    console.log(`  - Filtered out: ${filteredOutComponentCount} unused components`);

    // Build the complete ASM file
    let code = `; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: ${componentUsage.activeEntities.length}
;   Used components: ${Array.from(usedComponents).join(', ')}
;   Dynamic platform riding: ${hasPlatformRiding ? 'ENABLED' : 'STUB'}
;   Filtered out: ${filteredOutComponentCount} unused component systems
    ;
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS(Based on ComponentDefinition analysis)
    ; ==================================================================

; Core Components(always present)
COMP_POSITION   EQU 0; Position component(x, y coordinates)
COMP_SPRITE     EQU 1; Sprite rendering component
COMP_MOVEMENT   EQU 2; Movement / velocity component
COMP_COLLISION  EQU 3; Collision detection component
COMP_INPUT      EQU 4; Input handling component
COMP_BEHAVIOR   EQU 5; AI / Logic behavior component
COMP_HEALTH     EQU 6; Health / damage component
COMP_ANIMATION  EQU 7; Animation state component
COMP_JUMP       EQU 8; Jump behavior component(platformer physics)
COMP_GRAVITY    EQU 9; Gravity physics component
COMP_DEADLY_TILES EQU 13; Deadly behavior-map tile detection marker
COMP_AIR_CONTROL EQU 15; Air control restrictions while airborne

    ; Component flags for entity filtering(16 - bit masks for 10 + components)
COMP_MASK_POSITION   EQU #0001; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200; Binary: 0000001000000000
COMP_MASK_AUTO_DESTROY EQU #0400; Binary: 0000010000000000
COMP_MASK_DEADLY_TILES EQU #2000; Binary: 0010000000000000
COMP_MASK_WALL_JUMP EQU #4000; Binary: 0100000000000000
COMP_MASK_AIR_CONTROL EQU #8000; Binary: 1000000000000000

COMP_TRIGGER_FIRE    EQU 0 ; input_btn bit 0 / SPACE / joystick A
COMP_TRIGGER_ACTION2 EQU 1 ; input_btn bit 1 / second action / joystick B
COMP_TRIGGER_UP      EQU 2 ; direction edge on STICK_UP

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_slash_vel_x  EQU temp_byte_3; Additive horizontal slash velocity from bonus tiles (32 bytes)
entity_slash_vel_y  EQU temp_byte_28; Additive vertical slash velocity from bonus tiles (32 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_jump_max     EQU temp_byte_25; Configured max jumps for this entity (32 bytes)
entity_jump_bonus   EQU temp_byte_27; Temporary extra jumps granted by bonus tiles (32 bytes)
entity_jump_trigger EQU temp_byte_29; Trigger action for jump (32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

; Deadly Tile Collision Data
entity_flag_deadly_tile EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)
entity_deadly_collision EQU temp_byte_8 ; Backward-compatible alias
entity_flag_in_water EQU temp_byte_31 ; Flag: bit 0 = entity center is inside a Water effect zone (32 bytes)
tileDead EQU tileDead_dbg ; Debug byte: mirrors hero deadly contact (entity 0)
tileDeadLatched EQU tileDead_latched_dbg ; Debug byte: latched hero deadly detection
tileDeadX EQU tileDead_x_dbg ; Debug byte: last sampled tile X
tileDeadY EQU tileDead_y_dbg ; Debug byte: last sampled tile Y
tileDeadValue EQU tileDead_value_dbg ; Debug byte: raw behavior byte read

    ; Damage Component Data
entity_invincibility_frames EQU temp_byte_9  ; Countdown timer for invulnerability (32 bytes)
entity_damage_amount        EQU temp_byte_10 ; Damage dealt by this entity (32 bytes)

    ; Shoot Component Data
entity_shoot_cooldown   EQU temp_byte_11 ; Cooldown frames until can shoot (32 bytes)
entity_shoot_sprite_id  EQU temp_byte_12 ; Projectile sprite ID (32 bytes)
entity_shoot_speed      EQU temp_byte_13 ; Projectile velocity (32 bytes)
entity_shoot_trigger    EQU temp_byte_30 ; Trigger action for shooting (32 bytes)
entity_mirror_flags     EQU temp_byte_32 ; Mirror flags: bit0 enabled, bit1 invert facing (32 bytes)

    ; Collision Layer Data (for projectile and advanced collision)
entity_collision_layer  EQU temp_byte_14 ; Which layer this entity is on (32 bytes)
entity_collides_with    EQU temp_byte_15 ; Bitmask of layers this entity collides with (32 bytes)

    ; Platform Riding Data
entity_platform_id      EQU temp_byte_16 ; ID of platform underneath (255 = none) (32 bytes)
entity_platform_grace   EQU temp_byte_17 ; Grace frames for platform (32 bytes)
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 entity(any), bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)

    ; Input Disable Flag
entity_input_disabled EQU temp_byte_26 ; 0=enabled, 1=disabled (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        ${generateInitComponents(componentUsage)}
`;

    // Generate Position System (always needed for entity coords)
    code += generatePositionSystem();

    // Generate Sprite System (if used OR if project has sprites)
    // CRITICAL FIX: Always generate when sprites exist, even if component analysis fails
    const hasSprites = analysis.sprites && analysis.sprites.length > 0;
    if (usedComponents.has('Sprite') || hasSprites) {
        code += generateSpriteSystem(analysis, romMode);
    } else {
        code += `
    ; Sprite system filtered out(not used)
init_sprite_system:
    ret

update_sprite_component:
    ret

refresh_player_sprite_fastpath:
    ret

force_update_entity_sprite:
    ret
    `;
    }

    // Generate Movement System (if used)
    if (usedComponents.has('Movement')) {
        code += generateMovementSystem();
    } else {
        code += `
    ; Movement system filtered out(not used)
init_movement_system:
    ret

; @mideas:block id=runtime.components.movement_stub kind=routine owner=components
update_movement_component:
    ret
; @mideas:endblock id=runtime.components.movement_stub
    `;
    }

    // Generate Collision System (if used)
    if (usedComponents.has('Collision')) {
        code += generateCollisionSystem(analysis, hasPlatformRiding);
    } else {
        code += `
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    `;
    }

    // Generate get_behavior_tile for modern collision systems and legacy helpers.
    // check_collision_at_point is emitted as a compatibility label even in FakePlayer-only
    // builds, so this reader must exist without requiring a real Player collision component.
    code += generateGetBehaviorTile(romMode, targetFormat);

    // Wall hitbox helpers are required by WallCollision itself and are also
    // reused by deadly-tile probes / late-frame tile interaction.
    const needsWallHitboxHelpers =
        usedComponents.has('DeadlyTiles') ||
        (hasInteractableTiles && usedComponents.has('Input'));
    if (!usedComponents.has('WallCollision') && (usedComponents.has('Collision') || needsWallHitboxHelpers)) {
        code += generateWallHitboxHelpers();
    }

    // Sprite fast paths can call directional sync helpers even when the generic
    // Input component is filtered out.
    const needsDirectionalFacingSpriteSyncHelpers =
        usedComponents.has('Input') ||
        usedComponents.has('Sprite') ||
        hasSprites;
    if (needsDirectionalFacingSpriteSyncHelpers) {
        code += generateDirectionalFacingSpriteSyncHelpers();
    }

    // Generate Input System (if used)
    if (usedComponents.has('Input')) {
        code += generateInputSystem();
    } else {
        code += `
    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    `;
    }

    if (!usesMapper && (usedComponents.has('Jump') || usedComponents.has('Shoot') || usedComponents.has('Carry'))) {
        code += generateComponentTriggerHelpers();
    }

    // Generate Behavior System (if used)
    if (usedComponents.has('Behavior')) {
        code += generateBehaviorSystem();
    } else {
        code += `
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

; @mideas:block id=runtime.components.behavior_stub kind=routine owner=components
update_behavior_component:
    ret
; @mideas:endblock id=runtime.components.behavior_stub
    `;
    }

    // Damage reuses the Health helpers even in Damage-only projectile scenes.
    if (usedComponents.has('Health') || usedComponents.has('Damage')) {
        code += generateHealthSystem();
    } else {
        code += `
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    `;
    }

    // Generate Animation System (if used)
    if (usedComponents.has('Animation')) {
        code += generateAnimationSystem();
    } else {
        code += `
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret

refresh_player_animation_fastpath:
    ret
    `;
    }

    // Generate Jump System (if used)
    if (usedComponents.has('Jump')) {
        code += generateJumpSystem();
    } else {
        code += `
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    `;
    }

    // Generate Gravity System (if used)
    if (usedComponents.has('Gravity')) {
        code += generateGravitySystem();
    } else {
        code += `
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
    ret
    `;
    }

    if (usedComponents.has('AirControl')) {
        code += generateAirControlHelpers();
    } else {
        code += `
    ; AirControl helpers filtered out (not used)
aircontrol_should_lock_horizontal_c:
    xor a
    ret
    `;
    }

    if (usedComponents.has('WallGrab') && usedComponents.has('WallCollision')) {
        code += generateWallGrabSystem(usedComponents.has('WallCollision'));
    } else {
        code += `
    ; WallGrab system filtered out (${usedComponents.has('WallGrab') ? 'requires WallCollision' : 'not used'})
init_wallgrab_system:
    ret

update_wallgrab_component:
    ret

refresh_player_wallgrab_fastpath:
    ret

wallgrab_process_entity_c:
    ret
    `;
    }

    if (usedComponents.has('WallJump')) {
        code += generateWallJumpSystem();
    } else {
        code += `
    ; WallJump system filtered out (not used)
; @mideas:block id=runtime.components.walljump_stub kind=routine owner=components
init_walljump_system:
    ret

update_walljump_component:
    ret

walljump_process_entity_c:
    ret

walljump_input_is_left:
    xor a
    ret

walljump_input_is_right:
    xor a
    ret
; @mideas:endblock id=runtime.components.walljump_stub
    `;
    }

    if (usedComponents.has('AutoDestroy')) {
        code += generateAutoDestroySystem();
    } else {
        code += `
    ; AutoDestroy system filtered out(not used)
; @mideas:block id=runtime.components.auto_destroy_stub kind=routine owner=components
init_auto_destroy_system:
    ret

update_auto_destroy_component:
    ret
; @mideas:endblock id=runtime.components.auto_destroy_stub
    `;
    }

    // Generate Cursors System stub (if used)
    if (!usedComponents.has('Cursors')) {
        code += `
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    `;
    } else {
        code += generateCursorsSystem();
    }

    // Generate StateMachine System (if used)
    if (!usedComponents.has('StateMachine')) {
        code += `
    ; StateMachine system filtered out(not used)
; @mideas:block id=runtime.components.state_machine_component_stub kind=routine owner=components
init_statemachine_system:
    ret

update_statemachine_component:
    ret
; @mideas:endblock id=runtime.components.state_machine_component_stub
    `;
    } else if (!Array.isArray(analysis.stateMachines) || analysis.stateMachines.length === 0) {
        code += `
    ; StateMachine component present but no state machine assets are defined.
    ; Keep the component safe for reusable templates.
; @mideas:block id=runtime.components.state_machine_component_stub kind=routine owner=components
init_statemachine_system:
    ret

update_statemachine_component:
    ret
; @mideas:endblock id=runtime.components.state_machine_component_stub
    `;
    } else if ((analysis as any).hasGameFlow) {
        code += `
    ; StateMachine per-entity component tick filtered out.
    ; GameFlow calls execute_all_state_machines once per frame, so this
    ; resident component wrapper must stay a no-op to avoid duplicate SM ticks.
; @mideas:block id=runtime.components.state_machine_component_stub kind=routine owner=components
init_statemachine_system:
    ret

update_statemachine_component:
    ret
; @mideas:endblock id=runtime.components.state_machine_component_stub
    `;
    } else {
        code += `
    ; StateMachine system (integrates with stateMachineGenerator.ts)
    ; Note: The actual SM_Update runtime is in statemachine.asm
    ; This component iterates entities and calls SM_Update for each one

init_statemachine_system:
    ; No initialization needed - state machines are initialized
    ; when entity templates are loaded
    ret

; ------------------------------------------------------------------
; update_statemachine_component
; Update all entities with StateMachine component
; Calls SM_Update (from statemachine.asm) for each entity
; ------------------------------------------------------------------
update_statemachine_component:
    ld c, 0                       ; C = entity index

.sm_comp_loop:
    ld a, c
    cp MAX_ENTITIES
    ret z                         ; Done with all entities

    ; Check if entity is active
    ld hl, entity_active
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    or a
    jr z, .sm_comp_next           ; Entity not active, skip

    ; Check if entity has StateMachine component (bit in component mask)
    ; Note: StateMachine component mask bit should be defined in constants
    ; For now, we assume all active entities may have state machines
    ; In production, check entity_component_mask

    ; Get state machine pointer to verify it exists
    push bc
    ld b, 0                       ; BC = entity index
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)                    ; E = ptr_low

    ld hl, entity_sm_ptr_h
    ld b, 0                       ; BC = entity index again
    add hl, bc
    ld d, (hl)                    ; D = ptr_high

    ; Check if pointer is null (DE = 0)
    ld a, d
    or e
    pop bc
    jr z, .sm_comp_next           ; No state machine, skip

    ; Call SM_Update with entity index in A
    ld a, c
    call SM_Update

.sm_comp_next:
    inc c
    jr .sm_comp_loop
    `;
    }

    if (!usedComponents.has('RetractableGate')) {
        code += `
    ; RetractableGate system filtered out(not used)
init_retractable_gate_system:
    ret

; @mideas:block id=runtime.components.retractable_gate_stub kind=routine owner=components
update_retractable_gate_component:
    ret
; @mideas:endblock id=runtime.components.retractable_gate_stub
    `;
    } else {
        code += generateRetractableGateSystem(targetFormat);
    }

    // Generate Carry System stub (if used)
    if (!usedComponents.has('Carry') && !usedComponents.has('Box')) {
        code += `
    ; Carry system filtered out(not used)
init_carry_system:
    ret

; @mideas:block id=runtime.components.carry_stub kind=routine owner=components
update_carry_component:
    ret

carry_sync_current_screen_followers:
    ret

carry_apply_dropped_box_tiles_current_screen:
    ret

carry_materialize_landed_box:
    ret
; @mideas:endblock id=runtime.components.carry_stub
    `;
    } else {
        code += generateCarrySystem(analysis, targetFormat, romMode);
    }

    // Generate AutoControlScript System entry points.
    // The FakePlayer engine calls this only on tutorial/dialog/cutscene screens.
    code += generateAutoControlScriptSystem(analysis);

    // Generate Damage System (if used)
    if (!usedComponents.has('Damage')) {
        code += `
    ; Damage system filtered out(not used)
init_damage_system:
    ret

; @mideas:block id=runtime.components.damage_stub kind=routine owner=components
update_damage_component:
    ret
; @mideas:endblock id=runtime.components.damage_stub
    `;
    } else {
        code += generateDamageSystem();
    }

    // Generate Shoot System (if used)
    if (!usedComponents.has('Shoot')) {
        code += `
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

; @mideas:block id=runtime.components.shoot_stub kind=routine owner=components
update_shoot_component:
    ret
; @mideas:endblock id=runtime.components.shoot_stub
    `;
    } else {
        code += generateShootSystem();
    }

    // Generate Platform Riding System only when active entities can be ridden.
    code += generatePlatformRidingSystem(hasPlatformRiding);

    // Generate WallCollision System stub (if used)
    if (!usedComponents.has('WallCollision')) {
        code += `
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    `;
    } else {
        code += generateWallCollisionSystem(romMode);
    }

    if (!usedComponents.has('DeadlyTiles')) {
        code += `
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret

refresh_player_deadly_fastpath:
    ret
    `;
    } else {
        code += generateDeadlyTilesSystem();
    }

    if (!usedComponents.has('InWater')) {
        code += `
    ; InWater system filtered out(not used)
init_in_water_system:
    ret

; @mideas:block id=runtime.components.in_water_stub kind=routine owner=components
update_in_water_component:
    ret
; @mideas:endblock id=runtime.components.in_water_stub
    `;
    } else {
        code += generateInWaterSystem();
    }

    // Generate Collectible System stub (if used)
    if (!usedComponents.has('Collectible')) {
        code += `
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

; @mideas:block id=runtime.components.collectible_stub kind=routine owner=components
update_collectible_component:
    ret
; @mideas:endblock id=runtime.components.collectible_stub
    `;
    } else {
        code += generateCollectibleSystem();
    }

    // Generate Tile Interaction System (when project has Interactable tiles)
    // Detects tiles with mapId & #08 (INTERACTABLE flag) on the screen map.
    if (hasInteractableTiles && usedComponents.has('Input')) {
        code += generateTileInteractionSystem(analysis, tileCollectorRuntimeConfig, hasStateMachineSoundPlayback, usedComponents.has('WallCollision'));
        code += generateApplyCollectedTiles();
        console.log('  - Tile Interaction system: ENABLED (interactable tiles detected)');
    } else {
        code += `
    ; Tile interaction system filtered out(no interactable tiles or no input)
init_tile_interaction_system:
    ret

update_slash_component:
    ret

check_tile_interaction:
    ret

refresh_player_tile_interaction_fastpath:
    ret

; Stub: apply_collected_tiles (no interactable tiles in project)
apply_collected_tiles:
    ret
    `;
    }

    if (!usedComponents.has('Mirror')) {
        code += `
    ; Mirror system filtered out(not used)
init_mirror_system:
    ret

; @mideas:block id=runtime.components.mirror_stub kind=routine owner=components
update_mirror_component:
    ret
; @mideas:endblock id=runtime.components.mirror_stub
    `;
    } else {
        code += generateMirrorSystem();
    }

    // Always include entity management helpers
    code += generateEntityManagement();

    // ==================================================================
    // GAMEFLOW INTEGRATION FUNCTIONS
    // ==================================================================

    // Generate update_all_entities function - OPTIMIZED based on used components
    // Only generates CALLs to systems that are actually used
    const hasSecretZones = !!analysis.screenMaps?.some((screen: any) => hasRuntimeSecretZone(screen));
    code += generateUpdateAllEntities(usedComponents, !!analysis.hasGameFlow, hasSecretZones, !!analysis.screenMaps?.length, hasPlatformRiding);

    // Generate execute_all_state_machines function - called by GameFlow game loop
    if (usedComponents.has('StateMachine') && Array.isArray(analysis.stateMachines) && analysis.stateMachines.length > 0) {
        code += `
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
; @mideas:block id=runtime.components.state_machine_executor kind=routine owner=components roots=execute_all_state_machines,refresh_player_state_machine_fastpath
execute_all_state_machines:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list
    
.sm_loop:
    ld a, (hl)                    ; A = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld c, a
    ld a, (player_runtime_enabled)
    or a
    jr z, .sm_entity_ready
    ld a, (player_entity_index)
    cp c
    jr z, .skip_entity
.sm_entity_ready:
    ld a, c

    ; active_entity_list already guarantees active + current_screen_id
    ld e, a                       ; DE = entity index
    ld d, 0

    ; Check if this entity has a state machine assigned
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)                    ; C = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)                    ; A = SM ptr high
    
    ; Check if SM pointer is non-zero
    or c
    jr z, .skip_entity            ; No SM assigned, skip

    ; Entity has a state machine - execute it
    ld a, e
    push bc                       ; Preserve loop counter (B) across call
    call SM_Update                ; Execute state machine (A = entity index)
    pop bc
    
.skip_entity:
    pop hl                        ; Restore list pointer
    djnz .sm_loop                 ; Loop for all used entities
    
    ret

refresh_player_state_machine_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z

    ld e, a
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)
    or c
    ret z

    ld a, e
    call SM_Update
    ret
; @mideas:endblock id=runtime.components.state_machine_executor

`;
    } else {
        code += `
; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; No state machines are present in this build.
; @mideas:block id=runtime.components.state_machine_executor kind=routine owner=components roots=execute_all_state_machines,refresh_player_state_machine_fastpath
execute_all_state_machines:
    ret

refresh_player_state_machine_fastpath:
    ret
; @mideas:endblock id=runtime.components.state_machine_executor

`;
    }

    // Tile Collision System
    code += `
; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Legacy compatibility labels. Current WallCollision and TileInteraction
; use get_behavior_tile directly, so keep this path compact in resident ROM.
; ==================================================================

; @mideas:block id=runtime.components.legacy_tile_collision kind=routine owner=components
get_tile_at_position:
    ; Deprecated: callers should use get_behavior_tile with B=row/C=column.
    xor a
    ret

get_tile_behavior:
    ; Deprecated ID-based lookup. Preserve label, return passable.
    xor a
    ret

tile_behavior_table:
    db TILE_PASSABLE

check_collision_at_point:
    ; Deprecated legacy helper. WallCollision uses behavior maps directly.
    xor a
    ret

; ------------------------------------------------------------------
; check_collision_box
; Check collision for entity bounding box (16x16)
; Input:  D = X position (top-left), E = Y position (top-left)
; Output: Z flag set if no collision, cleared if collision detected
;         A = Behavior flags of colliding tile
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_box:
    ; Deprecated legacy helper. WallCollision uses behavior maps directly.
    xor a                         ; passable/no collision
    ret

; ------------------------------------------------------------------
; div_a_by_c
; Divide A by C (unsigned 8-bit division)
; Input:  A = dividend, C = divisor
; Output: A = quotient
; Destroys: B
; ------------------------------------------------------------------
div_a_by_c:
    xor a
    ret
; @mideas:endblock id=runtime.components.legacy_tile_collision

`;

    code += generateResolveRuntimeHeroEntityHelper();

    if (hasSecretZones) {
        code += `
; @mideas:block id=runtime.components.secret_zones kind=routine owner=components roots=update_secret_zone_component,secret_zone_capture_current_rect,secret_zone_apply_current_rect,secret_zone_restore_current_rect,secret_zone_clear_state,secret_zone_compute_offset
; ------------------------------------------------------------------
; update_secret_zone_component
; Hero-only secret zone runtime.
; Uses hero_entity_id resolved from templates flagged with isPlayer.
; ------------------------------------------------------------------
${buildRegisterContractComment({
  purpose: 'Detect player entry/exit on secret zones and swap visible tiles.',
  inputs: [
    'hero_entity_id + entity_is_player/current-screen filtering',
    'entity_x_pos[hero], entity_y_pos[hero] as hero top-left position',
    'runtime_effect_zone_table/current_effect_zone_count',
    'runtime_effects_layout, runtime_screen_layout, secret_zone_restore_buffer',
  ],
  outputs: [
    'runtime_screen_layout updated when entering/leaving a secret zone',
    'VRAM Name Table updated for affected rectangle',
    'secret_zone_active + secret_zone_rect_* state refreshed',
  ],
  clobbers: ['AF', 'BC', 'DE', 'HL', 'IX'],
  preserved: ['None'],
  notes: [
    'Only secret zones are handled in this v1 runtime.',
    'First matching zone wins when zones overlap.',
  ],
})}
update_secret_zone_component:
    call resolve_runtime_hero_entity
    cp #FF
    jp z, .secret_no_match
    ld e, a
    ld d, 0

    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .secret_no_match

    ld a, (current_effect_zone_count)
    or a
    jp z, .secret_no_match

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld b, a                       ; B = hero center X in cells

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    srl a
    srl a
    srl a
    ld c, a                       ; C = hero center Y in cells

    ld a, (current_effect_zone_count)
    ld d, a                       ; D = remaining zone count
    ld ix, runtime_effect_zone_table

.secret_scan_loop:
    ld a, d
    or a
    jp z, .secret_no_match

    ld a, b                       ; hero center X
    cp (ix+0)                     ; zone.x
    jp c, .secret_next_entry
    sub (ix+0)
    ld e, a                       ; E = deltaX

    ld a, c                       ; hero center Y
    cp (ix+1)                     ; zone.y
    jp c, .secret_next_entry
    sub (ix+1)
    ld h, a                       ; H = deltaY

    ld a, (ix+2)                  ; zone.width
    cp e                          ; width > deltaX?
    jp z, .secret_next_entry
    jp c, .secret_next_entry

    ld a, (ix+3)                  ; zone.height
    cp h                          ; height > deltaY?
    jp z, .secret_next_entry
    jp c, .secret_next_entry

    ld a, (ix+4)
    cp EFFECT_TYPE_SECRET_ZONE
    jp nz, .secret_next_entry

    ld a, (secret_zone_active)
    or a
    jp z, .secret_activate_new

    ld a, (secret_zone_rect_x)
    cp (ix+0)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_y)
    cp (ix+1)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_w)
    cp (ix+2)
    jp nz, .secret_switch_zone
    ld a, (secret_zone_rect_h)
    cp (ix+3)
    jp nz, .secret_switch_zone
    ret

.secret_switch_zone:
    call secret_zone_restore_current_rect

.secret_activate_new:
    ld a, (ix+0)
    ld (secret_zone_rect_x), a
    ld a, (ix+1)
    ld (secret_zone_rect_y), a
    ld a, (ix+2)
    ld (secret_zone_rect_w), a
    ld a, (ix+3)
    ld (secret_zone_rect_h), a
    ld a, 1
    ld (secret_zone_active), a
    call secret_zone_capture_current_rect
    call secret_zone_apply_current_rect
    ret

.secret_next_entry:
    push de
    push bc
    ld bc, EFFECT_ZONE_ENTRY_SIZE
    add ix, bc
    pop bc
    pop de
    dec d                         ; decrement zone counter (NOT hero Y)
    jp .secret_scan_loop

.secret_no_match:
    ld a, (secret_zone_active)
    or a
    ret z
    call secret_zone_restore_current_rect
    call secret_zone_clear_state
    ret

; ------------------------------------------------------------------
; secret_zone_capture_current_rect
; Capture active rect from runtime_screen_layout into a packed restore buffer.
; ------------------------------------------------------------------
secret_zone_capture_current_rect:
    call secret_zone_compute_offset
    ld de, runtime_screen_layout
    add hl, de
    ld de, secret_zone_restore_buffer
    ld a, (secret_zone_rect_h)

.secret_capture_row_loop:
    push af
    push hl
    push de
    ld a, (secret_zone_rect_w)
    ld c, a
    ld b, 0
    ldir
    pop de
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld b, 0
    ex de, hl
    add hl, bc
    ex de, hl
    ld bc, 32
    add hl, bc
    pop af
    dec a
    jr nz, .secret_capture_row_loop
    ret

; ------------------------------------------------------------------
; secret_zone_apply_current_rect
; Copy active rect from runtime_effects_layout to runtime_screen_layout and VRAM.
; ------------------------------------------------------------------
secret_zone_apply_current_rect:
    call secret_zone_compute_offset
    push hl
    ld de, runtime_effects_layout
    add hl, de
    ex de, hl
    pop hl
    push de
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_ram_to_ram

    call secret_zone_compute_offset
    push hl
    ld de, runtime_screen_layout
    add hl, de
    pop de
    push hl
    ld hl, NAMETBL
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_to_vram
    ret

; ------------------------------------------------------------------
; secret_zone_restore_current_rect
; Restore active rect from the packed restore buffer into runtime_screen_layout and VRAM.
; ------------------------------------------------------------------
secret_zone_restore_current_rect:
    call secret_zone_compute_offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl
    ld hl, secret_zone_restore_buffer
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call secret_zone_copy_packed_to_runtime_screen

    call secret_zone_compute_offset
    push hl
    ld de, runtime_screen_layout
    add hl, de
    pop de
    push hl
    ld hl, NAMETBL
    add hl, de
    ex de, hl
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld a, (secret_zone_rect_h)
    call copy_layout_rect_to_vram
    ret

; ------------------------------------------------------------------
; secret_zone_copy_packed_to_runtime_screen
; Input: HL = packed source, DE = runtime_screen_layout destination.
;        A = rows, C = bytes per row.
; ------------------------------------------------------------------
secret_zone_copy_packed_to_runtime_screen:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.secret_restore_row_loop:
    push af
    push hl
    push de
    ld a, (secret_zone_rect_w)
    ld c, a
    ld b, 0
    ldir
    pop de
    pop hl
    ld a, (secret_zone_rect_w)
    ld c, a
    ld b, 0
    add hl, bc
    ld bc, 32
    ex de, hl
    add hl, bc
    ex de, hl
    pop af
    dec a
    jr nz, .secret_restore_row_loop
    ret

; ------------------------------------------------------------------
; secret_zone_clear_state
; ------------------------------------------------------------------
secret_zone_clear_state:
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ret

; ------------------------------------------------------------------
; secret_zone_compute_offset
; Output: HL = row*32 + col for current secret rect origin
; Clobbers: AF, DE, HL
; ------------------------------------------------------------------
secret_zone_compute_offset:
    ld a, (secret_zone_rect_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (secret_zone_rect_x)
    ld e, a
    ld d, 0
    add hl, de
    ret
; @mideas:endblock id=runtime.components.secret_zones

`;
    } else {
        code += `
; @mideas:block id=runtime.components.secret_zone_stub kind=routine owner=components
update_secret_zone_component:
    ret
; @mideas:endblock id=runtime.components.secret_zone_stub

`;
    }

    if (usedComponents.has('WallCollision')) {
        const wallHitboxHelpersBlock = generateWallHitboxHelpers();
        const firstWallHitboxHelper = code.indexOf(wallHitboxHelpersBlock);
        const lastWallHitboxHelper = code.lastIndexOf(wallHitboxHelpersBlock);

        // Collision/deadly projects without WallCollision still need the shared helper block.
        // When WallCollision is present, that system already embeds the helpers inline.
        // If a shared copy slipped in earlier, remove only the first duplicate and keep the
        // WallCollision-local copy so all call sites still resolve to the same contract.
        if (
            firstWallHitboxHelper !== -1 &&
            lastWallHitboxHelper !== -1 &&
            firstWallHitboxHelper !== lastWallHitboxHelper
        ) {
            code =
                code.slice(0, firstWallHitboxHelper) +
                code.slice(firstWallHitboxHelper + wallHitboxHelpersBlock.length);
        }
    }

    code = stripUnusedPlayerDashOptionalRuntime(code, {
        hasBosses: projectHasBossRuntime(analysis),
        hasBreakableTiles: projectHasBreakableTiles(analysis),
    });
    code = stripUnusedTileInteractionDispatchRuntime(code, collectUsedScreenInteractionTypes(analysis));

    // End of file
    code += `
    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        `;

    return code;
}
