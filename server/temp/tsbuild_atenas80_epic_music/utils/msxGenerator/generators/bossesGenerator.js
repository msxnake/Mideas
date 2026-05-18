"use strict";
/**
 * @fileoverview Boss ASM data generator.
 *
 * Exports boss editor data as compact ASM tables. Runtime systems can read
 * these tables to apply phase layouts, neck chains, crush movement and shots.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBossDataBankSections = generateBossDataBankSections;
exports.generateBossesFile = generateBossesFile;
const screen2TileBanks_1 = require("../utils/screen2TileBanks");
const screenUtils_1 = require("../../../components/utils/screenUtils");
const spriteUtils_1 = require("../../../components/utils/spriteUtils");
const constants_1 = require("../../../constants");
const EMPTY_REF = '#FFFF';
const BOSS_ATTACK_RUNTIME_TYPES = [
    'Projectile',
    'Meteor',
    'Bomb',
    'Boomerang',
    'Rock',
    'Laser',
    'SineWave',
    'HomingMissile',
    'SlamRocks',
    'FallingBlocks'
];
function wrapMideasAsmBlock(asm, options) {
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
function collectPlacedBossAssetIds(analysis) {
    const bossIds = new Set();
    (analysis.screenMaps || []).forEach(screen => {
        (screen.bossInstances || []).forEach((instance) => {
            if (instance?.bossAssetId) {
                bossIds.add(instance.bossAssetId);
            }
        });
    });
    return bossIds;
}
function selectRuntimeBossEntries(analysis, bosses) {
    const placedBossIds = collectPlacedBossAssetIds(analysis);
    return bosses
        .map((boss, originalIndex) => ({ boss, originalIndex }))
        .filter(entry => placedBossIds.size === 0 || !entry.boss.id || placedBossIds.has(entry.boss.id));
}
function collectUsedBossAttackIds(boss) {
    const usedAttackIds = new Set();
    (boss.phases || []).forEach(phase => {
        (phase.attackSequence || []).forEach(attackId => {
            usedAttackIds.add(attackId);
        });
        (phase.behaviorLoop || []).forEach(action => {
            if (action.type === 'attack' && action.attackId) {
                usedAttackIds.add(action.attackId);
            }
        });
    });
    return usedAttackIds;
}
function collectBossFeatureSet(bosses) {
    const usedAttackTypes = new Set();
    const usedBehaviorTypes = new Set();
    let hasForms = false;
    let hasWeakPoints = false;
    let hasNeckChains = false;
    let hasCrushMovement = false;
    bosses.forEach(boss => {
        const attackById = new Map((boss.attacks || []).map(attack => [attack.id, attack]));
        collectUsedBossAttackIds(boss).forEach(attackId => {
            const attack = attackById.get(attackId);
            if (attack) {
                usedAttackTypes.add(attack.type || 'Projectile');
            }
        });
        (boss.phases || []).forEach(phase => {
            if ((phase.weakPoints || []).length > 0 || (phase.forms || []).some(form => (form.weakPoints || []).length > 0)) {
                hasWeakPoints = true;
            }
            if (phase.neckChain?.enabled && (phase.neckChain.segments || []).length > 0) {
                hasNeckChains = true;
            }
            if (phase.crushMovement?.enabled) {
                hasCrushMovement = true;
            }
            (phase.behaviorLoop || []).forEach(action => {
                usedBehaviorTypes.add(action.type);
                if (action.type === 'setForm' || action.type === 'animateForm') {
                    hasForms = true;
                }
                if (action.type === 'slam') {
                    hasCrushMovement = true;
                }
            });
        });
    });
    return {
        hasBosses: bosses.length > 0,
        hasForms,
        hasWeakPoints,
        hasNeckChains,
        hasCrushMovement,
        usedAttackTypes,
        usedBehaviorTypes
    };
}
function usesBossAttack(features, type) {
    return features.usedAttackTypes.has(type);
}
function formatBossFeatureList(values) {
    const items = Array.from(values).sort();
    return items.length > 0 ? items.join(', ') : 'none';
}
function renderBossFeatureSummary(features) {
    const attackTypes = formatBossFeatureList(features.usedAttackTypes);
    const behaviorTypes = formatBossFeatureList(features.usedBehaviorTypes);
    const excludedAttackTypes = BOSS_ATTACK_RUNTIME_TYPES.filter(type => !features.usedAttackTypes.has(type));
    return [
        `; Boss feature set: bosses=${features.hasBosses ? 'yes' : 'no'}, forms=${features.hasForms ? 'yes' : 'no'}, weakPoints=${features.hasWeakPoints ? 'yes' : 'no'}, neckChains=${features.hasNeckChains ? 'yes' : 'no'}, crushMovement=${features.hasCrushMovement ? 'yes' : 'no'}`,
        `; Boss behavior actions used: ${behaviorTypes}`,
        `; Boss attack runtimes included: ${attackTypes}`,
        `; Boss attack runtimes excluded: ${formatBossFeatureList(excludedAttackTypes)}`
    ];
}
function replaceAsmLabelRange(asm, startLabel, endLabel, replacement) {
    const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = endLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedStart}:[\\s\\S]*?(?=^${escapedEnd}:)`, 'm');
    return asm.replace(pattern, replacement.trimEnd() + '\n\n');
}
function replaceAsmLabelRangeToEnd(asm, startLabel, replacement) {
    const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedStart}:[\\s\\S]*$`, 'm');
    return asm.replace(pattern, replacement.trimEnd() + '\n');
}
function stripUnusedBossAttackRuntime(asm, features) {
    let optimizedAsm = asm;
    if (features.usedAttackTypes.size === 1 && usesBossAttack(features, 'Projectile')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_attack', 'draw_boss_projectile_attack', `
draw_boss_attack:
    jp draw_boss_projectile_attack
`);
    }
    if (features.usedAttackTypes.size === 0) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'boss_draw_behavior_attack', 'boss_attack_get_sprite_pattern', `
boss_draw_behavior_attack:
    ret
`);
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'boss_attack_get_sprite_pattern', 'draw_boss_projectile_attack', `
boss_attack_get_sprite_pattern:
    ret

draw_boss_attack:
    ret
`);
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_projectile_attack', 'draw_boss_slam_rocks_attack', `
draw_boss_projectile_attack:
    ret

update_boss_projectile_runtime:
    ret

boss_projectile_show_current:
    ret

boss_projectile_hide_all:
    ret
`);
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_slam_rocks_attack', 'draw_boss_falling_blocks_attack', `
boss_slam_rocks_hide_all:
    ret
`);
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_falling_blocks_attack', 'draw_boss_meteor_attack', `
boss_falling_blocks_hide_all:
    ret
`);
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_meteor_attack', 'draw_boss_bomb_attack', '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_bomb_attack', 'draw_boss_boomerang_attack', '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_boomerang_attack', 'draw_boss_rock_attack', '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_rock_attack', 'draw_boss_sine_wave_attack', '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_sine_wave_attack', 'draw_boss_homing_missile_attack', '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_homing_missile_attack', 'draw_boss_laser_attack', '');
        optimizedAsm = replaceAsmLabelRangeToEnd(optimizedAsm, 'draw_boss_laser_attack', '');
        return optimizedAsm;
    }
    if (!usesBossAttack(features, 'Projectile')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_projectile_attack', 'draw_boss_slam_rocks_attack', `
draw_boss_projectile_attack:
    ret

update_boss_projectile_runtime:
    ret

boss_projectile_show_current:
    ret

boss_projectile_hide_all:
    ret
`);
    }
    if (!usesBossAttack(features, 'SlamRocks')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_slam_rocks_attack', 'draw_boss_falling_blocks_attack', `
draw_boss_slam_rocks_attack:
    ret

update_boss_slam_rocks_runtime:
    ret

boss_slam_rocks_hide_all:
    ret
`);
    }
    if (!usesBossAttack(features, 'FallingBlocks')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_falling_blocks_attack', 'draw_boss_meteor_attack', `
draw_boss_falling_blocks_attack:
    ret

update_boss_falling_blocks_runtime:
    ret

boss_falling_blocks_hide_all:
    ret
`);
    }
    if (!usesBossAttack(features, 'Meteor')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_meteor_attack', 'draw_boss_bomb_attack', `
draw_boss_meteor_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'Bomb')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_bomb_attack', 'draw_boss_boomerang_attack', `
draw_boss_bomb_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'Boomerang')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_boomerang_attack', 'draw_boss_rock_attack', `
draw_boss_boomerang_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'Rock')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_rock_attack', 'draw_boss_sine_wave_attack', `
draw_boss_rock_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'SineWave')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_sine_wave_attack', 'draw_boss_homing_missile_attack', `
draw_boss_sine_wave_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'HomingMissile')) {
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'draw_boss_homing_missile_attack', 'draw_boss_laser_attack', `
draw_boss_homing_missile_attack:
    ret
`);
    }
    if (!usesBossAttack(features, 'Laser')) {
        optimizedAsm = replaceAsmLabelRangeToEnd(optimizedAsm, 'draw_boss_laser_attack', `
draw_boss_laser_attack:
    ret
`);
    }
    return optimizedAsm;
}
function stripUnusedBossBehaviorRuntime(asm, features) {
    let optimizedAsm = asm;
    if (!features.usedBehaviorTypes.has('slam')) {
        optimizedAsm = optimizedAsm.replace(`    cp BOSS_BEHAVIOR_SLAM\n    jp z, .ubb_move\n`, '');
        optimizedAsm = optimizedAsm.replace(`    cp BOSS_BEHAVIOR_SLAM\n    jp z, boss_prepare_behavior_move_timing\n`, '');
    }
    if (!features.usedBehaviorTypes.has('attack')) {
        optimizedAsm = optimizedAsm.replace(`    cp BOSS_BEHAVIOR_ATTACK\n    jp z, .ubb_attack\n`, '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, '.ubb_attack', '.ubb_loop', '');
    }
    if (!features.hasForms) {
        optimizedAsm = optimizedAsm.replace(`    cp BOSS_BEHAVIOR_SET_FORM\n    jp z, .ubb_tick\n`, '');
        optimizedAsm = optimizedAsm.replace(`    cp BOSS_BEHAVIOR_SET_FORM\n    jp z, boss_apply_behavior_form\n`, '');
        optimizedAsm = replaceAsmLabelRange(optimizedAsm, 'boss_apply_behavior_form', 'boss_prepare_behavior_move_timing', `
boss_apply_behavior_form:
    ret
`);
    }
    return optimizedAsm;
}
function stripUnusedBossGeneralRuntime(asm) {
    return replaceAsmLabelRange(asm, 'restore_active_boss_tiles', 'restore_active_boss_tiles_exposed', `
restore_active_boss_tiles:
    ret
`);
}
function sanitizeLabel(value, fallback) {
    const cleaned = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^([0-9])/, '_$1')
        .toLowerCase();
    return cleaned || fallback;
}
function clampByte(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return fallback & 0xff;
    return Math.max(0, Math.min(255, Math.round(numeric))) & 0xff;
}
function signedByte(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return fallback & 0xff;
    const clamped = Math.max(-128, Math.min(127, Math.round(numeric)));
    return clamped < 0 ? 256 + clamped : clamped;
}
function word(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return fallback & 0xffff;
    return Math.max(0, Math.min(65535, Math.round(numeric))) & 0xffff;
}
function hexByte(value) {
    return `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}
function hexWord(value) {
    return `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}
function db(values, comment) {
    const rendered = values.map(value => typeof value === 'number' ? hexByte(value) : value).join(', ');
    return `    db ${rendered}${comment ? `    ; ${comment}` : ''}`;
}
function dw(values, comment) {
    const rendered = values.map(value => typeof value === 'number' ? hexWord(value) : value).join(', ');
    return `    dw ${rendered}${comment ? `    ; ${comment}` : ''}`;
}
function bossDataPtr(label, pointerConfig) {
    if (!pointerConfig || label === EMPTY_REF) {
        return label;
    }
    return `((${label} & ${pointerConfig.windowMaskExpr}) | ${pointerConfig.windowBaseExpr})`;
}
function chunkedDb(bytes, perLine = 16) {
    if (bytes.length === 0)
        return '    db #FF';
    const lines = [];
    for (let offset = 0; offset < bytes.length; offset += perLine) {
        lines.push(db(bytes.slice(offset, offset + perLine)));
    }
    return lines.join('\n');
}
function bossMatrixKey(width, height, bytes) {
    return `${width}x${height}:${bytes.join(',')}`;
}
function directionId(direction) {
    switch (direction) {
        case 'right': return 1;
        case 'up': return 2;
        case 'down': return 3;
        case 'left':
        default:
            return 0;
    }
}
function buildIndexById(items) {
    return new Map((items || []).map((item, index) => [item.id, index]));
}
function getTileIndex(tileId, tileIndexById) {
    if (!tileId)
        return 255;
    const index = tileIndexById.get(tileId);
    return index === undefined ? 255 : clampByte(index, 255);
}
function getSpriteIndex(spriteId, spriteIndexById) {
    if (!spriteId)
        return 255;
    const index = spriteIndexById.get(spriteId);
    return index === undefined ? 255 : clampByte(index, 255);
}
function getAttackTypeId(type) {
    switch (type) {
        case 'Melee': return 1;
        case 'Special': return 2;
        case 'Pattern': return 3;
        case 'Meteor': return 4;
        case 'Bomb': return 5;
        case 'Boomerang': return 6;
        case 'Rock': return 7;
        case 'Laser': return 8;
        case 'SineWave': return 9;
        case 'HomingMissile': return 10;
        case 'SlamRocks': return 11;
        case 'FallingBlocks': return 12;
        case 'Projectile':
        default:
            return 0;
    }
}
function getAttackTileCharCode(tileId, tileIndexById, analysis, tileBankId, yChar) {
    if (!tileId)
        return 0;
    const runtimeCharCode = (0, screen2TileBanks_1.resolveRuntimeScreen2TileBankCharCode)(analysis, tileBankId, tileId, Math.max(0, Math.min(23, Math.floor(yChar))), 0, 0);
    return runtimeCharCode > 0 ? clampByte(runtimeCharCode) : getTileIndex(tileId, tileIndexById);
}
function getAttackTileBehaviorByte(tileId, analysis, fallback = 0x11) {
    const tile = tileId ? (analysis.tiles || []).find(candidate => candidate.id === tileId) : undefined;
    const behaviorByte = (0, screenUtils_1.encodeBehaviorByteFromLogicalProperties)(tile?.logicalProperties);
    return behaviorByte > 0 ? clampByte(behaviorByte) : clampByte(fallback);
}
function hexToRGB(hex) {
    if (!hex || hex.startsWith('rgba'))
        return null;
    const clean = hex.replace('#', '');
    if (clean.length !== 6)
        return null;
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}
function hexToMSX1Index(hex) {
    const exact = constants_1.MSX1_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase());
    if (exact)
        return exact.index;
    const rgb = hexToRGB(hex);
    if (!rgb)
        return 15;
    let bestIndex = 15;
    let bestDist = Infinity;
    for (const color of constants_1.MSX1_PALETTE) {
        if (color.index === 0)
            continue;
        const candidate = hexToRGB(color.hex);
        if (!candidate)
            continue;
        const dist = (rgb.r - candidate.r) ** 2 + (rgb.g - candidate.g) ** 2 + (rgb.b - candidate.b) ** 2;
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = color.index;
        }
    }
    return bestIndex;
}
function getProjectileSpriteMeta(attack, analysis) {
    const sprite = attack.spriteAssetId
        ? (analysis.sprites || []).find(candidate => candidate.id === attack.spriteAssetId)
        : undefined;
    const drawableLayers = sprite ? (0, spriteUtils_1.getSpriteDrawableLayerIndexes)(sprite) : [];
    const palette = sprite?.spritePalette || [];
    const backgroundColor = sprite?.backgroundColor;
    const colors = drawableLayers
        .map(layerIndex => {
        const hex = palette[layerIndex];
        if (!hex || (backgroundColor && hex === backgroundColor))
            return 0;
        return hexToMSX1Index(hex);
    })
        .filter(color => color > 0);
    const color0 = clampByte(colors[0] || 15);
    return {
        layerCount: clampByte(Math.max(1, drawableLayers.length || colors.length || 1)),
        frameCount: clampByte(Math.max(1, sprite?.frames?.length || 1)),
        color0,
        color1: clampByte(colors[1] || color0)
    };
}
function getBuildTypeId(type) {
    return type === 'sprite' ? 1 : 0;
}
function getBehaviorActionTypeId(type) {
    switch (type) {
        case 'moveTo': return 1;
        case 'attack': return 2;
        case 'slam': return 3;
        case 'protect': return 4;
        case 'shield': return 5;
        case 'setForm': return 6;
        case 'animateForm': return 7;
        case 'loop': return 8;
        case 'wait':
        default:
            return 0;
    }
}
function getBehaviorTargetTypeId(type) {
    switch (type) {
        case 'playerCurrent': return 1;
        case 'playerPredicted': return 2;
        case 'playerLastKnown': return 3;
        case 'bossRelative': return 4;
        case 'fixed':
        default:
            return 0;
    }
}
function behaviorActionDuration(action) {
    switch (action.type) {
        case 'wait':
            return action.frames;
        case 'moveTo':
            return action.durationFrames;
        case 'attack':
            return Math.max(1, action.delayAfterFrames ?? 1);
        case 'slam':
            return action.windupFrames + action.slamFrames + (action.holdFrames ?? 0) + action.returnFrames;
        case 'protect':
        case 'shield':
            return action.durationFrames;
        case 'animateForm':
            return Math.max(1, action.frameDurationFrames) * Math.max(1, action.formIds.length) * Math.max(1, action.loops);
        case 'setForm':
        case 'loop':
        default:
            return 1;
    }
}
function getBehaviorTarget(action) {
    return 'target' in action ? action.target : undefined;
}
const CURRENT_FORM_ID = '__phase_current_form';
function buildFormIndexById(phase) {
    const formIndexById = new Map();
    formIndexById.set(CURRENT_FORM_ID, 0);
    (phase.forms || []).forEach((form, index) => {
        formIndexById.set(form.id, index + 1);
    });
    return formIndexById;
}
function getFormIndex(formId, formIndexById) {
    if (!formId)
        return 0;
    return formIndexById.get(formId) ?? 0;
}
function renderBehaviorLoop(label, phase, attackIndexById, formIndexById) {
    const loop = phase.behaviorLoop || [];
    const expandedActions = [];
    const sourceIndexToExpandedIndex = new Map();
    loop.forEach((action, sourceIndex) => {
        sourceIndexToExpandedIndex.set(sourceIndex, expandedActions.length);
        if (action.type === 'animateForm') {
            const formIds = action.formIds.length > 0 ? action.formIds : [CURRENT_FORM_ID];
            const repeats = Math.max(1, action.loops);
            for (let loopIndex = 0; loopIndex < repeats; loopIndex++) {
                formIds.forEach(formId => {
                    expandedActions.push({
                        sourceIndex,
                        action,
                        typeId: getBehaviorActionTypeId('setForm'),
                        duration: Math.max(1, action.frameDurationFrames),
                        aux0: getFormIndex(formId, formIndexById),
                    });
                });
            }
            return;
        }
        expandedActions.push({ sourceIndex, action });
    });
    const totalFrames = expandedActions.reduce((sum, item) => sum + (item.duration ?? behaviorActionDuration(item.action)), 0);
    const actionBytes = [];
    expandedActions.forEach(item => {
        const action = item.action;
        const target = getBehaviorTarget(action);
        const attackIndex = action.type === 'attack' && action.attackId ? attackIndexById.get(action.attackId) : undefined;
        let aux0 = item.aux0;
        if (aux0 === undefined) {
            if (action.type === 'loop') {
                aux0 = sourceIndexToExpandedIndex.get(action.targetIndex) ?? 0;
            }
            else if (action.type === 'setForm') {
                aux0 = getFormIndex(action.formId, formIndexById);
            }
            else {
                aux0 = attackIndex === undefined ? 255 : clampByte(attackIndex);
            }
        }
        actionBytes.push(item.typeId ?? getBehaviorActionTypeId(action.type), clampByte(item.duration ?? behaviorActionDuration(action), 1), getBehaviorTargetTypeId(target?.type), target?.type === 'bossRelative' ? signedByte(target.dxChar || 0) : clampByte(target?.xChar || 0), target?.type === 'bossRelative' ? signedByte(target.dyChar || 0) : clampByte(target?.yChar || 0), aux0, clampByte(target?.framesAhead || 0), 0);
    });
    return `${label}:\n${db([clampByte(expandedActions.length), clampByte(totalFrames & 0xff), clampByte((totalFrames >> 8) & 0xff)], 'count,totalLo,totalHi')}\n${chunkedDb(actionBytes, 8)}`;
}
function buildTileMatrixBytes(phase, tileIndexById, analysis, bossStartYChar = 0) {
    const width = phase.dimensions?.width || 0;
    const height = phase.dimensions?.height || 0;
    const bytes = [];
    for (let y = 0; y < height; y++) {
        const row = phase.tileMatrix?.[y] || [];
        for (let x = 0; x < width; x++) {
            const tileId = row[x];
            if (!tileId) {
                bytes.push(255);
                continue;
            }
            const runtimeCharCode = (0, screen2TileBanks_1.resolveRuntimeScreen2TileBankCharCode)(analysis, phase.tileBankId, tileId, bossStartYChar + y, 0, 0);
            bytes.push(runtimeCharCode > 0 ? clampByte(runtimeCharCode) : getTileIndex(tileId, tileIndexById));
        }
    }
    return bytes;
}
function renderTileMatrix(label, phase, tileIndexById, analysis, bossStartYChar = 0) {
    const bytes = buildTileMatrixBytes(phase, tileIndexById, analysis, bossStartYChar);
    return `${label}:\n${chunkedDb(bytes)}`;
}
function getBossPhaseCellCount(phase) {
    const width = phase.dimensions?.width || 0;
    const height = phase.dimensions?.height || 0;
    return Math.max(0, width * height);
}
function collectMaxBossWeakMatrixCellCount(bosses) {
    let maxCells = 0;
    bosses.forEach(boss => {
        (boss.phases || []).forEach(phase => {
            maxCells = Math.max(maxCells, getBossPhaseCellCount(phase));
            (phase.forms || []).forEach(form => {
                maxCells = Math.max(maxCells, getBossPhaseCellCount({
                    ...phase,
                    dimensions: form.dimensions,
                    weakPoints: form.weakPoints
                }));
            });
        });
    });
    return maxCells;
}
// Boss forms commonly repeat tile/weak matrices; sharing labels keeps tight
// 8KB MegaROM code banks below the Glass padding boundary.
function createBossMatrixDeduper(zeroWeakCellCount) {
    const tileLabelsByKey = new Map();
    const weakLabelsByKey = new Map();
    const zeroWeakLabel = 'boss_empty_weak_matrix';
    return {
        zeroWeakLabel,
        zeroWeakCellCount,
        renderTile(label, phase, tileIndexById, analysis, bossStartYChar = 0) {
            const width = phase.dimensions?.width || 0;
            const height = phase.dimensions?.height || 0;
            const bytes = buildTileMatrixBytes(phase, tileIndexById, analysis, bossStartYChar);
            const key = bossMatrixKey(width, height, bytes);
            const existingLabel = tileLabelsByKey.get(key);
            if (existingLabel) {
                return { label: existingLabel };
            }
            tileLabelsByKey.set(key, label);
            return { label, block: `${label}:\n${chunkedDb(bytes)}` };
        },
        renderWeak(label, phase) {
            const width = phase.dimensions?.width || 0;
            const height = phase.dimensions?.height || 0;
            const bytes = buildWeakMatrixBytes(phase);
            if (bytes.length > 0 && bytes.every(value => value === 0)) {
                return { label: zeroWeakLabel };
            }
            const key = bossMatrixKey(width, height, bytes);
            const existingLabel = weakLabelsByKey.get(key);
            if (existingLabel) {
                return { label: existingLabel };
            }
            weakLabelsByKey.set(key, label);
            return { label, block: `${label}:\n${chunkedDb(bytes)}` };
        }
    };
}
function renderFormTable(label, phase, tileIndexById, analysis, bossStartYChar = 0, currentTileMatrixLabel, currentWeakMatrixLabel, matrixDeduper, pointerConfig) {
    const forms = phase.forms || [];
    const formLabels = [
        currentTileMatrixLabel || `${label}_current`
    ];
    const weakLabels = [
        currentWeakMatrixLabel || `${label}_current_weak`
    ];
    const blocks = [];
    const matrixBlocks = [];
    if (!currentTileMatrixLabel) {
        const tileResult = matrixDeduper
            ? matrixDeduper.renderTile(formLabels[0], phase, tileIndexById, analysis, bossStartYChar)
            : { label: formLabels[0], block: renderTileMatrix(formLabels[0], phase, tileIndexById, analysis, bossStartYChar) };
        formLabels[0] = tileResult.label;
        if (tileResult.block) {
            matrixBlocks.push(tileResult.block);
        }
    }
    if (!currentWeakMatrixLabel) {
        const weakResult = matrixDeduper
            ? matrixDeduper.renderWeak(weakLabels[0], phase)
            : { label: weakLabels[0], block: renderWeakMatrix(weakLabels[0], phase) };
        weakLabels[0] = weakResult.label;
        if (weakResult.block) {
            matrixBlocks.push(weakResult.block);
        }
    }
    forms.forEach((form, index) => {
        const formTileLabel = `${label}_${index + 1}`;
        const formWeakLabel = `${label}_${index + 1}_weak`;
        const formPhase = {
            ...phase,
            buildType: 'tile',
            dimensions: form.dimensions,
            tileMatrix: form.tileMatrix,
            collisionMatrix: form.collisionMatrix,
            weakPoints: form.weakPoints,
        };
        const tileResult = matrixDeduper
            ? matrixDeduper.renderTile(formTileLabel, formPhase, tileIndexById, analysis, bossStartYChar)
            : { label: formTileLabel, block: renderTileMatrix(formTileLabel, formPhase, tileIndexById, analysis, bossStartYChar) };
        const weakResult = matrixDeduper
            ? matrixDeduper.renderWeak(formWeakLabel, formPhase)
            : { label: formWeakLabel, block: renderWeakMatrix(formWeakLabel, formPhase) };
        formLabels.push(tileResult.label);
        weakLabels.push(weakResult.label);
        if (tileResult.block) {
            matrixBlocks.push(tileResult.block);
        }
        if (weakResult.block) {
            matrixBlocks.push(weakResult.block);
        }
    });
    blocks.push(`${label}:\n${db([clampByte(formLabels.length)], 'count')}\n${formLabels.map((formLabel, index) => dw([bossDataPtr(formLabel, pointerConfig), bossDataPtr(weakLabels[index], pointerConfig)])).join('\n')}`);
    blocks.push(...matrixBlocks);
    return blocks;
}
function renderCollisionMatrix(label, phase) {
    const width = phase.dimensions?.width || 0;
    const height = phase.dimensions?.height || 0;
    const bytes = [];
    for (let y = 0; y < height; y++) {
        const row = phase.collisionMatrix?.[y] || [];
        for (let x = 0; x < width; x++) {
            bytes.push(row[x] ? 1 : 0);
        }
    }
    return `${label}:\n${chunkedDb(bytes)}`;
}
function renderWeakMatrix(label, phase) {
    const bytes = buildWeakMatrixBytes(phase);
    return `${label}:\n${chunkedDb(bytes)}`;
}
function buildWeakMatrixBytes(phase) {
    const width = phase.dimensions?.width || 0;
    const height = phase.dimensions?.height || 0;
    const weakPointHealthByCell = new Map();
    (phase.weakPoints || []).forEach(weakPoint => {
        const x = clampByte(weakPoint.x);
        const y = clampByte(weakPoint.y);
        if (x < width && y < height) {
            weakPointHealthByCell.set(`${x},${y}`, Math.max(1, clampByte(weakPoint.health || 1)));
        }
    });
    const bytes = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            bytes.push(weakPointHealthByCell.get(`${x},${y}`) || 0);
        }
    }
    return bytes;
}
function renderNeckChain(label, neckChain) {
    const chain = neckChain || {
        enabled: false,
        segments: [],
        amplitudeX: 0,
        amplitudeY: 0,
        speed: 0,
        segmentDelayFrames: 0,
        followStrength: 0
    };
    const header = db([
        chain.enabled ? 1 : 0,
        clampByte(chain.segments.length),
        signedByte(chain.amplitudeX),
        signedByte(chain.amplitudeY),
        clampByte(Math.round((chain.speed || 0) * 16)),
        clampByte(chain.segmentDelayFrames),
        clampByte(Math.round((chain.followStrength || 0) * 100))
    ], 'enabled,count,ampX,ampY,speed16,delay,followPct');
    const segmentBytes = chain.segments.flatMap(segment => [clampByte(segment.x), clampByte(segment.y)]);
    return `${label}:\n${header}\n${chunkedDb(segmentBytes, 12)}`;
}
function renderCrushMovement(label, movement) {
    const crush = movement || {
        enabled: false,
        direction: 'down',
        distance: 0,
        windupFrames: 0,
        slamFrames: 1,
        holdFrames: 0,
        returnFrames: 1,
        cooldownFrames: 0
    };
    return `${label}:\n${db([
        crush.enabled ? 1 : 0,
        directionId(crush.direction),
        clampByte(crush.distance),
        clampByte(crush.windupFrames),
        clampByte(Math.max(1, crush.slamFrames)),
        clampByte(crush.holdFrames),
        clampByte(Math.max(1, crush.returnFrames)),
        clampByte(crush.cooldownFrames)
    ], 'enabled,dir,distance,windup,slam,hold,return,cooldown')}`;
}
function renderAttackSequence(label, phase, attackIndexById) {
    const sequence = (phase.attackSequence || [])
        .map(id => attackIndexById.get(id))
        .filter((index) => index !== undefined)
        .map(index => clampByte(index));
    return `${label}:\n${db([sequence.length], 'count')}\n${chunkedDb(sequence, 16)}`;
}
function renderAttackRecord(attack, spriteIndexById, tileIndexById, analysis, attackTileBankId) {
    const landingYChar = Math.max(0, Math.min(23, Math.floor(Number(attack.landingYChar ?? 20))));
    const projectileMeta = attack.type === 'Projectile'
        ? getProjectileSpriteMeta(attack, analysis)
        : undefined;
    return [
        db([
            getAttackTypeId(attack.type),
            getSpriteIndex(attack.spriteAssetId, spriteIndexById),
            clampByte(attack.damage),
            clampByte(attack.speed || 0),
            directionId(attack.projectileDirection),
            signedByte(attack.spawnOffsetX || 0),
            signedByte(attack.spawnOffsetY || 0)
        ], 'type,sprite,damage,speed,dir,offX,offY'),
        dw([
            word(attack.range || 0),
            word(attack.cooldown || 0),
            word(attack.duration || 0)
        ], 'range,cooldown,duration'),
        db([
            projectileMeta ? projectileMeta.layerCount : clampByte(attack.meteorCount || 0),
            projectileMeta ? projectileMeta.frameCount : clampByte(attack.meteorSpreadX || 0),
            projectileMeta ? projectileMeta.color0 : clampByte(attack.meteorWarningFrames || 0),
            clampByte(Math.round((attack.cooldown || 1000) / 50), 1)
        ], projectileMeta ? 'projectileLayers,projectileFrames,projectileColor0,cooldownFrames' : 'meteorCount,meteorSpread,meteorWarn,cooldownFrames'),
        db([
            projectileMeta ? projectileMeta.color1 : clampByte(attack.bombCount || 0),
            clampByte(attack.bombSpreadX || 0),
            clampByte(attack.bombFuseFrames || 0),
            clampByte(attack.explosionRadius || 0),
            clampByte(attack.explosionDurationFrames || 0),
            getSpriteIndex(attack.explosionSpriteAssetId, spriteIndexById)
        ], projectileMeta ? 'projectileColor1,bombSpread,bombFuse,explRadius,explDuration,explSprite' : 'bombCount,bombSpread,bombFuse,explRadius,explDuration,explSprite'),
        db([
            clampByte(attack.arcHeight || 0)
        ], 'arcHeight'),
        db([
            getAttackTileCharCode(attack.laserTileAssetId, tileIndexById, analysis, attackTileBankId, landingYChar),
            clampByte(attack.laserLengthChars || 0),
            clampByte(attack.laserDurationFrames || 0)
        ], 'laserTile,laserLength,laserDuration'),
        db([
            clampByte(attack.waveAmplitude || 0),
            clampByte(attack.waveFrequencyFrames || 0)
        ], 'waveAmplitude,waveFrequencyFrames'),
        db([
            clampByte(attack.homingTurnStep || 0)
        ], 'homingTurnStep'),
        db([
            clampByte(attack.slamRiseChars || 0),
            clampByte(attack.slamWindupFrames || 0),
            clampByte(attack.slamFrames || 0),
            clampByte(attack.slamHoldFrames || 0)
        ], 'slamRiseChars,slamWindup,slamFrames,slamHold'),
        db([
            getAttackTileCharCode(attack.blockTileAssetId, tileIndexById, analysis, attackTileBankId, landingYChar),
            clampByte(landingYChar),
            getAttackTileBehaviorByte(attack.blockTileAssetId, analysis)
        ], 'blockTile,landingYChar,blockBehavior')
    ].join('\n');
}
function renderBossRuntimeAsm(features = {
    hasBosses: true,
    hasForms: true,
    hasWeakPoints: true,
    hasNeckChains: true,
    hasCrushMovement: true,
    usedAttackTypes: new Set(BOSS_ATTACK_RUNTIME_TYPES),
    usedBehaviorTypes: new Set(['wait', 'moveTo', 'attack', 'slam', 'protect', 'shield', 'setForm', 'animateForm', 'loop'])
}) {
    const asm = `; ------------------------------------------------------------------
; Boss attack record layout
; ------------------------------------------------------------------
BOSS_ATTACK_TYPE_OFF EQU 0
BOSS_ATTACK_SPRITE_OFF EQU 1
BOSS_ATTACK_DAMAGE_OFF EQU 2
BOSS_ATTACK_SPEED_OFF EQU 3
BOSS_ATTACK_DIR_OFF EQU 4
BOSS_ATTACK_OFFX_OFF EQU 5
BOSS_ATTACK_OFFY_OFF EQU 6
BOSS_ATTACK_RANGE_LO_OFF EQU 7
BOSS_ATTACK_COOLDOWN_LO_OFF EQU 9
BOSS_ATTACK_DURATION_LO_OFF EQU 11
BOSS_ATTACK_METEOR_COUNT_OFF EQU 13
BOSS_ATTACK_METEOR_SPREAD_OFF EQU 14
BOSS_ATTACK_METEOR_WARN_OFF EQU 15
BOSS_ATTACK_COOLDOWN_FRAMES_OFF EQU 16
BOSS_ATTACK_METEOR_COOLDOWN_FRAMES_OFF EQU 16
BOSS_ATTACK_BOMB_COUNT_OFF EQU 17
BOSS_ATTACK_BOMB_SPREAD_OFF EQU 18
BOSS_ATTACK_BOMB_FUSE_OFF EQU 19
BOSS_ATTACK_EXPLOSION_RADIUS_OFF EQU 20
BOSS_ATTACK_EXPLOSION_DURATION_OFF EQU 21
BOSS_ATTACK_EXPLOSION_SPRITE_OFF EQU 22
BOSS_ATTACK_ARC_HEIGHT_OFF EQU 23
BOSS_ATTACK_LASER_TILE_OFF EQU 24
BOSS_ATTACK_LASER_LENGTH_OFF EQU 25
BOSS_ATTACK_LASER_DURATION_OFF EQU 26
BOSS_ATTACK_WAVE_AMPLITUDE_OFF EQU 27
BOSS_ATTACK_WAVE_FREQUENCY_OFF EQU 28
BOSS_ATTACK_HOMING_TURN_STEP_OFF EQU 29
BOSS_ATTACK_SLAM_RISE_CHARS_OFF EQU 30
BOSS_ATTACK_SLAM_WINDUP_FRAMES_OFF EQU 31
BOSS_ATTACK_SLAM_FRAMES_OFF EQU 32
BOSS_ATTACK_SLAM_HOLD_FRAMES_OFF EQU 33
BOSS_ATTACK_BLOCK_TILE_OFF EQU 34
BOSS_ATTACK_BLOCK_LANDING_Y_OFF EQU 35
BOSS_ATTACK_BLOCK_BEHAVIOR_OFF EQU 36
BOSS_ATTACK_RECORD_SIZE EQU 37

; ------------------------------------------------------------------
; Boss phase and screen placement runtime layout
; ------------------------------------------------------------------
BOSS_PHASE_BUILD_TYPE_OFF EQU 1
BOSS_PHASE_WIDTH_OFF EQU 2
BOSS_PHASE_HEIGHT_OFF EQU 3
BOSS_PHASE_TILE_MATRIX_PTR_OFF EQU 4
BOSS_PHASE_BEHAVIOR_PTR_OFF EQU 14
BOSS_PHASE_FORM_TABLE_PTR_OFF EQU 16
BOSS_PHASE_WEAK_MATRIX_PTR_OFF EQU 18
BOSS_BUILD_TYPE_TILE EQU 0
BOSS_RUNTIME_PLACEMENT_PHASE_TABLE_OFF EQU 0
BOSS_RUNTIME_PLACEMENT_ATTACK_TABLE_OFF EQU 2
BOSS_RUNTIME_PLACEMENT_X_OFF EQU 4
BOSS_RUNTIME_PLACEMENT_Y_OFF EQU 5
BOSS_RUNTIME_PLACEMENT_INITIAL_PHASE_OFF EQU 6
BOSS_RUNTIME_PLACEMENT_FLAGS_OFF EQU 7
BOSS_RUNTIME_PLACEMENT_UPDATE_INTERVAL_OFF EQU 8
BOSS_RUNTIME_PLACEMENT_HEALTH_LO_OFF EQU 9
BOSS_RUNTIME_PLACEMENT_HEALTH_HI_OFF EQU 10
BOSS_RUNTIME_PLACEMENT_DATA_BANK_OFF EQU 11
BOSS_RUNTIME_PLACEMENT_DATA_BANK_HI_OFF EQU 12
BOSS_RUNTIME_PLACEMENT_FLAG_ENABLED EQU #01
BOSS_BEHAVIOR_WAIT EQU 0
BOSS_BEHAVIOR_MOVE_TO EQU 1
BOSS_BEHAVIOR_ATTACK EQU 2
BOSS_BEHAVIOR_SLAM EQU 3
BOSS_BEHAVIOR_PROTECT EQU 4
BOSS_BEHAVIOR_SHIELD EQU 5
BOSS_BEHAVIOR_SET_FORM EQU 6
BOSS_BEHAVIOR_ANIMATE_FORM EQU 7
BOSS_BEHAVIOR_LOOP EQU 8
BOSS_BEHAVIOR_TARGET_FIXED EQU 0
BOSS_BEHAVIOR_TARGET_PLAYER_CURRENT EQU 1
BOSS_BEHAVIOR_TARGET_PLAYER_PREDICTED EQU 2
BOSS_BEHAVIOR_TARGET_PLAYER_LAST_KNOWN EQU 3
BOSS_BEHAVIOR_TARGET_BOSS_RELATIVE EQU 4
BOSS_BEHAVIOR_ACTION_SIZE EQU 8

; Register Contract:
; input: current_screen_boss_count/current_screen_boss_table identify the current screen placement table
; output: first enabled boss placement is copied to boss runtime RAM and drawn to the SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX
init_screen_boss_from_current_screen:
    push ix
    xor a
    ld (boss_active), a
    ld (boss_health_lo), a
    ld (boss_health_hi), a
    ld (boss_hit_cooldown), a
    ld (boss_projectile_active), a
    ld (boss_slam_rocks_active), a
    ld (boss_falling_blocks_active), a
    ld a, #FF
    ld (boss_data_bank), a
    ld a, (current_screen_boss_count)
    or a
    jp z, .isb_done

    ld hl, (current_screen_boss_table)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_phase_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_attack_table_ptr), de
    ld a, (hl)
    inc hl
    ld (boss_x_char), a
    ld (boss_prev_x_char), a
    ld a, (hl)
    inc hl
    ld (boss_y_char), a
    ld (boss_prev_y_char), a
    ld a, (hl)
    inc hl
    ld (boss_initial_phase_index), a
    ld a, (hl)
    inc hl
    and BOSS_RUNTIME_PLACEMENT_FLAG_ENABLED
    jp z, .isb_done
    ld a, (hl)
    or a
    jp nz, .isb_update_interval_ok
    ld a, 1
.isb_update_interval_ok:
    ld (boss_update_interval), a
    inc hl
    xor a
    ld (boss_update_timer), a
    ld (boss_hit_cooldown), a
    ld a, (hl)
    inc hl
    ld (boss_health_lo), a
    ld a, (hl)
    inc hl
    ld (boss_health_hi), a
    ld a, (hl)
    inc hl
    ld (boss_data_bank), a
    inc hl

    call boss_push_data_bank
    call boss_resolve_initial_phase
    call boss_init_behavior_state
    ld a, 1
    ld (boss_active), a
    call draw_active_boss_tiles
    call boss_pop_data_bank

.isb_done:
    pop ix
    ret

; Register Contract:
; input: boss_data_bank = #FF for resident/simple data or mapper bank for P3 data
; output: P3 data window exposes active boss data when banked
; clobbers: AF
boss_push_data_bank:
    ld a, (boss_data_bank)
    cp #FF
    ret z
    call mapper_push_p3
    ld a, (boss_data_bank)
    jp mapper_set_bank_p3

; Register Contract:
; input: boss_data_bank = #FF for resident/simple data or mapper bank for P3 data
; output: P3 data window restored when active boss data was banked
; clobbers: AF
boss_pop_data_bank:
    ld a, (boss_data_bank)
    cp #FF
    ret z
    jp mapper_pop_p3

; Register Contract:
; input: boss_phase_table_ptr and boss_initial_phase_index
; output: boss_phase_ptr, boss_tile_matrix_ptr, boss_weak_matrix_ptr, boss_width and boss_height populated from the selected phase record
; clobbers: AF, DE, HL, IX
boss_resolve_initial_phase:
    ld hl, (boss_phase_table_ptr)
    ld a, (boss_initial_phase_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (boss_phase_ptr), de
    push de
    pop ix
    ld a, (ix+2)
    ld (boss_width), a
    ld a, (ix+3)
    ld (boss_height), a
    ld e, (ix+4)
    ld d, (ix+5)
    ld (boss_tile_matrix_ptr), de
    ld e, (ix+14)
    ld d, (ix+15)
    ld (boss_behavior_table_ptr), de
    ld e, (ix+16)
    ld d, (ix+17)
    ld (boss_form_table_ptr), de
    ld e, (ix+18)
    ld d, (ix+19)
    ld (boss_weak_matrix_ptr), de
    ret

; Register Contract:
; input: boss_behavior_table_ptr resolved from the active phase
; output: behavior interpreter counters reset for this phase
; clobbers: AF, HL
boss_init_behavior_state:
    ld hl, (boss_behavior_table_ptr)
    ld a, h
    cp #FF
    jp nz, .bibs_has_table
    ld a, l
    cp #FF
    jp nz, .bibs_has_table
    xor a
    ld (boss_behavior_count), a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    ret
.bibs_has_table:
    ld a, (hl)
    ld (boss_behavior_count), a
    xor a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    ret

; Register Contract:
; input: active boss runtime RAM populated by init_screen_boss_from_current_screen
; output: non-empty boss tile chars are written into the SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_active_boss_tiles:
    push ix
    ld a, (boss_active)
    or a
    jp z, .dabt_done
    ld a, (boss_width)
    or a
    jp z, .dabt_done
    ld a, (boss_height)
    or a
    jp z, .dabt_done

    xor a
    ld (boss_draw_row), a
.dabt_row_loop:
    ld a, (boss_draw_row)
    ld c, a
    ld a, (boss_height)
    cp c
    jp z, .dabt_done

    xor a
    ld (boss_draw_col), a
.dabt_col_loop:
    ld a, (boss_draw_col)
    ld c, a
    ld a, (boss_width)
    cp c
    jp z, .dabt_next_row

    call boss_get_active_tile_char
    cp #FF
    jp z, .dabt_skip_cell
    ld (boss_draw_char), a

    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_draw_col)
    add a, b
    cp 32
    jp nc, .dabt_skip_cell
    ld (boss_draw_screen_x), a

    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_draw_row)
    add a, b
    cp 24
    jp nc, .dabt_skip_cell
    ld (boss_draw_screen_y), a
    call boss_draw_write_cell

.dabt_skip_cell:
    ld a, (boss_draw_col)
    inc a
    ld (boss_draw_col), a
    jp .dabt_col_loop

.dabt_next_row:
    ld a, (boss_draw_row)
    inc a
    ld (boss_draw_row), a
    jp .dabt_row_loop

.dabt_done:
    pop ix
    ret

; Register Contract:
; input: boss_prev_x_char/boss_prev_y_char and active boss dimensions
; output: previous boss footprint restored from runtime_screen_layout into SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX
restore_active_boss_tiles:
    push ix
    ld a, (boss_active)
    or a
    jp z, .rabt_done
    ld a, (boss_width)
    or a
    jp z, .rabt_done
    ld a, (boss_height)
    or a
    jp z, .rabt_done

    xor a
    ld (boss_draw_row), a
.rabt_row_loop:
    ld a, (boss_draw_row)
    ld c, a
    ld a, (boss_height)
    cp c
    jp z, .rabt_done

    xor a
    ld (boss_draw_col), a
.rabt_col_loop:
    ld a, (boss_draw_col)
    ld c, a
    ld a, (boss_width)
    cp c
    jp z, .rabt_next_row

    ld a, (boss_prev_x_char)
    ld b, a
    ld a, (boss_draw_col)
    add a, b
    cp 32
    jp nc, .rabt_skip_cell
    ld (boss_draw_screen_x), a

    ld a, (boss_prev_y_char)
    ld b, a
    ld a, (boss_draw_row)
    add a, b
    cp 24
    jp nc, .rabt_skip_cell
    ld (boss_draw_screen_y), a
    call boss_get_runtime_layout_char
    ld (boss_draw_char), a
    call boss_draw_write_cell

.rabt_skip_cell:
    ld a, (boss_draw_col)
    inc a
    ld (boss_draw_col), a
    jp .rabt_col_loop

.rabt_next_row:
    ld a, (boss_draw_row)
    inc a
    ld (boss_draw_row), a
    jp .rabt_row_loop

.rabt_done:
    pop ix
    ret

; Register Contract:
; input: boss_prev_x_char/boss_prev_y_char, current boss_x_char/boss_y_char and active boss dimensions
; output: only previous boss cells not covered by the current opaque boss shape are restored from runtime_screen_layout
; clobbers: AF, BC, DE, HL
; preserves: IX
restore_active_boss_tiles_exposed:
    push ix
    ld a, (boss_active)
    or a
    jp z, .rabte_done
    ld a, (boss_width)
    or a
    jp z, .rabte_done
    ld a, (boss_height)
    or a
    jp z, .rabte_done

    xor a
    ld (boss_restore_row), a
.rabte_row_loop:
    ld a, (boss_restore_row)
    ld c, a
    ld a, (boss_height)
    cp c
    jp z, .rabte_done

    xor a
    ld (boss_restore_col), a
.rabte_col_loop:
    ld a, (boss_restore_col)
    ld c, a
    ld a, (boss_width)
    cp c
    jp z, .rabte_next_row

    ld a, (boss_prev_x_char)
    ld b, a
    ld a, (boss_restore_col)
    add a, b
    cp 32
    jp nc, .rabte_skip_cell
    ld (boss_draw_screen_x), a

    ld a, (boss_prev_y_char)
    ld b, a
    ld a, (boss_restore_row)
    add a, b
    cp 24
    jp nc, .rabte_skip_cell
    ld (boss_draw_screen_y), a

    call boss_current_shape_covers_draw_cell
    jp nz, .rabte_skip_cell
    call boss_get_runtime_layout_char
    ld (boss_draw_char), a
    call boss_draw_write_cell

.rabte_skip_cell:
    ld a, (boss_restore_col)
    inc a
    ld (boss_restore_col), a
    jp .rabte_col_loop

.rabte_next_row:
    ld a, (boss_restore_row)
    inc a
    ld (boss_restore_row), a
    jp .rabte_row_loop

.rabte_done:
    pop ix
    ret

; Register Contract:
; input: boss_draw_screen_x/boss_draw_screen_y and current boss position/shape
; output: NZ if the current boss has a non-empty tile covering that screen cell, Z otherwise
; clobbers: AF, BC, DE, HL
boss_current_shape_covers_draw_cell:
    ld a, (boss_draw_screen_x)
    ld b, a
    ld a, (boss_x_char)
    cp b
    jp z, .bcscdc_x_in_range
    jp nc, .bcscdc_not_covered
.bcscdc_x_in_range:
    ld a, b
    ld b, a
    ld a, (boss_x_char)
    ld c, a
    ld a, b
    sub c
    ld b, a
    ld a, (boss_width)
    cp b
    jp z, .bcscdc_not_covered
    jp c, .bcscdc_not_covered
    ld a, b
    ld (boss_draw_col), a

    ld a, (boss_draw_screen_y)
    ld b, a
    ld a, (boss_y_char)
    cp b
    jp z, .bcscdc_y_in_range
    jp nc, .bcscdc_not_covered
.bcscdc_y_in_range:
    ld a, b
    ld b, a
    ld a, (boss_y_char)
    ld c, a
    ld a, b
    sub c
    ld b, a
    ld a, (boss_height)
    cp b
    jp z, .bcscdc_not_covered
    jp c, .bcscdc_not_covered
    ld a, b
    ld (boss_draw_row), a

    call boss_get_active_tile_char
    cp #FF
    jp z, .bcscdc_not_covered
    ret
.bcscdc_not_covered:
    xor a
    ret

; Register Contract:
; input: boss_draw_screen_x and boss_draw_screen_y
; output: A = char from runtime_screen_layout at that coordinate
; clobbers: AF, DE, HL
boss_get_runtime_layout_char:
    ld a, (boss_draw_screen_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (boss_draw_screen_x)
    ld e, a
    ld d, 0
    add hl, de
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    ret

; Register Contract:
; input: boss_draw_row, boss_draw_col, boss_tile_matrix_ptr and boss_width
; output: A = tile char for the current boss cell
; clobbers: AF, B, DE, HL
boss_get_active_tile_char:
    ld a, (boss_draw_row)
    ld b, a
    ld hl, 0
.bgat_row_offset_loop:
    ld a, b
    or a
    jp z, .bgat_row_offset_done
    ld a, (boss_width)
    ld e, a
    ld d, 0
    add hl, de
    dec b
    jp .bgat_row_offset_loop
.bgat_row_offset_done:
    ld a, (boss_draw_col)
    ld e, a
    ld d, 0
    add hl, de
    ld de, (boss_tile_matrix_ptr)
    add hl, de
    ld a, (hl)
    ret

; Register Contract:
; input: boss_draw_screen_x, boss_draw_screen_y and boss_draw_char
; output: one SCREEN 2 name table cell is written
; clobbers: AF, DE, HL
boss_draw_write_cell:
    ld a, (boss_draw_screen_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (boss_draw_screen_x)
    ld e, a
    ld d, 0
    add hl, de
    ld de, NAMETBL
    add hl, de
    ld a, (boss_draw_char)
    call FAST_WRTVRM
    ret

; Register Contract:
; input: active boss behavior RAM
; output: boss_x_char/boss_y_char updated according to current behavior action
; clobbers: AF, BC, DE, HL
; preserves: IX
update_boss_behavior:
    push ix
    ld a, (boss_behavior_count)
    or a
    jp z, .ubb_done
    ld a, (boss_behavior_timer)
    or a
    call z, boss_load_current_behavior_action

    ld a, (boss_behavior_action_type)
    cp BOSS_BEHAVIOR_MOVE_TO
    jp z, .ubb_move
    cp BOSS_BEHAVIOR_SLAM
    jp z, .ubb_move
    cp BOSS_BEHAVIOR_ATTACK
    jp z, .ubb_attack
    cp BOSS_BEHAVIOR_SET_FORM
    jp z, .ubb_tick
    cp BOSS_BEHAVIOR_LOOP
    jp z, .ubb_loop
    jp .ubb_tick

.ubb_move:
    call boss_tick_behavior_move_step
    jp z, .ubb_tick
    call boss_step_towards_behavior_target
    jp .ubb_tick

.ubb_attack:
    call boss_draw_behavior_attack
    jp .ubb_tick

.ubb_loop:
    ld a, (boss_behavior_aux0)
    ld b, a
    ld a, (boss_behavior_count)
    cp b
    jp z, .ubb_loop_reset
    jp c, .ubb_loop_reset
    ld a, b
    ld (boss_behavior_index), a
    xor a
    ld (boss_behavior_timer), a
    jp .ubb_done
.ubb_loop_reset:
    xor a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    jp .ubb_done

.ubb_tick:
    ld a, (boss_behavior_timer)
    or a
    jp z, .ubb_advance
    dec a
    ld (boss_behavior_timer), a
    jp nz, .ubb_done

.ubb_advance:
    ld a, (boss_behavior_index)
    inc a
    ld b, a
    ld a, (boss_behavior_count)
    cp b
    jp nz, .ubb_store_index
    xor a
    jp .ubb_store_index_a
.ubb_store_index:
    ld a, b
.ubb_store_index_a:
    ld (boss_behavior_index), a

.ubb_done:
    pop ix
    ret

; Register Contract:
; input: boss_behavior_table_ptr and boss_behavior_index
; output: current action fields copied to boss_behavior_* RAM
; clobbers: AF, BC, DE, HL
boss_load_current_behavior_action:
    ld hl, (boss_behavior_table_ptr)
    inc hl
    inc hl
    inc hl
    ld a, (boss_behavior_index)
    ld b, a
.blcba_offset_loop:
    ld a, b
    or a
    jp z, .blcba_offset_done
    ld de, BOSS_BEHAVIOR_ACTION_SIZE
    add hl, de
    dec b
    jp .blcba_offset_loop
.blcba_offset_done:
    ld (boss_behavior_action_ptr), hl
    ld a, (hl)
    ld (boss_behavior_action_type), a
    inc hl
    ld a, (hl)
    or a
    jp nz, .blcba_duration_ok
    ld a, 1
.blcba_duration_ok:
    ld (boss_behavior_duration), a
    ld (boss_behavior_timer), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_type), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_x), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_y), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux0), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux1), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux2), a
    ld a, (boss_behavior_action_type)
    cp BOSS_BEHAVIOR_MOVE_TO
    jp z, boss_prepare_behavior_move_timing
    cp BOSS_BEHAVIOR_SLAM
    jp z, boss_prepare_behavior_move_timing
    cp BOSS_BEHAVIOR_SET_FORM
    jp z, boss_apply_behavior_form
    ld a, 1
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: boss_behavior_aux0 = visual form index, boss_form_table_ptr points to db count + dw tileMatrix, weakMatrix pairs
; output: boss_tile_matrix_ptr/boss_weak_matrix_ptr switched and boss_visual_dirty set when form index is valid
; clobbers: AF, BC, DE, HL
boss_apply_behavior_form:
    ld hl, (boss_form_table_ptr)
    ld a, h
    cp #FF
    ret z
    ld a, (hl)
    ld b, a
    ld a, (boss_behavior_aux0)
    cp b
    ret nc
    inc hl
    ld b, a
.babf_offset_loop:
    ld a, b
    or a
    jp z, .babf_offset_done
    inc hl
    inc hl
    inc hl
    inc hl
    dec b
    jp .babf_offset_loop
.babf_offset_done:
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_tile_matrix_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (boss_weak_matrix_ptr), de
    ld a, 1
    ld (boss_visual_dirty), a
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: freshly loaded move/slam behavior action fields
; output: target resolved once, movement step interval/timer prepared from duration and distance
; clobbers: AF, B, C, D
boss_prepare_behavior_move_timing:
    call boss_resolve_behavior_target
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    cp b
    jp nc, .bpbmt_x_positive
    ld a, b
    ld c, a
    ld a, (boss_behavior_target_x)
    ld b, a
    ld a, c
    sub b
    jp .bpbmt_x_ready
.bpbmt_x_positive:
    sub b
.bpbmt_x_ready:
    ld d, a
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    cp b
    jp nc, .bpbmt_y_positive
    ld a, b
    ld c, a
    ld a, (boss_behavior_target_y)
    ld b, a
    ld a, c
    sub b
    jp .bpbmt_y_ready
.bpbmt_y_positive:
    sub b
.bpbmt_y_ready:
    cp d
    jp c, .bpbmt_distance_ready
    ld d, a
.bpbmt_distance_ready:
    ld a, d
    or a
    jp nz, .bpbmt_has_distance
    ld a, 1
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret
.bpbmt_has_distance:
    ld b, a
    ld a, (boss_behavior_duration)
    ld c, 0
.bpbmt_div_loop:
    cp b
    jp c, .bpbmt_div_done
    sub b
    inc c
    jp .bpbmt_div_loop
.bpbmt_div_done:
    ld a, c
    or a
    jp nz, .bpbmt_store_interval
    ld a, 1
.bpbmt_store_interval:
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: boss_behavior_step_timer/interval
; output: Z flag set when movement should not step; NZ when one tile step should be applied
; clobbers: AF
boss_tick_behavior_move_step:
    ld a, (boss_behavior_step_timer)
    or a
    jp z, .btbms_step
    dec a
    ld (boss_behavior_step_timer), a
    jp nz, .btbms_no_step
.btbms_step:
    ld a, (boss_behavior_step_interval)
    or a
    jp nz, .btbms_has_interval
    ld a, 1
.btbms_has_interval:
    ld (boss_behavior_step_timer), a
    ld a, 1
    or a
    ret
.btbms_no_step:
    xor a
    ret

; Register Contract:
; input: current behavior target fields
; output: boss_behavior_target_x/y resolved for fixed/player/relative targets
; clobbers: AF, B
boss_resolve_behavior_target:
    ld a, (boss_behavior_target_type)
    cp BOSS_BEHAVIOR_TARGET_PLAYER_CURRENT
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_PLAYER_PREDICTED
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_PLAYER_LAST_KNOWN
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_BOSS_RELATIVE
    jp z, .brbt_relative
    ret

.brbt_player:
    ld a, (player_x)
    srl a
    srl a
    srl a
    ld (boss_behavior_target_x), a
    ld a, (player_y)
    srl a
    srl a
    srl a
    ld (boss_behavior_target_y), a
    ret

.brbt_relative:
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    add a, b
    ld (boss_behavior_target_x), a
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    add a, b
    ld (boss_behavior_target_y), a
    ret

; Register Contract:
; input: boss_x_char/y_char and resolved boss_behavior_target_x/y
; output: boss_x_char/y_char step one char toward target
; clobbers: AF, B
boss_step_towards_behavior_target:
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    cp b
    jp z, .bstbt_y
    jp c, .bstbt_dec_x
    ld a, b
    inc a
    ld (boss_x_char), a
    jp .bstbt_y
.bstbt_dec_x:
    ld a, b
    or a
    jp z, .bstbt_y
    dec a
    ld (boss_x_char), a

.bstbt_y:
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    cp b
    ret z
    jp c, .bstbt_dec_y
    ld a, b
    inc a
    ld (boss_y_char), a
    ret
.bstbt_dec_y:
    ld a, b
    or a
    ret z
    dec a
    ld (boss_y_char), a
    ret

; Register Contract:
; input: boss_behavior_aux0 = attack index, boss_attack_table_ptr, boss_x/y_char
; output: configured attack renderer invoked at current boss position
; clobbers: AF, BC, DE, HL
boss_draw_behavior_attack:
    ld a, (boss_behavior_aux0)
    cp #FF
    ret z
    ld b, a
    ld hl, (boss_attack_table_ptr)
.bdba_table_loop:
    ld a, b
    or a
    jp z, .bdba_record_ready
    inc hl
    inc hl
    dec b
    jp .bdba_table_loop
.bdba_record_ready:
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld h, d
    ld l, e
    ld a, (boss_x_char)
    add a, a
    add a, a
    add a, a
    ld b, a
    ld a, (boss_width)
    add a, a
    add a, a
    add a, b
    ld b, a
    ld a, (boss_y_char)
    add a, a
    add a, a
    add a, a
    ld c, a
    ld a, (boss_height)
    add a, a
    add a, a
    add a, c
    ld c, a
    ld d, 24
    ld e, 15
    call draw_boss_attack
    ret

; Register Contract:
; input: A = sprite asset index (#FF = placeholder)
; output: A = hardware sprite base pattern number
; clobbers: AF, BC, HL
boss_attack_get_sprite_pattern:
    cp #FF
    jp z, .bagsp_placeholder
    ld c, a
    ld b, 0
    ld hl, sprite_asset_base_pattern_slot_runtime
    add hl, bc
    ld a, (hl)
    add a, a
    add a, a
    ret
.bagsp_placeholder:
    ld a, (sprite_placeholder_base_pattern_num)
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: dispatches to the matching attack renderer
; clobbers: AF plus the selected renderer's documented clobbers
draw_boss_attack:
    ld a, (hl)
    cp BOSS_ATTACK_PROJECTILE
    jp z, draw_boss_projectile_attack
    cp BOSS_ATTACK_METEOR
    jp z, draw_boss_meteor_attack
    cp BOSS_ATTACK_BOMB
    jp z, draw_boss_bomb_attack
    cp BOSS_ATTACK_BOOMERANG
    jp z, draw_boss_boomerang_attack
    cp BOSS_ATTACK_ROCK
    jp z, draw_boss_rock_attack
    cp BOSS_ATTACK_LASER
    jp z, draw_boss_laser_attack
    cp BOSS_ATTACK_SINE_WAVE
    jp z, draw_boss_sine_wave_attack
    cp BOSS_ATTACK_HOMING_MISSILE
    jp z, draw_boss_homing_missile_attack
    cp BOSS_ATTACK_SLAM_ROCKS
    jp z, draw_boss_slam_rocks_attack
    cp BOSS_ATTACK_FALLING_BLOCKS
    jp z, draw_boss_falling_blocks_attack
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: starts one simple projectile if none is currently active
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_projectile_attack:
    push ix
    push hl
    pop ix
    ld a, (boss_projectile_active)
    or a
    jr nz, .dbpa_done

    ld a, b
    add a, (ix+5)
    ld (boss_projectile_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_projectile_y), a
    ld a, d
    ld (boss_projectile_sprite_slot), a
    ld a, (ix+13)
    ld (boss_projectile_layer_count), a
    ld a, (ix+14)
    ld (boss_projectile_frame_count), a
    ld a, (ix+15)
    ld (boss_projectile_color), a
    ld a, (ix+17)
    ld (boss_projectile_color2), a
    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_projectile_pattern), a

    ld a, (ix+3)
    or a
    jr nz, .dbpa_speed_ok
    ld a, 3
.dbpa_speed_ok:
    ld (boss_projectile_speed), a

    ld a, (ix+7)
    or a
    jr nz, .dbpa_range_ok
    ld a, 160
.dbpa_range_ok:
    ld (boss_projectile_range), a

    call sync_player_runtime_from_entity
    call boss_projectile_select_velocity
    xor a
    ld (boss_projectile_distance), a
    ld a, 1
    ld (boss_projectile_active), a
    call boss_projectile_show_current

.dbpa_done:
    pop ix
    ret

; Register Contract:
; input: IX = attack record, boss_projectile_x/y initialized
; output: boss_projectile_vel_x/y populated; player target actions aim with a 2D vector toward player
; clobbers: AF, BC, DE
boss_projectile_select_velocity:
    xor a
    ld (boss_projectile_vel_x), a
    ld (boss_projectile_vel_y), a
    ld a, (boss_behavior_target_type)
    cp BOSS_BEHAVIOR_TARGET_PLAYER_CURRENT
    jr c, .bpsd_fixed
    cp BOSS_BEHAVIOR_TARGET_BOSS_RELATIVE
    jr c, .bpsd_player

.bpsd_fixed:
    ld a, (boss_projectile_speed)
    ld b, a
    ld a, (ix+4)
    cp BOSS_DIR_RIGHT
    jr z, .bpsd_fixed_right
    cp BOSS_DIR_UP
    jr z, .bpsd_store_neg_y
    cp BOSS_DIR_DOWN
    jr z, .bpsd_fixed_down
    jr .bpsd_store_neg_x
.bpsd_fixed_right:
    ld a, b
    ld (boss_projectile_vel_x), a
    ret
.bpsd_fixed_down:
    ld a, b
    ld (boss_projectile_vel_y), a
    ret
.bpsd_store_neg_x:
    xor a
    sub b
    ld (boss_projectile_vel_x), a
    ret
.bpsd_store_neg_y:
    xor a
    sub b
    ld (boss_projectile_vel_y), a
    ret

.bpsd_apply_sign:
    ld c, a
    ld a, b
    or a
    ld a, c
    ret z
    xor a
    sub c
    ret

.bpsd_scale_component:
    ld a, d
    or a
    ret z
    ld a, c
    or a
    ret z
    xor a
    ld e, d
.bpsd_mul_loop:
    add a, c
    jr nc, .bpsd_mul_ok
    ld a, #FF
    jr .bpsd_divide
.bpsd_mul_ok:
    dec e
    jr nz, .bpsd_mul_loop
    ld e, a
    ld a, b
    srl a
    add a, e
    jr nc, .bpsd_divide
    ld a, #FF
.bpsd_divide:
    ld e, 0
.bpsd_div_loop:
    cp b
    jr c, .bpsd_div_done
    sub b
    inc e
    jr .bpsd_div_loop
.bpsd_div_done:
    ld a, e
    ret

.bpsd_player:
    ld a, (player_x)
    add a, 8
    ld b, a
    ld a, (boss_projectile_x)
    ld c, a
    ld a, b
    cp c
    jr z, .bpsd_x_zero
    jr c, .bpsd_x_neg
    sub c
    ld (boss_projectile_abs_x), a
    xor a
    ld (boss_projectile_sign_x), a
    jr .bpsd_read_y
.bpsd_x_neg:
    ld a, c
    sub b
    ld (boss_projectile_abs_x), a
    ld a, 1
    ld (boss_projectile_sign_x), a
    jr .bpsd_read_y
.bpsd_x_zero:
    xor a
    ld (boss_projectile_abs_x), a
    ld (boss_projectile_sign_x), a
.bpsd_read_y:
    ld a, (player_y)
    add a, 8
    ld b, a
    ld a, (boss_projectile_y)
    ld c, a
    ld a, b
    cp c
    jr z, .bpsd_y_zero
    jr c, .bpsd_y_neg
    sub c
    ld (boss_projectile_abs_y), a
    xor a
    ld (boss_projectile_sign_y), a
    jr .bpsd_choose_major
.bpsd_y_neg:
    ld a, c
    sub b
    ld (boss_projectile_abs_y), a
    ld a, 1
    ld (boss_projectile_sign_y), a
    jr .bpsd_choose_major
.bpsd_y_zero:
    xor a
    ld (boss_projectile_abs_y), a
    ld (boss_projectile_sign_y), a
.bpsd_choose_major:
    ld a, (boss_projectile_abs_x)
    ld b, a
    ld a, (boss_projectile_abs_y)
    ld c, a
    ld a, b
    or c
    ret z
    ld a, b
    cp c
    jr c, .bpsd_y_major

.bpsd_x_major:
    ld a, (boss_projectile_speed)
    ld d, a
    ld a, (boss_projectile_sign_x)
    ld b, a
    ld a, d
    call .bpsd_apply_sign
    ld (boss_projectile_vel_x), a
    ld a, (boss_projectile_abs_x)
    ld b, a
    ld a, (boss_projectile_abs_y)
    ld c, a
    call .bpsd_scale_component
    ld c, a
    ld a, (boss_projectile_sign_y)
    ld b, a
    ld a, c
    call .bpsd_apply_sign
    ld (boss_projectile_vel_y), a
    ret

.bpsd_y_major:
    ld a, (boss_projectile_speed)
    ld d, a
    ld a, (boss_projectile_sign_y)
    ld b, a
    ld a, d
    call .bpsd_apply_sign
    ld (boss_projectile_vel_y), a
    ld a, (boss_projectile_abs_y)
    ld b, a
    ld a, (boss_projectile_abs_x)
    ld c, a
    call .bpsd_scale_component
    ld c, a
    ld a, (boss_projectile_sign_x)
    ld b, a
    ld a, c
    call .bpsd_apply_sign
    ld (boss_projectile_vel_x), a
    ret

; Register Contract:
; input: boss_projectile_* RAM state
; output: active simple boss projectile moved one step or hidden when finished
; clobbers: AF, BC, DE, HL
update_boss_projectile_runtime:
    ld a, (boss_projectile_active)
    or a
    ret z
    ld a, (boss_projectile_distance)
    ld b, a
    ld a, (boss_projectile_speed)
    add a, b
    ld (boss_projectile_distance), a
    ld b, a
    ld a, (boss_projectile_range)
    cp b
    jr c, .ubpr_hide
    jr z, .ubpr_hide

    ld a, (boss_projectile_x)
    ld b, a
    ld a, (boss_projectile_vel_x)
    add a, b
    ld (boss_projectile_x), a
    ld a, (boss_projectile_y)
    ld b, a
    ld a, (boss_projectile_vel_y)
    add a, b
    ld (boss_projectile_y), a
.ubpr_bounds:
    ld a, (boss_projectile_x)
    cp 248
    jr nc, .ubpr_hide
    ld a, (boss_projectile_y)
    cp 208
    jr nc, .ubpr_hide
    call boss_projectile_show_current
    ret
.ubpr_hide:
    call boss_projectile_hide_all
    xor a
    ld (boss_projectile_active), a
    ret

; Register Contract:
; input: boss_projectile_sprite_slot/layer_count
; output: all hardware sprite layers used by the projectile are hidden
; clobbers: AF, BC, DE, HL
boss_projectile_hide_all:
    ld a, (boss_projectile_sprite_slot)
    call hide_sprite
    ld a, (boss_projectile_layer_count)
    cp 2
    ret c
    ld a, (boss_projectile_sprite_slot)
    inc a
    call hide_sprite
    ret

; Register Contract:
; input: boss_projectile_* RAM state
; output: projectile sprite attributes written for the first two MSX1 layers
; clobbers: AF, BC, DE, HL
boss_projectile_show_current:
    ld a, (boss_projectile_pattern)
    ld d, a
    ld a, (boss_projectile_frame_count)
    cp 2
    jr c, .bpsc_pattern_ready
    ld a, (boss_runtime_tick)
    and #08
    jr z, .bpsc_pattern_ready
    ld a, (boss_projectile_layer_count)
    add a, a
    add a, a
    add a, d
    ld d, a
.bpsc_pattern_ready:
    ld a, (boss_projectile_x)
    ld b, a
    ld a, (boss_projectile_y)
    ld c, a
    ld a, (boss_projectile_color)
    ld e, a
    ld a, (boss_projectile_sprite_slot)
    call show_sprite
    ld a, (boss_projectile_layer_count)
    cp 2
    ret c
    ld a, (boss_projectile_x)
    ld b, a
    ld a, (boss_projectile_y)
    ld c, a
    ld a, d
    add a, 4
    ld d, a
    ld a, (boss_projectile_color2)
    ld e, a
    ld a, (boss_projectile_sprite_slot)
    inc a
    call show_sprite
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = first hardware sprite slot to use
;        E  = sprite color
; output: starts one boss rise/slam plus falling-rock sequence if inactive
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_slam_rocks_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_SLAM_ROCKS
    jp nz, .dbsr_done
    ld a, (boss_slam_rocks_active)
    or a
    jp nz, .dbsr_done

    ld a, (boss_y_char)
    ld (boss_slam_rocks_origin_y), a
    ld a, d
    ld (boss_slam_rocks_sprite_slot), a
    ld a, e
    ld (boss_slam_rocks_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_slam_rocks_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbsr_speed_ok
    ld a, 4
.dbsr_speed_ok:
    ld (boss_slam_rocks_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dbsr_range_ok
    ld a, 216
.dbsr_range_ok:
    ld (boss_slam_rocks_range), a

    ld a, (ix+13)
    or a
    jp nz, .dbsr_count_nonzero
    ld a, 4
.dbsr_count_nonzero:
    cp 5
    jp c, .dbsr_count_ok
    ld a, 4
.dbsr_count_ok:
    ld (boss_slam_rocks_count), a

    ld a, (ix+16)
    or a
    jp nz, .dbsr_duration_ok
    ld a, 80
.dbsr_duration_ok:
    ld (boss_slam_rocks_duration), a

    ld a, (ix+30)
    or a
    jp nz, .dbsr_rise_ok
    ld a, 3
.dbsr_rise_ok:
    ld (boss_slam_rocks_rise_chars), a

    ld a, (ix+31)
    or a
    jp nz, .dbsr_windup_ok
    ld a, 16
.dbsr_windup_ok:
    ld (boss_slam_rocks_windup), a

    ld a, (ix+32)
    or a
    jp nz, .dbsr_slam_ok
    ld a, 6
.dbsr_slam_ok:
    ld (boss_slam_rocks_slam), a

    ld a, (ix+33)
    ld (boss_slam_rocks_hold), a

    ld a, (boss_runtime_tick)
    xor b
    xor c
    ld (boss_slam_rocks_rng), a
    call boss_slam_rocks_seed_lanes
    xor a
    ld (boss_slam_rocks_age), a
    ld a, 1
    ld (boss_slam_rocks_active), a

.dbsr_done:
    pop ix
    ret

; Register Contract:
; input: boss_slam_rocks_* RAM state
; output: boss_y_char and falling rock sprites updated, or sequence hidden when complete
; clobbers: AF, BC, DE, HL
update_boss_slam_rocks_runtime:
    ld a, (boss_slam_rocks_active)
    or a
    ret z
    ld a, (boss_slam_rocks_age)
    inc a
    ld (boss_slam_rocks_age), a
    ld b, a
    ld a, (boss_slam_rocks_duration)
    cp b
    jp c, .ubsr_finish
    jp z, .ubsr_finish

    call boss_slam_rocks_update_boss_y
    call boss_slam_rocks_draw_lanes
    ret
.ubsr_finish:
    ld a, (boss_slam_rocks_origin_y)
    ld (boss_y_char), a
    call boss_slam_rocks_hide_all
    xor a
    ld (boss_slam_rocks_active), a
    ret

; Register Contract:
; input: boss_slam_rocks_age/windup/rise/origin in RAM
; output: boss_y_char raised during windup, restored afterwards
; clobbers: AF, B
boss_slam_rocks_update_boss_y:
    ld a, (boss_slam_rocks_age)
    ld b, a
    ld a, (boss_slam_rocks_windup)
    cp b
    jp c, .bsru_origin
    jp z, .bsru_origin
    ld a, (boss_slam_rocks_origin_y)
    ld b, a
    ld a, (boss_slam_rocks_rise_chars)
    cp b
    jp c, .bsru_subtract
    xor a
    ld (boss_y_char), a
    ret
.bsru_subtract:
    ld a, b
    ld b, a
    ld a, (boss_slam_rocks_rise_chars)
    ld h, a
    ld a, b
    sub h
    ld (boss_y_char), a
    ret
.bsru_origin:
    ld a, (boss_slam_rocks_origin_y)
    ld (boss_y_char), a
    ret

; Register Contract:
; input: none
; output: random X lanes stored for up to four falling rocks
; clobbers: AF, B
boss_slam_rocks_seed_lanes:
    call boss_slam_rocks_random_byte
    call boss_slam_rocks_clamp_random_x
    ld (boss_slam_rock_x0), a
    call boss_slam_rocks_random_byte
    call boss_slam_rocks_clamp_random_x
    ld (boss_slam_rock_x1), a
    call boss_slam_rocks_random_byte
    call boss_slam_rocks_clamp_random_x
    ld (boss_slam_rock_x2), a
    call boss_slam_rocks_random_byte
    call boss_slam_rocks_clamp_random_x
    ld (boss_slam_rock_x3), a
    ret

; Register Contract:
; input: boss_slam_rocks_rng
; output: A = pseudo-random byte
; clobbers: AF, HL
boss_slam_rocks_random_byte:
    ld hl, boss_slam_rocks_rng
    ld a, (hl)
    add a, 37
    xor #A7
    ld (hl), a
    ret

; Register Contract:
; input: A = random byte
; output: A = screen-safe X coordinate for a 16px sprite
; clobbers: AF, B
boss_slam_rocks_clamp_random_x:
    and #F8
    ld b, a
    cp 240
    jp c, .bsrcrx_ok
    ld a, b
    sub 32
.bsrcrx_ok:
    ret

; Register Contract:
; input: boss_slam_rocks_* RAM state
; output: falling rock sprites updated/hidden
; clobbers: AF, BC, DE, HL
boss_slam_rocks_draw_lanes:
    xor a
    ld (boss_slam_rocks_index), a
.bsrdl_loop:
    ld a, (boss_slam_rocks_index)
    ld b, a
    ld a, (boss_slam_rocks_count)
    cp b
    ret z
    ld a, (boss_slam_rocks_index)
    add a, a
    add a, a
    add a, a
    ld b, a
    ld a, (boss_slam_rocks_windup)
    add a, b
    ld b, a
    ld a, (boss_slam_rocks_slam)
    add a, b
    ld b, a
    ld a, (boss_slam_rocks_hold)
    add a, b
    ld b, a                         ; B = lane start age
    ld a, (boss_slam_rocks_age)
    cp b
    jp c, .bsrdl_hide_lane
    sub b
    call boss_slam_rocks_age_to_distance
    ld c, a
    ld a, (boss_slam_rocks_range)
    cp c
    jp c, .bsrdl_hide_lane
    ld b, c                         ; B = Y distance
    call boss_slam_rocks_get_lane_x ; C = X
    ld a, c
    ld b, a                         ; B = X
    ld c, 0
    ld a, (boss_slam_rocks_age)
    ; C already starts at top; B has X. Restore falling Y from saved distance.
    ld a, (boss_slam_rocks_range)
    ; The distance remains in B only until X assignment, so recompute cheaply.
    ld a, (boss_slam_rocks_index)
    add a, a
    add a, a
    add a, a
    ld h, a
    ld a, (boss_slam_rocks_windup)
    add a, h
    ld h, a
    ld a, (boss_slam_rocks_slam)
    add a, h
    ld h, a
    ld a, (boss_slam_rocks_hold)
    add a, h
    ld h, a
    ld a, (boss_slam_rocks_age)
    sub h
    call boss_slam_rocks_age_to_distance
    ld c, a                         ; C = Y
    ld a, (boss_slam_rocks_pattern)
    ld d, a
    ld a, (boss_slam_rocks_color)
    ld e, a
    ld a, (boss_slam_rocks_sprite_slot)
    ld h, a
    ld a, (boss_slam_rocks_index)
    add a, h
    call show_sprite
    jp .bsrdl_next
.bsrdl_hide_lane:
    ld a, (boss_slam_rocks_sprite_slot)
    ld h, a
    ld a, (boss_slam_rocks_index)
    add a, h
    call hide_sprite
.bsrdl_next:
    ld a, (boss_slam_rocks_index)
    inc a
    ld (boss_slam_rocks_index), a
    jp .bsrdl_loop

; Register Contract:
; input: A = fall age in frames
; output: A = age * boss_slam_rocks_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_slam_rocks_age_to_distance:
    ld b, a
    ld a, (boss_slam_rocks_speed)
    ld c, a
    xor a
.bsratd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bsratd_loop

; Register Contract:
; input: boss_slam_rocks_index
; output: C = lane X
; clobbers: AF, C, HL
boss_slam_rocks_get_lane_x:
    ld hl, boss_slam_rock_x0
    ld a, (boss_slam_rocks_index)
    ld c, a
    ld b, 0
    add hl, bc
    ld c, (hl)
    ret

; Register Contract:
; input: boss_slam_rocks_sprite_slot
; output: all SlamRocks sprites hidden
; clobbers: AF, B
boss_slam_rocks_hide_all:
    ld a, (boss_slam_rocks_sprite_slot)
    call hide_sprite
    ld a, (boss_slam_rocks_sprite_slot)
    inc a
    call hide_sprite
    ld a, (boss_slam_rocks_sprite_slot)
    inc a
    inc a
    call hide_sprite
    ld a, (boss_slam_rocks_sprite_slot)
    inc a
    inc a
    inc a
    call hide_sprite
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = first hardware sprite slot to use
;        E  = sprite color
; output: starts a falling-block sequence if inactive
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_falling_blocks_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_FALLING_BLOCKS
    jp nz, .dbfb_done
    ld a, (boss_falling_blocks_active)
    or a
    jp nz, .dbfb_done

    ld a, d
    ld (boss_falling_blocks_sprite_slot), a
    ld a, e
    ld (boss_falling_blocks_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_falling_blocks_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbfb_speed_ok
    ld a, 4
.dbfb_speed_ok:
    ld (boss_falling_blocks_speed), a

    ld a, (ix+13)
    or a
    jp nz, .dbfb_count_nonzero
    ld a, 4
.dbfb_count_nonzero:
    cp 5
    jp c, .dbfb_count_ok
    ld a, 4
.dbfb_count_ok:
    ld (boss_falling_blocks_count), a

    ld a, (ix+16)
    or a
    jp nz, .dbfb_duration_ok
    ld a, 80
.dbfb_duration_ok:
    ld (boss_falling_blocks_duration), a

    ld a, (ix+34)
    ld (boss_falling_blocks_tile_char), a
    ld a, (ix+35)
    or a
    jp nz, .dbfb_landing_ok
    ld a, 20
.dbfb_landing_ok:
    cp 24
    jp c, .dbfb_landing_store
    ld a, 23
.dbfb_landing_store:
    ld (boss_falling_blocks_landing_y), a
    ld a, (ix+36)
    or a
    jp nz, .dbfb_behavior_ok
    ld a, #11
.dbfb_behavior_ok:
    ld (boss_falling_blocks_behavior), a

    ld a, (boss_runtime_tick)
    xor b
    xor c
    ld (boss_falling_blocks_rng), a
    call boss_falling_blocks_seed_lanes
    xor a
    ld (boss_falling_blocks_age), a
    ld (boss_falling_blocks_landed_flags), a
    ld a, 1
    ld (boss_falling_blocks_active), a

.dbfb_done:
    pop ix
    ret

; Register Contract:
; input: boss_falling_blocks_* RAM state
; output: falling block sprites updated; landed blocks are written to runtime maps and SCREEN 2 name table
; clobbers: AF, BC, DE, HL
update_boss_falling_blocks_runtime:
    ld a, (boss_falling_blocks_active)
    or a
    ret z
    ld a, (boss_falling_blocks_age)
    inc a
    ld (boss_falling_blocks_age), a
    ld b, a
    ld a, (boss_falling_blocks_duration)
    cp b
    jp c, .ubfb_finish
    jp z, .ubfb_finish
    call boss_falling_blocks_draw_lanes
    ret
.ubfb_finish:
    call boss_falling_blocks_hide_all
    xor a
    ld (boss_falling_blocks_active), a
    ret

; Register Contract:
; input: none
; output: random X lanes stored for up to four falling blocks
; clobbers: AF, B
boss_falling_blocks_seed_lanes:
    call boss_falling_blocks_random_byte
    call boss_falling_blocks_clamp_random_x
    ld (boss_falling_blocks_x0), a
    call boss_falling_blocks_random_byte
    call boss_falling_blocks_clamp_random_x
    ld (boss_falling_blocks_x1), a
    call boss_falling_blocks_random_byte
    call boss_falling_blocks_clamp_random_x
    ld (boss_falling_blocks_x2), a
    call boss_falling_blocks_random_byte
    call boss_falling_blocks_clamp_random_x
    ld (boss_falling_blocks_x3), a
    ret

; Register Contract:
; input: boss_falling_blocks_rng
; output: A = pseudo-random byte
; clobbers: AF, HL
boss_falling_blocks_random_byte:
    ld hl, boss_falling_blocks_rng
    ld a, (hl)
    add a, 53
    xor #6D
    ld (hl), a
    ret

; Register Contract:
; input: A = random byte
; output: A = screen-safe X coordinate for a 16px sprite
; clobbers: AF, B
boss_falling_blocks_clamp_random_x:
    and #F8
    ld b, a
    cp 240
    jp c, .bfbcx_ok
    ld a, b
    sub 32
.bfbcx_ok:
    ret

; Register Contract:
; input: boss_falling_blocks_* RAM state
; output: falling block sprites shown/hidden and landed chars committed
; clobbers: AF, BC, DE, HL
boss_falling_blocks_draw_lanes:
    xor a
    ld (boss_falling_blocks_index), a
.bfbdl_loop:
    ld a, (boss_falling_blocks_index)
    ld b, a
    ld a, (boss_falling_blocks_count)
    cp b
    ret z
    call boss_falling_blocks_lane_mask
    ld b, a
    ld a, (boss_falling_blocks_landed_flags)
    and b
    jp nz, .bfbdl_hide_lane
    ld a, (boss_falling_blocks_index)
    add a, a
    add a, a
    add a, a
    ld b, a                         ; B = lane start age
    ld a, (boss_falling_blocks_age)
    cp b
    jp c, .bfbdl_hide_lane
    sub b
    call boss_falling_blocks_age_to_distance
    ld h, a                         ; H = falling Y in pixels
    ld a, (boss_falling_blocks_landing_y)
    add a, a
    add a, a
    add a, a
    ld b, a                         ; B = landing Y in pixels
    ld a, h
    cp b
    jp nc, .bfbdl_land_lane
    push af
    call boss_falling_blocks_get_lane_x
    ld b, c
    pop af
    ld c, a
    ld a, (boss_falling_blocks_pattern)
    ld d, a
    ld a, (boss_falling_blocks_color)
    ld e, a
    ld a, (boss_falling_blocks_sprite_slot)
    ld h, a
    ld a, (boss_falling_blocks_index)
    add a, h
    call show_sprite
    jp .bfbdl_next
.bfbdl_land_lane:
    call boss_falling_blocks_get_lane_x
    ld a, c
    srl a
    srl a
    srl a
    ld (boss_falling_blocks_tile_x), a
    call boss_falling_blocks_write_landed_tile
    ld a, (boss_falling_blocks_sprite_slot)
    ld h, a
    ld a, (boss_falling_blocks_index)
    add a, h
    call hide_sprite
    call boss_falling_blocks_lane_mask
    ld b, a
    ld a, (boss_falling_blocks_landed_flags)
    or b
    ld (boss_falling_blocks_landed_flags), a
    jp .bfbdl_next
.bfbdl_hide_lane:
    ld a, (boss_falling_blocks_sprite_slot)
    ld h, a
    ld a, (boss_falling_blocks_index)
    add a, h
    call hide_sprite
.bfbdl_next:
    ld a, (boss_falling_blocks_index)
    inc a
    ld (boss_falling_blocks_index), a
    jp .bfbdl_loop

; Register Contract:
; input: A = fall age in frames
; output: A = age * boss_falling_blocks_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_falling_blocks_age_to_distance:
    ld b, a
    ld a, (boss_falling_blocks_speed)
    ld c, a
    xor a
.bfbatd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bfbatd_loop

; Register Contract:
; input: boss_falling_blocks_index
; output: A = bit mask for current lane
; clobbers: AF
boss_falling_blocks_lane_mask:
    ld a, (boss_falling_blocks_index)
    or a
    jp z, .bfblm_lane0
    cp 1
    jp z, .bfblm_lane1
    cp 2
    jp z, .bfblm_lane2
    ld a, #08
    ret
.bfblm_lane0:
    ld a, #01
    ret
.bfblm_lane1:
    ld a, #02
    ret
.bfblm_lane2:
    ld a, #04
    ret

; Register Contract:
; input: boss_falling_blocks_index
; output: C = lane X
; clobbers: AF, C, HL
boss_falling_blocks_get_lane_x:
    ld hl, boss_falling_blocks_x0
    ld a, (boss_falling_blocks_index)
    ld c, a
    ld b, 0
    add hl, bc
    ld c, (hl)
    ret

; Register Contract:
; input: boss_falling_blocks_tile_x/landing_y/tile_char/behavior
; output: one landed block committed to runtime_screen_layout, runtime_behavior_map and SCREEN 2 name table
; clobbers: AF, DE, HL
boss_falling_blocks_write_landed_tile:
    ld a, (boss_falling_blocks_tile_x)
    cp 32
    ret nc
    ld a, (boss_falling_blocks_landing_y)
    cp 24
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (boss_falling_blocks_tile_x)
    ld e, a
    ld d, 0
    add hl, de
    push hl
    ld de, runtime_screen_layout
    add hl, de
    ld a, (boss_falling_blocks_tile_char)
    ld (hl), a
    pop hl
    push hl
    ld de, runtime_behavior_map
    add hl, de
    ld a, (boss_falling_blocks_behavior)
    ld (hl), a
    pop hl
    ld de, NAMETBL
    add hl, de
    ld a, (boss_falling_blocks_tile_char)
    call FAST_WRTVRM
    ret

; Register Contract:
; input: boss_falling_blocks_sprite_slot
; output: all FallingBlocks sprites hidden
; clobbers: AF
boss_falling_blocks_hide_all:
    ld a, (boss_falling_blocks_sprite_slot)
    call hide_sprite
    ld a, (boss_falling_blocks_sprite_slot)
    inc a
    call hide_sprite
    ld a, (boss_falling_blocks_sprite_slot)
    inc a
    inc a
    call hide_sprite
    ld a, (boss_falling_blocks_sprite_slot)
    inc a
    inc a
    inc a
    call hide_sprite
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X for first meteor lane
;        C  = base Y/start Y
;        D  = first hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for active/warning meteor lanes
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_meteor_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_METEOR
    jp nz, .dbma_done

    ld a, b
    add a, (ix+5)
    ld (boss_meteor_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_meteor_base_y), a
    ld a, d
    ld (boss_meteor_sprite_slot), a
    ld a, e
    ld (boss_meteor_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_meteor_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbma_speed_ok
    ld a, 1
.dbma_speed_ok:
    ld (boss_meteor_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dbma_range_ok
    ld a, 216
.dbma_range_ok:
    ld (boss_meteor_range), a

    ld a, (ix+13)
    or a
    jp nz, .dbma_count_nonzero
    ld a, 1
.dbma_count_nonzero:
    cp 9
    jp c, .dbma_count_ok
    ld a, 8
.dbma_count_ok:
    ld (boss_meteor_count), a
    ld a, (ix+14)
    ld (boss_meteor_spread), a
    ld a, (ix+15)
    ld (boss_meteor_warn), a

    ld a, (ix+16)
    or a
    jp nz, .dbma_cooldown_ok
    ld a, 1
.dbma_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbma_mod_loop:
    cp b
    jp c, .dbma_age_ready
    sub b
    jp .dbma_mod_loop
.dbma_age_ready:
    ld (boss_meteor_age), a

    xor a
    ld (boss_meteor_index), a
.dbma_loop:
    ld a, (boss_meteor_index)
    ld b, a
    ld a, (boss_meteor_count)
    cp b
    jp z, .dbma_done

    ld a, (boss_meteor_index)
    add a, a
    add a, a
    ld b, a                         ; lane delay = index * 4 frames
    ld a, (boss_meteor_warn)
    add a, b
    ld b, a                         ; warning end for this lane
    ld a, (boss_meteor_age)
    cp b
    jp c, .dbma_warning
    sub b                           ; A = fall age
    call boss_meteor_age_to_distance
    ld c, a                         ; C = distance
    ld a, (boss_meteor_range)
    cp c
    jp c, .dbma_hide_lane
    ld a, (boss_meteor_base_y)
    add a, c
    ld c, a                         ; C = Y
    call boss_meteor_compute_lane_x ; B = X
    call boss_meteor_show_lane
    jp .dbma_next_lane

.dbma_warning:
    ld a, (boss_meteor_base_y)
    ld c, a
    ld a, (boss_meteor_range)
    add a, c
    ld c, a                         ; C = warning/landing Y
    call boss_meteor_compute_lane_x ; B = X
    call boss_meteor_show_lane
    jp .dbma_next_lane

.dbma_hide_lane:
    ld a, (boss_meteor_sprite_slot)
    ld b, a
    ld a, (boss_meteor_index)
    add a, b
    call hide_sprite

.dbma_next_lane:
    ld a, (boss_meteor_index)
    inc a
    ld (boss_meteor_index), a
    jp .dbma_loop

.dbma_done:
    pop ix
    ret

; Register Contract:
; input: A = fall age in frames
; output: A = age * boss_meteor_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_meteor_age_to_distance:
    ld b, a
    ld a, (boss_meteor_speed)
    ld c, a
    xor a
.bmatd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bmatd_loop

; Register Contract:
; input: boss_meteor_index/base_x/spread in RAM
; output: B = lane X
; clobbers: AF, B, HL
boss_meteor_compute_lane_x:
    ld a, (boss_meteor_index)
    ld b, a
    ld a, (boss_meteor_spread)
    ld h, a
    ld a, (boss_meteor_base_x)
.bmcx_loop:
    ld l, a
    ld a, b
    or a
    ld a, l
    jp z, .bmcx_done
    add a, h
    dec b
    jp .bmcx_loop
.bmcx_done:
    ld b, a
    ret

; Register Contract:
; input: B = X, C = Y
; output: sprite_attributes updated for current lane
; clobbers: AF, DE, HL
boss_meteor_show_lane:
    ld a, (boss_meteor_pattern)
    ld d, a
    ld a, (boss_meteor_color)
    ld e, a
    ld a, (boss_meteor_sprite_slot)
    ld h, a
    ld a, (boss_meteor_index)
    add a, h
    call show_sprite
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X for first bomb lane
;        C  = base Y
;        D  = first hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for active bomb/explosion lanes
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_bomb_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_BOMB
    jp nz, .dbba_done

    ld a, b
    add a, (ix+5)
    ld (boss_bomb_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_bomb_base_y), a
    ld a, d
    ld (boss_bomb_sprite_slot), a
    ld a, e
    ld (boss_bomb_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_bomb_pattern), a

    ld a, (ix+22)
    cp #FF
    jp nz, .dbba_resolve_explosion_sprite
    ld a, (boss_bomb_pattern)
    jp .dbba_explosion_pattern_ready
.dbba_resolve_explosion_sprite:
    call boss_attack_get_sprite_pattern
.dbba_explosion_pattern_ready:
    ld (boss_bomb_explosion_pattern), a

    ld a, (ix+17)
    or a
    jp nz, .dbba_count_nonzero
    ld a, 1
.dbba_count_nonzero:
    cp 9
    jp c, .dbba_count_ok
    ld a, 8
.dbba_count_ok:
    ld (boss_bomb_count), a

    ld a, (ix+18)
    ld (boss_bomb_spread), a
    ld a, (ix+19)
    or a
    jp nz, .dbba_fuse_ok
    ld a, 45
.dbba_fuse_ok:
    ld (boss_bomb_fuse), a
    ld a, (ix+20)
    or a
    jp nz, .dbba_radius_ok
    ld a, 24
.dbba_radius_ok:
    ld (boss_bomb_radius), a
    ld a, (ix+21)
    or a
    jp nz, .dbba_duration_ok
    ld a, 18
.dbba_duration_ok:
    ld (boss_bomb_duration), a

    ld a, (ix+16)
    or a
    jp nz, .dbba_cooldown_ok
    ld a, 1
.dbba_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbba_mod_loop:
    cp b
    jp c, .dbba_age_ready
    sub b
    jp .dbba_mod_loop
.dbba_age_ready:
    ld (boss_bomb_age), a

    xor a
    ld (boss_bomb_index), a
.dbba_loop:
    ld a, (boss_bomb_index)
    ld b, a
    ld a, (boss_bomb_count)
    cp b
    jp z, .dbba_done

    ld a, (boss_bomb_index)
    ld b, a
    add a, a
    add a, a
    add a, b                         ; lane delay = index * 5 frames
    ld b, a
    ld a, (boss_bomb_age)
    cp b
    jp c, .dbba_hide_lane
    sub b
    ld c, a                         ; C = lane age

    ld a, (boss_bomb_fuse)
    cp c
    jp z, .dbba_explosion_age
    jp c, .dbba_explosion_age
    ld a, (boss_bomb_base_y)
    ld c, a
    call boss_bomb_compute_lane_x   ; B = X
    call boss_bomb_show_bomb_lane
    jp .dbba_next_lane

.dbba_explosion_age:
    ld a, c
    ld b, a
    ld a, (boss_bomb_fuse)
    ld h, a
    ld a, b
    sub h
    ld c, a                         ; C = explosion age
    ld a, (boss_bomb_duration)
    cp c
    jp z, .dbba_hide_lane
    jp c, .dbba_hide_lane
    call boss_bomb_compute_lane_x   ; B = lane center X
    call boss_bomb_show_explosion_lane
    jp .dbba_next_lane

.dbba_hide_lane:
    ld a, (boss_bomb_sprite_slot)
    ld b, a
    ld a, (boss_bomb_index)
    add a, b
    call hide_sprite

.dbba_next_lane:
    ld a, (boss_bomb_index)
    inc a
    ld (boss_bomb_index), a
    jp .dbba_loop

.dbba_done:
    pop ix
    ret

; Register Contract:
; input: boss_bomb_index/base_x/spread in RAM
; output: B = lane X
; clobbers: AF, B, HL
boss_bomb_compute_lane_x:
    ld a, (boss_bomb_index)
    ld b, a
    ld a, (boss_bomb_spread)
    ld h, a
    ld a, (boss_bomb_base_x)
.bbcx_loop:
    ld l, a
    ld a, b
    or a
    ld a, l
    jp z, .bbcx_done
    add a, h
    dec b
    jp .bbcx_loop
.bbcx_done:
    ld b, a
    ret

; Register Contract:
; input: B = X, C = Y
; output: sprite_attributes updated for current bomb lane
; clobbers: AF, DE, HL
boss_bomb_show_bomb_lane:
    ld a, (boss_bomb_pattern)
    ld d, a
    ld a, (boss_bomb_color)
    ld e, a
    ld a, (boss_bomb_sprite_slot)
    ld h, a
    ld a, (boss_bomb_index)
    add a, h
    call show_sprite
    ret

; Register Contract:
; input: B = lane center X
; output: sprite_attributes updated for current explosion lane
; clobbers: AF, BC, DE, HL
boss_bomb_show_explosion_lane:
    ld a, b
    ld h, a
    ld a, (boss_bomb_radius)
    ld b, a
    ld a, h
    sub b
    ld b, a                         ; X = center - radius
    ld a, (boss_bomb_base_y)
    ld h, a
    ld a, (boss_bomb_radius)
    ld c, a
    ld a, h
    sub c
    ld c, a                         ; Y = center - radius
    ld a, (boss_bomb_explosion_pattern)
    ld d, a
    ld a, (boss_bomb_color)
    ld e, a
    ld a, (boss_bomb_sprite_slot)
    ld h, a
    ld a, (boss_bomb_index)
    add a, h
    call show_sprite
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for current boomerang position
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_boomerang_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_BOOMERANG
    jp nz, .dboga_done

    ld a, b
    add a, (ix+5)
    ld (boss_boomerang_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_boomerang_base_y), a
    ld a, d
    ld (boss_boomerang_sprite_slot), a
    ld a, e
    ld (boss_boomerang_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_boomerang_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dboga_speed_ok
    ld a, 3
.dboga_speed_ok:
    ld (boss_boomerang_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dboga_range_ok
    ld a, 96
.dboga_range_ok:
    ld (boss_boomerang_range), a

    ld a, (ix+4)
    ld (boss_boomerang_direction), a

    ld a, (ix+16)
    or a
    jp nz, .dboga_cooldown_ok
    ld a, 68
.dboga_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dboga_mod_loop:
    cp b
    jp c, .dboga_age_ready
    sub b
    jp .dboga_mod_loop
.dboga_age_ready:
    ld (boss_boomerang_age), a
    call boss_boomerang_age_to_distance
    ld c, a                         ; C = total travelled distance

    ld a, (boss_boomerang_range)
    cp c
    jp c, .dboga_returning
    ld a, c
    ld (boss_boomerang_distance), a
    jp .dboga_show

.dboga_returning:
    ld a, c
    ld b, a
    ld a, (boss_boomerang_range)
    ld h, a
    ld a, b
    sub h
    ld c, a                         ; C = distance after far point
    ld a, (boss_boomerang_range)
    cp c
    jp c, .dboga_hide
    ld a, (boss_boomerang_range)
    sub c
    ld (boss_boomerang_distance), a

.dboga_show:
    call boss_boomerang_compute_position
    ld a, (boss_boomerang_pattern)
    ld d, a
    ld a, (boss_boomerang_color)
    ld e, a
    ld a, (boss_boomerang_sprite_slot)
    call show_sprite
    jp .dboga_done

.dboga_hide:
    ld a, (boss_boomerang_sprite_slot)
    call hide_sprite

.dboga_done:
    pop ix
    ret

; Register Contract:
; input: boss_boomerang_age/speed in RAM
; output: A = age * speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_boomerang_age_to_distance:
    ld a, (boss_boomerang_age)
    ld b, a
    ld a, (boss_boomerang_speed)
    ld c, a
    xor a
.bbatd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bbatd_loop

; Register Contract:
; input: boomerang base/direction/distance in RAM
; output: B = X, C = Y
; clobbers: AF, BC, H
boss_boomerang_compute_position:
    ld a, (boss_boomerang_base_x)
    ld b, a
    ld a, (boss_boomerang_base_y)
    ld c, a
    ld a, (boss_boomerang_direction)
    cp BOSS_DIR_RIGHT
    jp z, .bbcp_right
    cp BOSS_DIR_UP
    jp z, .bbcp_up
    cp BOSS_DIR_DOWN
    jp z, .bbcp_down
    ld a, b
    ld h, a
    ld a, (boss_boomerang_distance)
    ld b, a
    ld a, h
    sub b
    ld b, a
    ret
.bbcp_right:
    ld a, b
    ld h, a
    ld a, (boss_boomerang_distance)
    add a, h
    ld b, a
    ret
.bbcp_up:
    ld a, c
    ld h, a
    ld a, (boss_boomerang_distance)
    ld c, a
    ld a, h
    sub c
    ld c, a
    ret
.bbcp_down:
    ld a, c
    ld h, a
    ld a, (boss_boomerang_distance)
    add a, h
    ld c, a
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for current parabolic rock position
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_rock_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_ROCK
    jp nz, .dbra_done

    ld a, b
    add a, (ix+5)
    ld (boss_rock_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_rock_base_y), a
    ld a, d
    ld (boss_rock_sprite_slot), a
    ld a, e
    ld (boss_rock_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_rock_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbra_speed_ok
    ld a, 3
.dbra_speed_ok:
    ld (boss_rock_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dbra_range_ok
    ld a, 128
.dbra_range_ok:
    ld (boss_rock_range), a

    ld a, (ix+4)
    ld (boss_rock_direction), a
    ld a, (ix+23)
    or a
    jp nz, .dbra_arc_ok
    ld a, 40
.dbra_arc_ok:
    ld (boss_rock_arc_height), a

    ld a, (ix+16)
    or a
    jp nz, .dbra_cooldown_ok
    ld a, 28
.dbra_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbra_mod_loop:
    cp b
    jp c, .dbra_age_ready
    sub b
    jp .dbra_mod_loop
.dbra_age_ready:
    ld (boss_rock_age), a
    call boss_rock_age_to_distance
    ld c, a                         ; C = travelled distance
    ld a, (boss_rock_range)
    cp c
    jp c, .dbra_hide
    ld a, c
    ld (boss_rock_distance), a
    call boss_rock_compute_arc_offset
    call boss_rock_compute_position
    ld a, (boss_rock_pattern)
    ld d, a
    ld a, (boss_rock_color)
    ld e, a
    ld a, (boss_rock_sprite_slot)
    call show_sprite
    jp .dbra_done

.dbra_hide:
    ld a, (boss_rock_sprite_slot)
    call hide_sprite

.dbra_done:
    pop ix
    ret

; Register Contract:
; input: boss_rock_age/speed in RAM
; output: A = age * boss_rock_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_rock_age_to_distance:
    ld a, (boss_rock_age)
    ld b, a
    ld a, (boss_rock_speed)
    ld c, a
    xor a
.bratd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bratd_loop

; Register Contract:
; input: boss_rock_distance/range/arc_height in RAM
; output: boss_rock_arc_offset = triangular arc offset capped by arc_height
; clobbers: AF, B, H
boss_rock_compute_arc_offset:
    ld a, (boss_rock_range)
    srl a
    ld h, a                         ; H = half range
    ld a, (boss_rock_distance)
    cp h
    jp c, .brcao_candidate_ready
    ld b, a                         ; B = distance
    ld a, (boss_rock_range)
    sub b                           ; A = range - distance
.brcao_candidate_ready:
    ld h, a                         ; H = triangular arc candidate
    ld a, (boss_rock_arc_height)
    cp h
    jp c, .brcao_store
    ld a, h
.brcao_store:
    ld (boss_rock_arc_offset), a
    ret

; Register Contract:
; input: rock base/direction/distance/arc_offset in RAM
; output: B = X, C = Y
; clobbers: AF, BC, H
boss_rock_compute_position:
    ld a, (boss_rock_base_x)
    ld b, a
    ld a, (boss_rock_base_y)
    ld c, a
    ld a, (boss_rock_direction)
    cp BOSS_DIR_RIGHT
    jp z, .brcp_right
    cp BOSS_DIR_UP
    jp z, .brcp_up
    cp BOSS_DIR_DOWN
    jp z, .brcp_down
    ld a, b
    ld h, a
    ld a, (boss_rock_distance)
    ld b, a
    ld a, h
    sub b
    ld b, a
    jp .brcp_apply_arc
.brcp_right:
    ld a, b
    ld h, a
    ld a, (boss_rock_distance)
    add a, h
    ld b, a
    jp .brcp_apply_arc
.brcp_up:
    ld a, c
    ld h, a
    ld a, (boss_rock_distance)
    ld c, a
    ld a, h
    sub c
    ld c, a
    jp .brcp_apply_arc
.brcp_down:
    ld a, c
    ld h, a
    ld a, (boss_rock_distance)
    add a, h
    ld c, a
.brcp_apply_arc:
    ld a, c
    ld h, a
    ld a, (boss_rock_arc_offset)
    ld c, a
    ld a, h
    sub c
    ld c, a
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for current sine-wave projectile position
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_sine_wave_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_SINE_WAVE
    jp nz, .dbswa_done

    ld a, b
    add a, (ix+5)
    ld (boss_wave_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_wave_base_y), a
    ld a, d
    ld (boss_wave_sprite_slot), a
    ld a, e
    ld (boss_wave_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_wave_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbswa_speed_ok
    ld a, 3
.dbswa_speed_ok:
    ld (boss_wave_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dbswa_range_ok
    ld a, 144
.dbswa_range_ok:
    ld (boss_wave_range), a

    ld a, (ix+4)
    ld (boss_wave_direction), a

    ld a, (ix+27)
    or a
    jp nz, .dbswa_amplitude_ok
    ld a, 16
.dbswa_amplitude_ok:
    ld (boss_wave_amplitude), a

    ld a, (ix+28)
    or a
    jp nz, .dbswa_frequency_ok
    ld a, 4
.dbswa_frequency_ok:
    ld (boss_wave_frequency), a

    ld a, (ix+16)
    or a
    jp nz, .dbswa_cooldown_ok
    ld a, 36
.dbswa_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbswa_mod_loop:
    cp b
    jp c, .dbswa_age_ready
    sub b
    jp .dbswa_mod_loop
.dbswa_age_ready:
    ld (boss_wave_age), a
    call boss_wave_age_to_distance
    ld c, a                         ; C = travelled distance
    ld a, (boss_wave_range)
    cp c
    jp c, .dbswa_hide
    ld a, c
    ld (boss_wave_distance), a
    call boss_wave_compute_phase
    call boss_wave_compute_offset
    call boss_wave_compute_position
    ld a, (boss_wave_pattern)
    ld d, a
    ld a, (boss_wave_color)
    ld e, a
    ld a, (boss_wave_sprite_slot)
    call show_sprite
    jp .dbswa_done

.dbswa_hide:
    ld a, (boss_wave_sprite_slot)
    call hide_sprite

.dbswa_done:
    pop ix
    ret

; Register Contract:
; input: boss_wave_age/speed in RAM
; output: A = age * boss_wave_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_wave_age_to_distance:
    ld a, (boss_wave_age)
    ld b, a
    ld a, (boss_wave_speed)
    ld c, a
    xor a
.bwatd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bwatd_loop

; Register Contract:
; input: boss_wave_age/frequency in RAM
; output: boss_wave_phase = floor(age / frequency) & 7
; clobbers: AF, BC, D
boss_wave_compute_phase:
    ld a, (boss_wave_age)
    ld b, a
    ld a, (boss_wave_frequency)
    or a
    jp nz, .bwcp_frequency_ok
    ld a, 4
.bwcp_frequency_ok:
    ld d, a
    ld c, 0
.bwcp_loop:
    ld a, b
    cp d
    jp c, .bwcp_done
    sub d
    ld b, a
    inc c
    jp .bwcp_loop
.bwcp_done:
    ld a, c
    and #07
    ld (boss_wave_phase), a
    ret

; Register Contract:
; input: boss_wave_phase/amplitude in RAM
; output: boss_wave_offset = signed perpendicular sine-like offset
; clobbers: AF, H
boss_wave_compute_offset:
    ld a, (boss_wave_phase)
    and #07
    cp 1
    jp z, .bwco_half_pos
    cp 3
    jp z, .bwco_half_pos
    cp 2
    jp z, .bwco_full_pos
    cp 5
    jp z, .bwco_half_neg
    cp 7
    jp z, .bwco_half_neg
    cp 6
    jp z, .bwco_full_neg
    xor a
    jp .bwco_store
.bwco_half_pos:
    ld a, (boss_wave_amplitude)
    srl a
    jp .bwco_store
.bwco_full_pos:
    ld a, (boss_wave_amplitude)
    jp .bwco_store
.bwco_half_neg:
    ld a, (boss_wave_amplitude)
    srl a
    ld h, a
    xor a
    sub h
    jp .bwco_store
.bwco_full_neg:
    ld a, (boss_wave_amplitude)
    ld h, a
    xor a
    sub h
.bwco_store:
    ld (boss_wave_offset), a
    ret

; Register Contract:
; input: wave base/direction/distance/offset in RAM
; output: B = X, C = Y
; clobbers: AF, BC, H
boss_wave_compute_position:
    ld a, (boss_wave_base_x)
    ld b, a
    ld a, (boss_wave_base_y)
    ld c, a
    ld a, (boss_wave_direction)
    cp BOSS_DIR_RIGHT
    jp z, .bwcp_right
    cp BOSS_DIR_UP
    jp z, .bwcp_up
    cp BOSS_DIR_DOWN
    jp z, .bwcp_down
    ld a, b
    ld h, a
    ld a, (boss_wave_distance)
    ld b, a
    ld a, h
    sub b
    ld b, a
    jp .bwcp_offset_y
.bwcp_right:
    ld a, b
    ld h, a
    ld a, (boss_wave_distance)
    add a, h
    ld b, a
    jp .bwcp_offset_y
.bwcp_up:
    ld a, c
    ld h, a
    ld a, (boss_wave_distance)
    ld c, a
    ld a, h
    sub c
    ld c, a
    jp .bwcp_offset_x
.bwcp_down:
    ld a, c
    ld h, a
    ld a, (boss_wave_distance)
    add a, h
    ld c, a
.bwcp_offset_x:
    ld a, b
    ld h, a
    ld a, (boss_wave_offset)
    add a, h
    ld b, a
    ret
.bwcp_offset_y:
    ld a, c
    ld h, a
    ld a, (boss_wave_offset)
    add a, h
    ld c, a
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X
;        C  = base Y
;        D  = hardware sprite slot to use
;        E  = sprite color
; output: sprite_attributes updated for current homing missile position
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_homing_missile_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_HOMING_MISSILE
    jp nz, .dbhoma_done

    ld a, b
    add a, (ix+5)
    ld (boss_homing_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_homing_base_y), a
    ld a, d
    ld (boss_homing_sprite_slot), a
    ld a, e
    ld (boss_homing_color), a

    ld a, (ix+1)
    call boss_attack_get_sprite_pattern
    ld (boss_homing_pattern), a

    ld a, (ix+3)
    or a
    jp nz, .dbhoma_speed_ok
    ld a, 3
.dbhoma_speed_ok:
    ld (boss_homing_speed), a

    ld a, (ix+7)
    or a
    jp nz, .dbhoma_range_ok
    ld a, 176
.dbhoma_range_ok:
    ld (boss_homing_range), a

    ld a, (ix+4)
    ld (boss_homing_direction), a

    ld a, (ix+29)
    or a
    jp nz, .dbhoma_turn_ok
    ld a, 2
.dbhoma_turn_ok:
    ld (boss_homing_turn_step), a

    ld a, (ix+16)
    or a
    jp nz, .dbhoma_cooldown_ok
    ld a, 36
.dbhoma_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbhoma_mod_loop:
    cp b
    jp c, .dbhoma_age_ready
    sub b
    jp .dbhoma_mod_loop
.dbhoma_age_ready:
    ld (boss_homing_age), a
    call boss_homing_age_to_distance
    ld c, a                         ; C = travelled distance
    ld a, (boss_homing_range)
    cp c
    jp c, .dbhoma_hide
    ld a, c
    ld (boss_homing_distance), a
    call boss_homing_compute_launch_position
    call boss_homing_compute_turn_distance
    call boss_homing_adjust_toward_hero
    ld a, (boss_homing_pattern)
    ld d, a
    ld a, (boss_homing_color)
    ld e, a
    ld a, (boss_homing_sprite_slot)
    call show_sprite
    jp .dbhoma_done

.dbhoma_hide:
    ld a, (boss_homing_sprite_slot)
    call hide_sprite

.dbhoma_done:
    pop ix
    ret

; Register Contract:
; input: boss_homing_age/speed in RAM
; output: A = age * boss_homing_speed, 8-bit wrapping
; clobbers: AF, BC, H
boss_homing_age_to_distance:
    ld a, (boss_homing_age)
    ld b, a
    ld a, (boss_homing_speed)
    ld c, a
    xor a
.bhatd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    ret z
    add a, c
    dec b
    jp .bhatd_loop

; Register Contract:
; input: homing base/direction/distance in RAM
; output: B = launch-path X, C = launch-path Y
; clobbers: AF, BC, H
boss_homing_compute_launch_position:
    ld a, (boss_homing_base_x)
    ld b, a
    ld a, (boss_homing_base_y)
    ld c, a
    ld a, (boss_homing_direction)
    cp BOSS_DIR_RIGHT
    jp z, .bhclp_right
    cp BOSS_DIR_UP
    jp z, .bhclp_up
    cp BOSS_DIR_DOWN
    jp z, .bhclp_down
    ld a, b
    ld h, a
    ld a, (boss_homing_distance)
    ld b, a
    ld a, h
    sub b
    ld b, a
    ret
.bhclp_right:
    ld a, b
    ld h, a
    ld a, (boss_homing_distance)
    add a, h
    ld b, a
    ret
.bhclp_up:
    ld a, c
    ld h, a
    ld a, (boss_homing_distance)
    ld c, a
    ld a, h
    sub c
    ld c, a
    ret
.bhclp_down:
    ld a, c
    ld h, a
    ld a, (boss_homing_distance)
    add a, h
    ld c, a
    ret

; Register Contract:
; input: boss_homing_age/turn_step in RAM
; output: boss_homing_turn_distance = age * turn_step, 8-bit wrapping
; clobbers: AF, BC, H
boss_homing_compute_turn_distance:
    ld a, (boss_homing_age)
    ld b, a
    ld a, (boss_homing_turn_step)
    ld c, a
    xor a
.bhctd_loop:
    ld h, a
    ld a, b
    or a
    ld a, h
    jp z, .bhctd_store
    add a, c
    dec b
    jp .bhctd_loop
.bhctd_store:
    ld (boss_homing_turn_distance), a
    ret

; Register Contract:
; input: B = current X, C = current Y, hero_entity_id/entity positions in RAM
; output: B/C nudged toward hero by boss_homing_turn_distance
; clobbers: AF, DE, HL
boss_homing_adjust_toward_hero:
    ld a, (hero_entity_id)
    cp #FF
    ret z
    ld l, a
    ld h, 0
    ld de, entity_x_pos
    add hl, de
    ld a, (hl)
    ld h, a                         ; H = hero X
    ld a, b
    cp h
    jp z, .bhatth_y
    jp c, .bhatth_x_right
    ld a, b
    ld l, a
    ld a, (boss_homing_turn_distance)
    ld b, a
    ld a, l
    sub b
    ld b, a
    jp .bhatth_y
.bhatth_x_right:
    ld a, b
    ld l, a
    ld a, (boss_homing_turn_distance)
    add a, l
    ld b, a
.bhatth_y:
    ld a, (hero_entity_id)
    ld l, a
    ld h, 0
    ld de, entity_y_pos
    add hl, de
    ld a, (hl)
    ld h, a                         ; H = hero Y
    ld a, c
    cp h
    ret z
    jp c, .bhatth_y_down
    ld a, c
    ld l, a
    ld a, (boss_homing_turn_distance)
    ld c, a
    ld a, l
    sub c
    ld c, a
    ret
.bhatth_y_down:
    ld a, c
    ld l, a
    ld a, (boss_homing_turn_distance)
    add a, l
    ld c, a
    ret

; Register Contract:
; input: HL = boss attack record
;        B  = base X in pixels
;        C  = base Y in pixels
;        D  = unused sprite slot (kept for shared boss attack signature)
;        E  = unused sprite color
; output: SCREEN 2 name table updated with repeated laser chars while active,
;         original chars restored from current_screen_layout while inactive
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_boss_laser_attack:
    push ix
    push hl
    pop ix
    ld a, (ix+0)
    cp BOSS_ATTACK_LASER
    jp nz, .dbla_done

    ld a, b
    add a, (ix+5)
    ld (boss_laser_base_x), a
    ld a, c
    add a, (ix+6)
    ld (boss_laser_base_y), a

    ld a, (ix+24)
    ld (boss_laser_tile_char), a
    ld a, (ix+25)
    or a
    jp nz, .dbla_length_nonzero
    ld a, 12
.dbla_length_nonzero:
    cp 33
    jp c, .dbla_length_ok
    ld a, 32
.dbla_length_ok:
    ld (boss_laser_length), a

    ld a, (ix+26)
    or a
    jp nz, .dbla_duration_ok
    ld a, 18
.dbla_duration_ok:
    ld (boss_laser_duration), a
    ld a, (ix+4)
    ld (boss_laser_direction), a

    ld a, (ix+16)
    or a
    jp nz, .dbla_cooldown_ok
    ld a, 24
.dbla_cooldown_ok:
    ld b, a
    ld a, (boss_runtime_tick)
.dbla_mod_loop:
    cp b
    jp c, .dbla_age_ready
    sub b
    jp .dbla_mod_loop
.dbla_age_ready:
    ld (boss_laser_age), a

    call boss_laser_prepare_origin
    ld a, (boss_laser_duration)
    ld b, a
    ld a, (boss_laser_age)
    cp b
    jp c, .dbla_draw_active
    ld a, 1
    ld (boss_laser_write_mode), a
    jp .dbla_loop_start
.dbla_draw_active:
    xor a
    ld (boss_laser_write_mode), a

.dbla_loop_start:
    xor a
    ld (boss_laser_index), a
.dbla_loop:
    ld a, (boss_laser_index)
    ld b, a
    ld a, (boss_laser_length)
    cp b
    jp z, .dbla_done
    call boss_laser_compute_current_tile
    call boss_laser_write_current_tile
    ld a, (boss_laser_index)
    inc a
    ld (boss_laser_index), a
    jp .dbla_loop

.dbla_done:
    pop ix
    ret

; Register Contract:
; input: boss_laser_base_x/base_y in pixels
; output: boss_laser_origin_tile_x/y set to 8x8 char coordinates
; clobbers: AF
boss_laser_prepare_origin:
    ld a, (boss_laser_base_x)
    srl a
    srl a
    srl a
    ld (boss_laser_origin_tile_x), a
    ld a, (boss_laser_base_y)
    srl a
    srl a
    srl a
    ld (boss_laser_origin_tile_y), a
    ret

; Register Contract:
; input: boss_laser_origin_tile_x/y, direction and index in RAM
; output: boss_laser_tile_x/y set for current beam char
; clobbers: AF, BC, H
boss_laser_compute_current_tile:
    ld a, (boss_laser_origin_tile_x)
    ld b, a
    ld a, (boss_laser_origin_tile_y)
    ld c, a
    ld a, (boss_laser_direction)
    cp BOSS_DIR_RIGHT
    jp z, .blcct_right
    cp BOSS_DIR_UP
    jp z, .blcct_up
    cp BOSS_DIR_DOWN
    jp z, .blcct_down
    ld a, b
    ld h, a
    ld a, (boss_laser_index)
    ld b, a
    ld a, h
    sub b
    ld (boss_laser_tile_x), a
    ld a, c
    ld (boss_laser_tile_y), a
    ret
.blcct_right:
    ld a, b
    ld h, a
    ld a, (boss_laser_index)
    add a, h
    ld (boss_laser_tile_x), a
    ld a, c
    ld (boss_laser_tile_y), a
    ret
.blcct_up:
    ld a, b
    ld (boss_laser_tile_x), a
    ld a, c
    ld h, a
    ld a, (boss_laser_index)
    ld c, a
    ld a, h
    sub c
    ld (boss_laser_tile_y), a
    ret
.blcct_down:
    ld a, b
    ld (boss_laser_tile_x), a
    ld a, c
    ld h, a
    ld a, (boss_laser_index)
    add a, h
    ld (boss_laser_tile_y), a
    ret

; Register Contract:
; input: boss_laser_tile_x/y and write_mode in RAM
; output: one SCREEN 2 name-table char written or restored
; clobbers: AF, DE, HL
boss_laser_write_current_tile:
    ld a, (boss_laser_tile_x)
    cp 32
    ret nc
    ld a, (boss_laser_tile_y)
    cp 24
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = y * 32
    ld a, (boss_laser_tile_x)
    ld e, a
    ld d, 0
    add hl, de                    ; HL = name-table offset
    push hl
    ld a, (boss_laser_write_mode)
    or a
    jp nz, .blwct_restore
    pop hl
    ld a, (boss_laser_tile_char)
    jp .blwct_write
.blwct_restore:
    ld de, (current_screen_layout)
    add hl, de
    ld a, (hl)
    pop hl
.blwct_write:
    ld de, NAMETBL
    add hl, de
    call FAST_WRTVRM
    ret

`;
    return wrapMideasAsmBlock(stripUnusedBossGeneralRuntime(stripUnusedBossBehaviorRuntime(stripUnusedBossAttackRuntime(asm, features), features)), {
        id: 'runtime.boss.core',
        kind: 'routine',
        owner: 'bosses',
        preserve: false,
        roots: ['bosses'],
    });
}
function renderPhaseRecord(phase, labels, pointerConfig) {
    return [
        db([
            clampByte(phase.healthThreshold),
            getBuildTypeId(phase.buildType),
            clampByte(phase.dimensions?.width || 0),
            clampByte(phase.dimensions?.height || 0)
        ], 'healthThreshold,buildType,width,height'),
        dw([
            bossDataPtr(labels.tileMatrix, pointerConfig),
            bossDataPtr(labels.collisionMatrix, pointerConfig),
            bossDataPtr(labels.neckChain, pointerConfig),
            bossDataPtr(labels.crushMovement, pointerConfig),
            bossDataPtr(labels.attackSequence, pointerConfig),
            bossDataPtr(labels.behaviorLoop, pointerConfig),
            bossDataPtr(labels.formTable, pointerConfig),
            bossDataPtr(labels.weakMatrix, pointerConfig)
        ], 'tileMatrix,collision,neck,crush,attacks,behavior,forms,weak')
    ].join('\n');
}
function renderBossDataSections(analysis, runtimeBossEntries, runtimeFeatures, tileIndexById, spriteIndexById, matrixDeduperFactory, pointerConfig) {
    const bossTableRows = [];
    const detailBlocks = [];
    runtimeBossEntries.forEach(({ boss, originalIndex }) => {
        const bossMatrixDeduper = matrixDeduperFactory();
        const bossLabel = `boss_${originalIndex}_${sanitizeLabel(boss.name, 'boss')}`;
        const phases = boss.phases || [];
        const allAttacks = boss.attacks || [];
        const usedAttackIds = collectUsedBossAttackIds(boss);
        const attacks = allAttacks.filter(attack => usedAttackIds.has(attack.id));
        const attackIndexById = new Map(attacks.map((attack, index) => [attack.id, index]));
        const attackTileBankId = phases.find(phase => phase.tileBankId)?.tileBankId;
        const phaseTableLabel = `${bossLabel}_phase_table`;
        const attackTableLabel = `${bossLabel}_attack_table`;
        const bossStartYChar = Number.isFinite(boss.behaviorPreviewStartYChar)
            ? Math.max(0, Math.min(23, Math.floor(Number(boss.behaviorPreviewStartYChar))))
            : 0;
        bossTableRows.push(dw([bossDataPtr(phaseTableLabel, pointerConfig), bossDataPtr(attackTableLabel, pointerConfig)], `${boss.name}`));
        bossTableRows.push(db([
            clampByte(word(boss.totalHealth) & 0xff),
            clampByte((word(boss.totalHealth) >> 8) & 0xff),
            clampByte(phases.length),
            clampByte(attacks.length)
        ], 'healthLo,healthHi,phaseCount,attackCount'));
        const phaseRecordLabels = [];
        const phaseDataBlocks = [];
        phases.forEach((phase, phaseIndex) => {
            const phaseLabel = `${bossLabel}_phase_${phaseIndex}`;
            const labels = {
                tileMatrix: `${phaseLabel}_tiles`,
                collisionMatrix: `${phaseLabel}_collision`,
                weakMatrix: `${phaseLabel}_weak`,
                neckChain: `${phaseLabel}_neck`,
                crushMovement: `${phaseLabel}_crush`,
                attackSequence: `${phaseLabel}_attacks`,
                behaviorLoop: `${phaseLabel}_behavior`,
                formTable: `${phaseLabel}_forms`
            };
            const tileMatrixResult = bossMatrixDeduper.renderTile(labels.tileMatrix, phase, tileIndexById, analysis, bossStartYChar);
            const weakMatrixResult = bossMatrixDeduper.renderWeak(labels.weakMatrix, phase);
            const effectivePhaseLabels = {
                ...labels,
                tileMatrix: tileMatrixResult.label,
                weakMatrix: weakMatrixResult.label,
                formTable: runtimeFeatures.hasForms ? labels.formTable : EMPTY_REF,
                collisionMatrix: EMPTY_REF,
                neckChain: runtimeFeatures.hasNeckChains ? labels.neckChain : EMPTY_REF,
                crushMovement: runtimeFeatures.hasCrushMovement ? labels.crushMovement : EMPTY_REF,
                attackSequence: runtimeFeatures.usedAttackTypes.size > 0 ? labels.attackSequence : EMPTY_REF
            };
            const formIndexById = buildFormIndexById(phase);
            phaseRecordLabels.push(phaseLabel);
            phaseDataBlocks.push(`${phaseLabel}:\n${renderPhaseRecord(phase, effectivePhaseLabels, pointerConfig)}`);
            if (tileMatrixResult.block) {
                phaseDataBlocks.push(tileMatrixResult.block);
            }
            if (weakMatrixResult.block) {
                phaseDataBlocks.push(weakMatrixResult.block);
            }
            if (runtimeFeatures.hasNeckChains) {
                phaseDataBlocks.push(renderNeckChain(labels.neckChain, phase.neckChain));
            }
            if (runtimeFeatures.hasCrushMovement) {
                phaseDataBlocks.push(renderCrushMovement(labels.crushMovement, phase.crushMovement));
            }
            if (runtimeFeatures.usedAttackTypes.size > 0) {
                phaseDataBlocks.push(renderAttackSequence(labels.attackSequence, phase, attackIndexById));
            }
            phaseDataBlocks.push(renderBehaviorLoop(labels.behaviorLoop, phase, attackIndexById, formIndexById));
            if (runtimeFeatures.hasForms) {
                phaseDataBlocks.push(...renderFormTable(labels.formTable, phase, tileIndexById, analysis, bossStartYChar, tileMatrixResult.label, weakMatrixResult.label, bossMatrixDeduper, pointerConfig));
            }
        });
        const attackRecordLabels = [];
        const attackDataBlocks = [];
        attacks.forEach((attack, attackIndex) => {
            const attackLabel = `${bossLabel}_attack_${attackIndex}`;
            attackRecordLabels.push(attackLabel);
            attackDataBlocks.push(`${attackLabel}:\n${renderAttackRecord(attack, spriteIndexById, tileIndexById, analysis, attackTileBankId)}`);
        });
        detailBlocks.push(`; ------------------------------------------------------------------`);
        detailBlocks.push(`; Boss ${originalIndex}: ${boss.name}`);
        if (pointerConfig) {
            detailBlocks.push(`${bossLabel}_DATA_BANK EQU ((${phaseTableLabel} - #4000) / ${pointerConfig.bankDivisorExpr})`);
        }
        detailBlocks.push(`; Boss attack definitions: ${allAttacks.length} defined, ${attacks.length} referenced`);
        if (bossMatrixDeduper.zeroWeakCellCount > 0) {
            detailBlocks.push(`; Shared empty weak-point matrix for this boss.`);
            detailBlocks.push(`${bossMatrixDeduper.zeroWeakLabel}:\n${chunkedDb(new Array(bossMatrixDeduper.zeroWeakCellCount).fill(0))}`);
        }
        detailBlocks.push(`${phaseTableLabel}:`);
        detailBlocks.push(phaseRecordLabels.length > 0 ? phaseRecordLabels.map(label => dw([bossDataPtr(label, pointerConfig)])).join('\n') : dw([EMPTY_REF]));
        detailBlocks.push(`${attackTableLabel}:`);
        detailBlocks.push(attackRecordLabels.length > 0 ? attackRecordLabels.map(label => dw([bossDataPtr(label, pointerConfig)])).join('\n') : dw([EMPTY_REF]));
        detailBlocks.push(...phaseDataBlocks);
        detailBlocks.push(...attackDataBlocks);
        detailBlocks.push(``);
    });
    return { bossTableRows, detailBlocks };
}
function estimateBossDataAsmBytes(asm) {
    return asm.split(/\r?\n/).reduce((total, line) => {
        const clean = line.split(';')[0].trim();
        if (!clean)
            return total;
        const dbMatch = clean.match(/^db\s+(.+)$/i);
        if (dbMatch) {
            return total + dbMatch[1].split(',').filter(token => token.trim().length > 0).length;
        }
        const dwMatch = clean.match(/^dw\s+(.+)$/i);
        if (dwMatch) {
            return total + (dwMatch[1].split(',').filter(token => token.trim().length > 0).length * 2);
        }
        const dsMatch = clean.match(/^ds\s+([^,]+)/i);
        if (dsMatch) {
            const value = dsMatch[1].trim();
            if (/^\d+$/.test(value)) {
                return total + parseInt(value, 10);
            }
            if (/^#([0-9a-f]+)$/i.test(value)) {
                return total + parseInt(value.slice(1), 16);
            }
        }
        return total;
    }, 0);
}
function generateBossDataBankSections(analysis, firstPhysicalBank, dataZoneSize, pointerConfig) {
    const allBosses = (analysis.bosses || []);
    const runtimeBossEntries = selectRuntimeBossEntries(analysis, allBosses);
    const bosses = runtimeBossEntries.map(entry => entry.boss);
    if (bosses.length === 0 || dataZoneSize <= 0) {
        return { asm: '', bankCount: 0 };
    }
    const runtimeFeatures = collectBossFeatureSet(bosses);
    const tileIndexById = buildIndexById(analysis.tiles || []);
    const spriteIndexById = buildIndexById(analysis.sprites || []);
    const bankSections = [];
    runtimeBossEntries.forEach((entry, bankOffset) => {
        const { detailBlocks } = renderBossDataSections(analysis, [entry], runtimeFeatures, tileIndexById, spriteIndexById, () => createBossMatrixDeduper(collectMaxBossWeakMatrixCellCount([entry.boss])), pointerConfig);
        const physicalBank = firstPhysicalBank + bankOffset;
        const orgAddress = 0x4000 + (physicalBank * dataZoneSize);
        const endAddress = orgAddress + dataZoneSize;
        const body = detailBlocks.join('\n').trimEnd();
        const bodyBytes = estimateBossDataAsmBytes(body);
        const orgHex = orgAddress.toString(16).toUpperCase().padStart(4, '0');
        const endHex = endAddress.toString(16).toUpperCase().padStart(4, '0');
        if (bodyBytes > dataZoneSize) {
            throw new Error(`MegaROM boss data bank overflow: ${entry.boss.name} uses ${bodyBytes} bytes, bank size is ${dataZoneSize}`);
        }
        bankSections.push(`    org #${orgHex}
; ==================================================================
; BOSS DATA BANK ${physicalBank} - ${entry.boss.name}
; One boss per mapper data bank so large bosses cannot overflow a shared bank.
; ==================================================================
${body}

    ds #${endHex} - $, #FF`);
    });
    return {
        asm: bankSections.join('\n\n'),
        bankCount: bankSections.length,
    };
}
/**
 * Generate bosses.asm.
 *
 * Register contract for generated routines:
 * - init_boss_system
 *   input: none
 *   output: boss_runtime_tick and boss_active reset to 0
 *   clobbers: A
 * - init_screen_boss_from_current_screen
 *   input: current_screen_boss_count/current_screen_boss_table RAM variables
 *   output: first enabled screen boss copied to runtime RAM and drawn to Name Table
 *   clobbers: AF, BC, DE, HL
 *   preserves: IX
 * - update_boss_system
 *   input: none
 *   output: boss_runtime_tick increments; active boss behavior is stepped and redrawn
 *   clobbers: AF, BC, DE, HL
 *   preserves: IX
 */
