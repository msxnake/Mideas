"use strict";
/**
 * @fileoverview Animated Tiles Generator - System for animating background tiles
 * Generates animtiles.asm with functions to update animated tiles in VRAM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnimatedTilesFile = generateAnimatedTilesFile;
const tileUtils_1 = require("../../../components/utils/tileUtils");
const SCREEN2_MODE = 'SCREEN 2 (Graphics I)';
function clampByte(value, fallback, min = 0, max = 255) {
    if (!Number.isFinite(value))
        return fallback;
    if (value < min)
        return min;
    if (value > max)
        return max;
    return Math.floor(value);
}
function normalizeGroupId(value) {
    return String(value || '').trim().toLowerCase();
}
function parseFrameSuffix(name) {
    const text = String(name || '').trim();
    if (!text)
        return null;
    const match = text.match(/^(.*?)(?:[_\-\s](?:f|frame))(\d+)$/i);
    if (!match)
        return null;
    const groupId = String(match[1] || '').trim();
    const frameOrder = parseInt(match[2], 10);
    if (!groupId || Number.isNaN(frameOrder))
        return null;
    return { groupId, frameOrder };
}
const TRANSFORM_OPERATION_CODES = {
    rotate_left: 1,
    rotate_right: 2,
    shift_left: 3,
    shift_right: 4,
    shift_up: 5,
    shift_down: 6,
    swap_top_bottom: 7
};
function normalizeAnimationMode(value) {
    const text = String(value || '').trim().toLowerCase();
    return text === 'transform' ? 'transform' : 'frames';
}
function normalizeTransformEffect(value) {
    const text = String(value || '').trim().toLowerCase();
    if (!text)
        return null;
    return Object.prototype.hasOwnProperty.call(TRANSFORM_OPERATION_CODES, text) ? text : null;
}
function readAnimationMeta(tile) {
    const anim = tile?.animation ?? tile?.animatedTile ?? tile?.tileAnimation ?? null;
    const explicitEnabled = typeof anim?.enabled === 'boolean'
        ? anim.enabled
        : (typeof tile?.isAnimated === 'boolean' ? tile.isAnimated : undefined);
    if (explicitEnabled === false || anim === false) {
        return {
            enabled: false,
            mode: 'frames',
            groupId: null,
            frameOrder: null,
            speed: null,
            baseTileId: null,
            transformEffect: null,
            transformIncludeColors: true,
            transformCheckpoints: null
        };
    }
    const groupRaw = tile?.animationGroup ??
        anim?.groupId ??
        anim?.group ??
        anim?.name ??
        anim?.id ??
        null;
    const groupId = typeof groupRaw === 'string' && groupRaw.trim() ? groupRaw.trim() : null;
    const frameRaw = tile?.animationFrameIndex ??
        tile?.frameIndex ??
        anim?.frameIndex ??
        anim?.frame ??
        null;
    const frameOrder = Number.isFinite(Number(frameRaw)) ? clampByte(Number(frameRaw), 0) : null;
    const speedRaw = tile?.animationSpeed ??
        tile?.animationSpeedFrames ??
        anim?.speed ??
        anim?.speedFrames ??
        anim?.ticksPerFrame ??
        null;
    const speed = Number.isFinite(Number(speedRaw)) ? clampByte(Number(speedRaw), 8, 1, 255) : null;
    const baseRaw = tile?.animationBaseTileId ?? anim?.baseTileId ?? anim?.targetTileId ?? null;
    const baseTileId = typeof baseRaw === 'string' && baseRaw.trim() ? baseRaw.trim() : null;
    const transformRaw = anim?.transform ?? null;
    const transformEffect = normalizeTransformEffect(tile?.animationTransformEffect ??
        anim?.transformEffect ??
        transformRaw?.effect ??
        anim?.effect);
    const modeRaw = tile?.animationMode ?? anim?.mode ?? anim?.animationMode ?? (transformEffect ? 'transform' : null);
    const mode = normalizeAnimationMode(modeRaw);
    const normalizedTransformEffect = transformEffect || (mode === 'transform' ? 'rotate_left' : null);
    const includeColorsRaw = tile?.animationTransformIncludeColors ??
        anim?.animationTransformIncludeColors ??
        transformRaw?.includeColors;
    const transformIncludeColors = typeof includeColorsRaw === 'boolean' ? includeColorsRaw : true;
    const checkpointsRaw = tile?.animationTransformCheckpoints ??
        anim?.animationTransformCheckpoints ??
        transformRaw?.checkpoints;
    const transformCheckpoints = Number.isFinite(Number(checkpointsRaw))
        ? clampByte(Number(checkpointsRaw), 8, 1, 255)
        : null;
    return {
        enabled: true,
        mode,
        groupId,
        frameOrder,
        speed,
        baseTileId,
        transformEffect: normalizedTransformEffect,
        transformIncludeColors,
        transformCheckpoints
    };
}
function buildTileCharMap(analysis) {
    const map = new Map();
    const tiles = Array.isArray(analysis.tiles) ? analysis.tiles : [];
    let nextCharCode = 128;
    tiles.forEach((tile, tileIndex) => {
        if (!tile?.id)
            return;
        const charsWide = Math.max(1, Math.ceil((tile.width || 8) / 8));
        const charsHigh = Math.max(1, Math.ceil((tile.height || 8) / 8));
        const charsPerTile = charsWide * charsHigh;
        map.set(tile.id, { charCode: nextCharCode, charsPerTile, tileIndex });
        nextCharCode += charsPerTile;
    });
    return map;
}
function toHexByte(value) {
    const n = clampByte(value, 0);
    return `#${n.toString(16).toUpperCase().padStart(2, '0')}`;
}
function sanitizeLabel(text, fallback) {
    const label = String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return label || fallback;
}
function chunkBytesForDb(bytes, perLine = 16) {
    if (!bytes.length)
        return '    db #00';
    const lines = [];
    for (let i = 0; i < bytes.length; i += perLine) {
        const chunk = bytes.slice(i, i + perLine).map(toHexByte).join(', ');
        lines.push(`    db ${chunk}`);
    }
    return lines.join('\n');
}
function applyHorizontalTransformRows(rows, operationCode, steps) {
    const out = rows.slice();
    const count = Math.max(0, steps | 0);
    for (let i = 0; i < out.length; i++) {
        let value = out[i] & 0xFF;
        for (let step = 0; step < count; step++) {
            switch (operationCode) {
                case 1:
                    value = ((value << 1) | (value >> 7)) & 0xFF;
                    break;
                case 2:
                    value = ((value >> 1) | ((value & 1) << 7)) & 0xFF;
                    break;
                case 3:
                    value = (value << 1) & 0xFF;
                    break;
                case 4:
                    value = (value >> 1) & 0xFF;
                    break;
                default:
                    break;
            }
        }
        out[i] = value;
    }
    return out;
}
function applyVerticalTransformRows(rows, operationCode, steps) {
    const out = rows.slice();
    if (operationCode === 7) {
        if ((steps & 1) === 0)
            return out;
        return [out[7], out[1], out[2], out[3], out[4], out[5], out[6], out[0]];
    }
    const count = steps % 8;
    if (count === 0)
        return out;
    if (operationCode === 5) {
        return out.slice(count).concat(out.slice(0, count));
    }
    if (operationCode === 6) {
        return out.slice(8 - count).concat(out.slice(0, 8 - count));
    }
    return out;
}
function buildTransformFrameBytes(patternBytes, colorBytes, charsPerTile, operationCode, includeColors, checkpoints) {
    const frames = [];
    for (let frameIndex = 0; frameIndex < checkpoints; frameIndex++) {
        const frameBytes = [];
        for (let charIndex = 0; charIndex < charsPerTile; charIndex++) {
            const offset = charIndex * 8;
            const basePattern = patternBytes.slice(offset, offset + 8);
            const baseColors = colorBytes.slice(offset, offset + 8);
            const patternRows = operationCode <= 4
                ? applyHorizontalTransformRows(basePattern, operationCode, frameIndex)
                : applyVerticalTransformRows(basePattern, operationCode, frameIndex);
            const colorRows = operationCode >= 5 && includeColors
                ? applyVerticalTransformRows(baseColors, operationCode, frameIndex)
                : baseColors;
            frameBytes.push(...patternRows, ...colorRows);
        }
        frames.push({
            tileName: `transform_step_${frameIndex}`,
            bytes: frameBytes
        });
    }
    return frames;
}
function prepareAnimationGroups(analysis) {
    const tiles = Array.isArray(analysis.tiles) ? analysis.tiles : [];
    if (!tiles.length)
        return { frameGroups: [], transformGroups: [] };
    const tileCharMap = buildTileCharMap(analysis);
    const tileById = new Map();
    tiles.forEach((tile) => {
        if (tile?.id)
            tileById.set(tile.id, tile);
    });
    const candidatesByGroup = new Map();
    const transformGroups = [];
    const transformFrameGroups = [];
    tiles.forEach((tile, tileIndex) => {
        const tileId = String(tile?.id || '').trim();
        if (!tileId)
            return;
        const tileCharInfo = tileCharMap.get(tileId);
        if (!tileCharInfo)
            return;
        const meta = readAnimationMeta(tile);
        if (!meta.enabled)
            return;
        const inferred = parseFrameSuffix(tile?.name || '');
        const groupId = (meta.groupId || inferred?.groupId || tile?.name || tileId || '').trim();
        if (meta.mode === 'transform') {
            const transformEffect = normalizeTransformEffect(meta.transformEffect);
            if (!transformEffect)
                return;
            const explicitBase = meta.baseTileId && tileCharMap.has(meta.baseTileId) ? meta.baseTileId : null;
            const targetTileId = explicitBase || tileId;
            const targetInfo = tileCharMap.get(targetTileId);
            if (!targetInfo)
                return;
            const targetCharCode = targetInfo.charCode;
            const charsPerTile = targetInfo.charsPerTile;
            if (targetCharCode < 0 || targetCharCode + charsPerTile - 1 > 255)
                return;
            const opCode = TRANSFORM_OPERATION_CODES[transformEffect];
            if (!opCode)
                return;
            const flags = meta.transformIncludeColors ? 1 : 0;
            const label = `anim_transform_${transformGroups.length}_${sanitizeLabel(groupId, `t${transformGroups.length}`)}`;
            const sourceTile = tileById.get(targetTileId);
            if (!sourceTile)
                return;
            const expectedPatternBytes = charsPerTile * 8;
            const patternBytes = Array.from((0, tileUtils_1.generateTilePatternBytes)(sourceTile, SCREEN2_MODE) || []);
            if (patternBytes.length !== expectedPatternBytes)
                return;
            const rawColorBytes = (0, tileUtils_1.generateTileColorBytes)(sourceTile);
            const defaultColor = 0xF1;
            const colorBytes = rawColorBytes
                ? Array.from(rawColorBytes).slice(0, expectedPatternBytes)
                : new Array(expectedPatternBytes).fill(defaultColor);
            while (colorBytes.length < expectedPatternBytes) {
                colorBytes.push(defaultColor);
            }
            const checkpoints = clampByte(meta.transformCheckpoints ?? 8, 8, 1, 255);
            transformGroups.push({
                label,
                groupId,
                speed: clampByte(meta.speed ?? 8, 8, 1, 255),
                targetTileId,
                targetCharCode,
                charsPerTile,
                operationCode: opCode,
                flags
            });
            transformFrameGroups.push({
                label,
                groupId,
                speed: clampByte(meta.speed ?? 8, 8, 1, 255),
                targetTileId,
                targetCharCode,
                charsPerTile,
                frameCount: checkpoints,
                bytesPerFrame: charsPerTile * 16,
                frames: buildTransformFrameBytes(patternBytes, colorBytes, charsPerTile, opCode, meta.transformIncludeColors, checkpoints)
            });
            return;
        }
        if (!groupId)
            return;
        let frameOrder = meta.frameOrder;
        if (frameOrder === null && inferred) {
            if (!meta.groupId || normalizeGroupId(meta.groupId) === normalizeGroupId(inferred.groupId)) {
                frameOrder = inferred.frameOrder;
            }
        }
        if (frameOrder === null) {
            frameOrder = tileCharInfo.tileIndex;
        }
        const speed = clampByte(meta.speed ?? 8, 8, 1, 255);
        const key = normalizeGroupId(groupId);
        const list = candidatesByGroup.get(key) || [];
        list.push({
            tile,
            tileIndex,
            tileId,
            groupId,
            frameOrder,
            speed,
            baseTileId: meta.baseTileId
        });
        candidatesByGroup.set(key, list);
    });
    const frameGroups = [];
    for (const entries of candidatesByGroup.values()) {
        if (entries.length < 2)
            continue;
        const sorted = [...entries].sort((a, b) => {
            if (a.frameOrder !== b.frameOrder)
                return a.frameOrder - b.frameOrder;
            return a.tileIndex - b.tileIndex;
        });
        const explicitBase = sorted.find((entry) => !!entry.baseTileId && tileCharMap.has(entry.baseTileId))?.baseTileId || null;
        const targetTileId = explicitBase || sorted[0].tileId;
        const targetInfo = tileCharMap.get(targetTileId);
        if (!targetInfo)
            continue;
        const compatibleFrames = sorted.filter((entry) => {
            const info = tileCharMap.get(entry.tileId);
            return !!info && info.charsPerTile === targetInfo.charsPerTile;
        });
        if (compatibleFrames.length < 2)
            continue;
        const targetCharCode = targetInfo.charCode;
        const charsPerTile = targetInfo.charsPerTile;
        if (targetCharCode < 0 || targetCharCode + charsPerTile - 1 > 255)
            continue;
        const frames = [];
        const expectedPatternBytes = charsPerTile * 8;
        let speed = compatibleFrames[0].speed;
        for (const frame of compatibleFrames) {
            const patternBytes = Array.from((0, tileUtils_1.generateTilePatternBytes)(frame.tile, SCREEN2_MODE) || []);
            if (patternBytes.length !== expectedPatternBytes)
                continue;
            const rawColorBytes = (0, tileUtils_1.generateTileColorBytes)(frame.tile);
            const defaultColor = 0xF1;
            const colorBytes = rawColorBytes
                ? Array.from(rawColorBytes).slice(0, expectedPatternBytes)
                : new Array(expectedPatternBytes).fill(defaultColor);
            while (colorBytes.length < expectedPatternBytes) {
                colorBytes.push(defaultColor);
            }
            const frameBytes = [];
            for (let charIndex = 0; charIndex < charsPerTile; charIndex++) {
                const offset = charIndex * 8;
                frameBytes.push(...patternBytes.slice(offset, offset + 8));
                frameBytes.push(...colorBytes.slice(offset, offset + 8));
            }
            frames.push({
                tileName: String(frame.tile?.name || frame.tileId),
                bytes: frameBytes
            });
            speed = Math.min(speed, frame.speed);
        }
        if (frames.length < 2)
            continue;
        const groupId = compatibleFrames[0].groupId;
        const label = `anim_group_${frameGroups.length}_${sanitizeLabel(groupId, `g${frameGroups.length}`)}`;
        frameGroups.push({
            label,
            groupId,
            speed: clampByte(speed, 8, 1, 255),
            targetTileId,
            targetCharCode,
            charsPerTile,
            frameCount: clampByte(frames.length, frames.length, 2, 255),
            bytesPerFrame: charsPerTile * 16,
            frames
        });
    }
    return { frameGroups: [...frameGroups, ...transformFrameGroups], transformGroups };
}
/**
 * Generate animated tiles file (animtiles.asm)
 *
 * @param analysis - Project analysis
 * @returns ASM code string with animated tiles system
 */