function generateBossesFile(analysis, options = {}) {
    const includeBossData = options.includeBossData ?? true;
    const allBosses = (analysis.bosses || []);
    const runtimeBossEntries = selectRuntimeBossEntries(analysis, allBosses);
    const bosses = runtimeBossEntries.map(entry => entry.boss);
    if (bosses.length === 0) {
        return `; ==================================================================
; BOSSES
; No boss assets in this project.
; ==================================================================

BOSS_COUNT EQU 0
BOSS_DIR_LEFT EQU 0
BOSS_DIR_RIGHT EQU 1
BOSS_DIR_UP EQU 2
BOSS_DIR_DOWN EQU 3
BOSS_ATTACK_PROJECTILE EQU 0
BOSS_ATTACK_MELEE EQU 1
BOSS_ATTACK_SPECIAL EQU 2
BOSS_ATTACK_PATTERN EQU 3
BOSS_ATTACK_METEOR EQU 4
BOSS_ATTACK_BOMB EQU 5
BOSS_ATTACK_BOOMERANG EQU 6
BOSS_ATTACK_ROCK EQU 7
BOSS_ATTACK_LASER EQU 8
BOSS_ATTACK_SINE_WAVE EQU 9
BOSS_ATTACK_HOMING_MISSILE EQU 10
BOSS_ATTACK_SLAM_ROCKS EQU 11
BOSS_ATTACK_FALLING_BLOCKS EQU 12

; @mideas:block id=runtime.boss.entry kind=routine owner=bosses roots=init_boss_system,update_boss_system
init_boss_system:
    xor a
    ld (boss_runtime_tick), a
    ld (boss_active), a
    ld (boss_health_lo), a
    ld (boss_health_hi), a
    ld (boss_hit_cooldown), a
    ld (boss_update_timer), a
    ld (boss_falling_blocks_active), a
    ld a, #FF
    ld (boss_data_bank), a
    ld a, 1
    ld (boss_update_interval), a
    ret

update_boss_system:
    ret

init_screen_boss_from_current_screen:
    ret
; @mideas:endblock id=runtime.boss.entry
`;
    }
    const runtimeFeatures = collectBossFeatureSet(bosses);
    const tileIndexById = buildIndexById(analysis.tiles || []);
    const spriteIndexById = buildIndexById(analysis.sprites || []);
    const lines = [];
    lines.push(`; ==================================================================`);
    lines.push(`; BOSSES`);
    lines.push(`; Generated boss data and project-aware runtime.`);
    lines.push(...renderBossFeatureSummary(runtimeFeatures));
    lines.push(`; ==================================================================`);
    lines.push(``);
    lines.push(`BOSS_COUNT EQU ${bosses.length}`);
    lines.push(`BOSS_DIR_LEFT EQU 0`);
    lines.push(`BOSS_DIR_RIGHT EQU 1`);
    lines.push(`BOSS_DIR_UP EQU 2`);
    lines.push(`BOSS_DIR_DOWN EQU 3`);
    lines.push(`BOSS_ATTACK_PROJECTILE EQU 0`);
    lines.push(`BOSS_ATTACK_MELEE EQU 1`);
    lines.push(`BOSS_ATTACK_SPECIAL EQU 2`);
    lines.push(`BOSS_ATTACK_PATTERN EQU 3`);
    lines.push(`BOSS_ATTACK_METEOR EQU 4`);
    lines.push(`BOSS_ATTACK_BOMB EQU 5`);
    lines.push(`BOSS_ATTACK_BOOMERANG EQU 6`);
    lines.push(`BOSS_ATTACK_ROCK EQU 7`);
    lines.push(`BOSS_ATTACK_LASER EQU 8`);
    lines.push(`BOSS_ATTACK_SINE_WAVE EQU 9`);
    lines.push(`BOSS_ATTACK_HOMING_MISSILE EQU 10`);
    lines.push(`BOSS_ATTACK_SLAM_ROCKS EQU 11`);
    lines.push(`BOSS_ATTACK_FALLING_BLOCKS EQU 12`);
    lines.push(``);
    lines.push(`; @mideas:block id=runtime.boss.entry kind=routine owner=bosses roots=init_boss_system,update_boss_system`);
    lines.push(`; Register Contract:`);
    lines.push(`; input: none`);
    lines.push(`; output: boss_runtime_tick and boss_active reset to 0`);
    lines.push(`; clobbers: A`);
    lines.push(`init_boss_system:`);
    lines.push(`    xor a`);
    lines.push(`    ld (boss_runtime_tick), a`);
    lines.push(`    ld (boss_active), a`);
    lines.push(`    ld (boss_health_lo), a`);
    lines.push(`    ld (boss_health_hi), a`);
    lines.push(`    ld (boss_hit_cooldown), a`);
    lines.push(`    ld (boss_visual_dirty), a`);
    if (usesBossAttack(runtimeFeatures, 'Projectile')) {
        lines.push(`    ld (boss_projectile_active), a`);
    }
    if (usesBossAttack(runtimeFeatures, 'SlamRocks')) {
        lines.push(`    ld (boss_slam_rocks_active), a`);
    }
    if (usesBossAttack(runtimeFeatures, 'FallingBlocks')) {
        lines.push(`    ld (boss_falling_blocks_active), a`);
    }
    lines.push(`    ld (boss_update_timer), a`);
    lines.push(`    ld a, #FF`);
    lines.push(`    ld (boss_data_bank), a`);
    lines.push(`    ld a, 1`);
    lines.push(`    ld (boss_update_interval), a`);
    lines.push(`    ret`);
    lines.push(``);
    lines.push(`; Register Contract:`);
    lines.push(`; input: none`);
    lines.push(`; output: boss_runtime_tick increments; active boss behavior is stepped and exposed old cells are restored only when moved`);
    lines.push(`; clobbers: AF, BC, DE, HL`);
    lines.push(`; preserves: IX`);
    lines.push(`update_boss_system:`);
    lines.push(`    push ix`);
    lines.push(`    ld a, (boss_runtime_tick)`);
    lines.push(`    inc a`);
    lines.push(`    ld (boss_runtime_tick), a`);
    lines.push(`    ld a, (boss_active)`);
    lines.push(`    or a`);
    lines.push(`    jp z, .ubs_done`);
    lines.push(`    ld a, (boss_update_timer)`);
    lines.push(`    or a`);
    lines.push(`    jp z, .ubs_update_due`);
    lines.push(`    dec a`);
    lines.push(`    ld (boss_update_timer), a`);
    lines.push(`    jp .ubs_done`);
    lines.push(`.ubs_update_due:`);
    lines.push(`    ld a, (boss_update_interval)`);
    lines.push(`    or a`);
    lines.push(`    jp nz, .ubs_update_interval_ok`);
    lines.push(`    ld a, 1`);
    lines.push(`    ld (boss_update_interval), a`);
    lines.push(`.ubs_update_interval_ok:`);
    lines.push(`    dec a`);
    lines.push(`    ld (boss_update_timer), a`);
    lines.push(`    call boss_push_data_bank`);
    lines.push(`    call update_boss_behavior`);
    if (usesBossAttack(runtimeFeatures, 'Projectile')) {
        lines.push(`    call update_boss_projectile_runtime`);
    }
    if (usesBossAttack(runtimeFeatures, 'SlamRocks')) {
        lines.push(`    call update_boss_slam_rocks_runtime`);
    }
    if (usesBossAttack(runtimeFeatures, 'FallingBlocks')) {
        lines.push(`    call update_boss_falling_blocks_runtime`);
    }
    lines.push(`    ld a, (boss_x_char)`);
    lines.push(`    ld b, a`);
    lines.push(`    ld a, (boss_prev_x_char)`);
    lines.push(`    cp b`);
    lines.push(`    jp nz, .ubs_redraw`);
    lines.push(`    ld a, (boss_y_char)`);
    lines.push(`    ld b, a`);
    lines.push(`    ld a, (boss_prev_y_char)`);
    lines.push(`    cp b`);
    lines.push(`    jp nz, .ubs_redraw`);
    lines.push(`    ld a, (boss_visual_dirty)`);
    lines.push(`    or a`);
    lines.push(`    jp z, .ubs_mapped_done`);
    lines.push(`.ubs_redraw:`);
    lines.push(`    call restore_active_boss_tiles_exposed`);
    lines.push(`    call draw_active_boss_tiles`);
    lines.push(`    xor a`);
    lines.push(`    ld (boss_visual_dirty), a`);
    lines.push(`    ld a, (boss_x_char)`);
    lines.push(`    ld (boss_prev_x_char), a`);
    lines.push(`    ld a, (boss_y_char)`);
    lines.push(`    ld (boss_prev_y_char), a`);
    lines.push(`.ubs_mapped_done:`);
    lines.push(`    call boss_pop_data_bank`);
    lines.push(`.ubs_done:`);
    lines.push(`    pop ix`);
    lines.push(`    ret`);
    lines.push(`; @mideas:endblock id=runtime.boss.entry`);
    lines.push(``);
    lines.push(renderBossRuntimeAsm(runtimeFeatures));
    lines.push(`boss_table:`);
    const { bossTableRows, detailBlocks } = includeBossData
        ? renderBossDataSections(analysis, runtimeBossEntries, runtimeFeatures, tileIndexById, spriteIndexById, () => createBossMatrixDeduper(collectMaxBossWeakMatrixCellCount(bosses)))
        : { bossTableRows: [], detailBlocks: [] };
    lines.push(...bossTableRows);
    lines.push(``);
    lines.push(...detailBlocks);
    return `${lines.join('\n')}\n`;
}