function generateAnimatedTilesFile(analysis) {
    const { frameGroups, transformGroups } = prepareAnimationGroups(analysis);
    const hasFrameAnimatedTiles = frameGroups.length > 0;
    const hasTransformAnimatedTiles = transformGroups.length > 0;
    const defaultGlobalSpeed = clampByte(frameGroups[0]?.speed ?? transformGroups[0]?.speed ?? 8, 8, 1, 255);
    const maxAnimTiles = Math.max(1, frameGroups.length + transformGroups.length);
    const tableEntries = hasFrameAnimatedTiles
        ? frameGroups.map((group) => `    db ${group.targetCharCode}, ${group.charsPerTile}, ${group.frameCount}, ${group.speed}, ${group.bytesPerFrame}    ; ${group.groupId} -> tile ${group.targetTileId}
    dw ${group.label}`).join('\n')
        : `    ; No animated tile groups detected in project data`;
    const transformTableEntries = `    ; Transform groups are precomputed as frame data in anim_tile_table`;
    const dataBlocks = hasFrameAnimatedTiles
        ? frameGroups.map((group) => {
            const frames = group.frames
                .slice(0, group.frameCount)
                .map((frame, frameIndex) => {
                return `    ; Frame ${frameIndex}: ${frame.tileName}
${chunkBytesForDb(frame.bytes)}`;
            })
                .join('\n');
            return `${group.label}:
    ; Group "${group.groupId}" targetChar=${group.targetCharCode} chars=${group.charsPerTile}
${frames}
`;
        }).join('\n')
        : `anim_group_empty_data:
    db #00
`;
    const frameVramUpdateBlock = hasFrameAnimatedTiles
        ? `    call mapper_push_p2
    ld a, ANIM_TILE_DATA_BANK
    call mapper_set_bank_p2

    ld hl, anim_tile_table

.anim_vram_loop:
    ld a, (hl)                      ; A = target char code
    cp 255
    jr z, .anim_vram_done

    push af                         ; Save target char code
    inc hl
    ld a, (hl)                      ; A = chars per tile
    push af
    inc hl
    ld b, (hl)                      ; B = frame count
    inc hl
    inc hl                          ; Skip speed byte (reserved)
    ld c, (hl)                      ; C = bytes per frame
    inc hl
    ld e, (hl)                      ; DE = data pointer
    inc hl
    ld d, (hl)
    inc hl                          ; HL = next table entry
    push hl
    ex de, hl                       ; HL = data pointer

    ; frame = global_frame % frame_count
    ; Fast path for power-of-two frame counts: frame & (count-1)
    ld a, b
    dec a
    ld d, a
    and b
    jr nz, .anim_mod_slow
    ld a, (anim_tile_frame)
    and d
    jr .anim_mod_done
.anim_mod_slow:
    ld a, (anim_tile_frame)
.anim_mod_loop:
    cp b
    jr c, .anim_mod_done
    sub b
    jr .anim_mod_loop
.anim_mod_done:

    ; DE = frame offset (frame * bytes_per_frame)
    ld b, a
    ld d, 0
    ld e, 0
.anim_mul_loop:
    ld a, b
    or a
    jr z, .anim_mul_done
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    dec b
    jr .anim_mul_loop
.anim_mul_done:
    add hl, de                      ; HL = frame data pointer

    pop de                          ; DE = next table entry pointer
    pop af
    ld b, a                         ; B = chars per tile
    pop af
    ld c, a                         ; C = target char code
    push de

.anim_char_loop:
    ld a, b
    or a
    jr z, .anim_char_done

    push bc
    push hl
    ld a, c
    call anim_upload_char_frame
    pop hl
    pop bc

    ld de, 16
    add hl, de                      ; Next char frame chunk
    inc c                           ; Next target char code
    dec b
    jr .anim_char_loop

.anim_char_done:
    pop de
    ex de, hl                       ; HL = next table entry
    jr .anim_vram_loop

.anim_vram_done:
    call mapper_pop_p2`
        : '';
    const transformVramUpdateBlock = '';
    const updateVramBody = [frameVramUpdateBlock, transformVramUpdateBlock]
        .filter(Boolean)
        .join('\n');
    return `; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: ${frameGroups.length}
;   transform groups: ${transformGroups.length}

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU ${maxAnimTiles}
ANIM_TILE_ENTRY_SIZE    EQU 7       ; char, chars, frames, speed, bytesPerFrame, ptr(2)
ANIM_TRANS_ENTRY_SIZE   EQU 4       ; char, chars, opCode, flags
ANIM_TILE_DATA_BANK     EQU ((anim_tile_table - #4000) / #2000)

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default global animation speed
    ld a, ${defaultGlobalSpeed}
    ld (anim_tile_speed), a

    ; Upload initial animation frame state immediately
    call update_animated_tiles_vram

    ret

; ==================================================================
; ANIMATED TILES UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_animated_tiles
; Update animation frame and redraw animated tiles if needed
; Call this every frame from main loop
; ------------------------------------------------------------------
update_animated_tiles:
    ; Increment timer
    ld a, (anim_tile_timer)
    inc a
    ld (anim_tile_timer), a

    ; Check if it's time to advance frame
    ld b, a
    ld a, (anim_tile_speed)
    or a
    jr nz, .anim_speed_ok
    ld a, 1
    ld (anim_tile_speed), a
.anim_speed_ok:
    cp b
    ret nc                          ; Not yet time to update (timer < speed)

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance global animation counter
    ld a, (anim_tile_frame)
    inc a
    ld (anim_tile_frame), a

    ; Update all animated tiles in VRAM
    call update_animated_tiles_vram

    ret

; ------------------------------------------------------------------
; update_animated_tiles_vram
; Update pattern data in VRAM for all animated tiles
; This updates the actual tile patterns based on current frame
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_animated_tiles_vram:
    ; Protect VDP port sequence from ISR VRAM writes (sprite task, etc.)
    ; Preserve prior interrupt state using LD A,I -> P/V = IFF2
    ld a, i
    push af
    di
${updateVramBody}
    pop af
    jp po, .anim_vram_irq_done
    ei
.anim_vram_irq_done:
    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    or a
    jr nz, .anim_speed_store
    ld a, 1
.anim_speed_store:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; anim_copy_8_bytes
; Copy 8 bytes from CPU memory to VRAM
; Input: DE = source pointer, HL = VRAM destination
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
anim_copy_8_bytes:
    ld b, 8
.anim_copy_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_copy_loop

    ret

; ==================================================================
; anim_upload_char_frame
; Upload one animated char (pattern + color) to all 3 Screen 2 banks
; Input: A = target char code, HL = source frame chunk (16 bytes)
; Source layout: 8 pattern bytes + 8 color bytes
; Destroys: AF, BC, DE, HL
; ==================================================================
anim_upload_char_frame:
    push af
    push bc
    push de
    push hl

    ; BC = target char offset (charCode * 8)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    pop hl
    ex de, hl                      ; DE = source pattern pointer

    ; Pattern bank 0
    push de
    ld hl, CHRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 1
    push de
    ld hl, CHRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 2
    ld hl, CHRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    ; DE now points to color bytes (source + 8)
    ; Color bank 0
    push de
    ld hl, CLRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 1
    push de
    ld hl, CLRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 2
    ld hl, CLRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TRANSFORM MODE ROUTINES (Z80 runtime bit/row transforms)
; ==================================================================

; ------------------------------------------------------------------
; Routine: update_animated_transform_tiles_vram
; Purpose:
;   Applies Z80 transform operations directly on tile bytes in VRAM.
; Input:
;   None
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses PUSH/POP HL, BC and DE internally
; ------------------------------------------------------------------
update_animated_transform_tiles_vram:
${hasTransformAnimatedTiles ? `    ld hl, anim_transform_table

.anim_transform_loop:
    ld a, (hl)                      ; A = target char code
    cp 255
    ret z

    ld c, a                         ; C = first char code
    inc hl
    ld b, (hl)                      ; B = chars per tile
    inc hl
    ld d, (hl)                      ; D = operation code
    inc hl
    ld a, (hl)                      ; A = flags
    ld (anim_tile_transform_flags), a
    inc hl                          ; HL = next table entry
    push hl

.anim_transform_char_loop:
    ld a, b
    or a
    jr z, .anim_transform_next

    push bc
    push de
    ld a, c
    call anim_transform_char_frame
    pop de
    pop bc

    inc c
    dec b
    jr .anim_transform_char_loop

.anim_transform_next:
    pop hl
    jr .anim_transform_loop` : `    ret`}

; ------------------------------------------------------------------
; Routine: anim_transform_char_frame
; Purpose:
;   Transform one character pattern in all SCREEN 2 banks.
; Input:
;   A = character code
;   D = transform operation code
;   (anim_tile_transform_flags).bit0 = transform color rows too
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Pushes/pops BC, DE and HL
; ------------------------------------------------------------------
anim_transform_char_frame:
    push bc
    push de
    push hl

    ; BC = charCode * 8 (row offset in pattern/color tables)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    ; Save opcode D to scratch RAM so anim_transform_vram_block can reload it
    ; after DE is reused internally as a pointer.
    ld a, d
    ld (anim_tile_transform_flags + 1), a

    ; Pattern banks: read bank 0 once and mirror the transformed result to all 3
    ; SCREEN 2 banks to keep animation phase identical across thirds.
    ld hl, CHRTBL2
    add hl, bc
    call anim_transform_vram_block

    ; anim_transform_vram_block reuses DE internally, so reload the opcode
    ; from scratch RAM before deciding whether color rows also need a transform.
    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr c, .anim_transform_char_done

    ld a, (anim_tile_transform_flags)
    and 1
    jr z, .anim_transform_char_done

    ; Color banks: same approach, read bank 0 and mirror to all 3 banks.
    ld a, (anim_tile_transform_flags + 1)
    ld d, a
    ld hl, CLRTBL2
    add hl, bc
    call anim_transform_vram_block

.anim_transform_char_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; Routine: anim_transform_vram_block
; Purpose:
;   Apply transform to one 8-byte VRAM block (one char rows table).
; Input:
;   HL = VRAM base address for row 0 (8 consecutive bytes)
;   D  = operation code:
;        1 rotate_left  (RLCA)
;        2 rotate_right (RRCA)
;        3 shift_left   (SLA)
;        4 shift_right  (SRL)
;        5 shift_up rows
;        6 shift_down rows
;        7 swap top/bottom row
; Output:
;   None
; Modifies:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; Flags:
;   Not preserved
; Stack:
;   Uses stack while reading row bytes
; ------------------------------------------------------------------
anim_transform_vram_block:
    ; HL = VRAM base address for bank 0. The routine captures the source rows
    ; from bank 0, transforms them in RAM, then writes the same result to the
    ; three SCREEN 2 banks. This prevents per-bank phase drift.
    ld a, d
    cp 5
    jr nc, .anim_transform_vertical

    ; Step 1: Read bank 0 into the RAM buffer.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_horiz_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte from VRAM[HL]
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_horiz_loop
    pop hl

    ; Step 2: Transform the buffered bytes in RAM.
    ld de, anim_tile_row_buffer
    ld b, 8
    ld a, (anim_tile_transform_flags + 1)
    ld c, a
.anim_apply_horiz_loop:
    ld a, (de)
    push de
    push bc
    ld b, a
    ld a, c
    cp 1
    jr nz, .anim_not_rl3
    ld a, b
    rlca
    jr .anim_store_h
.anim_not_rl3:
    cp 2
    jr nz, .anim_not_rr3
    ld a, b
    rrca
    jr .anim_store_h
.anim_not_rr3:
    cp 3
    jr nz, .anim_not_sla3
    ld a, b
    sla a
    jr .anim_store_h
.anim_not_sla3:
    ld a, b
    srl a
.anim_store_h:
    pop bc
    pop de
    ld (de), a
    inc de
    djnz .anim_apply_horiz_loop

    ; Step 3: Mirror the transformed buffer to the 3 pattern/color banks.
    push hl
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank0_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank0_loop
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank1_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank1_loop
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_write_bank2_loop:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_bank2_loop
    ret

.anim_transform_vertical:
    ; Step 1: Read bank 0 into the RAM buffer.
    push de
    ld de, anim_tile_row_buffer
    ld b, 8
.anim_read_rows_loop:
    push hl
    call FAST_RDVRM                 ; A = row byte
    pop hl
    ld (de), a
    inc de
    inc hl
    djnz .anim_read_rows_loop
    pop de

    ; Restore HL to the start of bank 0 and reload the opcode scratch byte.
    ld de, #FFF8
    add hl, de

    ld a, (anim_tile_transform_flags + 1)
    cp 5
    jr nz, .anim_not_shift_up

    ; shift_up: row0<-row1 ... row6<-row7 row7<-row0(original)
    push hl
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld de, anim_tile_row_buffer + 1
    ld b, 7
.anim_write_up_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_up_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

.anim_not_shift_up:
    cp 6
    jr nz, .anim_not_shift_down

    ; shift_down: row0<-row7(original) row1<-row0 ... row7<-row6
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b0
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b1
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer
    ld b, 7
.anim_write_dn_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_dn_b2
    ret

.anim_not_shift_down:
    ; swap_top_bottom: row0<->row7, middle rows unchanged
    push hl
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b0:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b0
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    push hl
    ld de, #0800
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b1:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b1
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    pop hl

    ld de, #1000
    add hl, de
    ld a, (anim_tile_row_buffer + 7)
    call FAST_WRTVRM
    inc hl
    ld de, anim_tile_row_buffer + 1
    ld b, 6
.anim_write_sw_mid_b2:
    ld a, (de)
    call FAST_WRTVRM
    inc de
    inc hl
    djnz .anim_write_sw_mid_b2
    ld a, (anim_tile_row_buffer)
    call FAST_WRTVRM
    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS (AUTO-GENERATED)
; ==================================================================

; ------------------------------------------------------------------
; Animated tile mapping table
; Format:
;   db targetCharCode, charsPerTile, numFrames, speed, bytesPerFrame
;   dw frameDataPointer
; ------------------------------------------------------------------
anim_tile_table:
${tableEntries}
    db 255                          ; End marker

; ------------------------------------------------------------------
; Transform tile mapping table
; Format:
;   db targetCharCode, charsPerTile, opCode, flags
; flags:
;   bit0 = apply vertical transform on color rows
; ------------------------------------------------------------------
anim_transform_table:
${transformTableEntries}
    db 255                          ; End marker

; ==================================================================
; ANIMATION FRAME DATA
; ==================================================================
${dataBlocks}

; ------------------------------------------------------------------
; register_animated_tile
; Runtime registration is not supported in this generator version.
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    xor a                           ; Not supported (static generated table)
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = target char code
; Output: A = Current frame index (mod numFrames), or 0 if not animated
; Destroys: BC, DE, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = char code to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)
    cp 255
    jr z, .anim_not_found
    cp c
    jr z, .anim_found_tile

    ld de, ANIM_TILE_ENTRY_SIZE
    add hl, de
    jr .anim_search_loop

.anim_found_tile:
    inc hl
    inc hl
    ld b, (hl)                      ; B = numFrames
    ld a, (anim_tile_frame)
.anim_found_mod:
    cp b
    jr c, .anim_found_done
    sub b
    jr .anim_found_mod
.anim_found_done:
    ret

.anim_not_found:
    xor a
    ret

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================
`;
}
