"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMsx2Shooter60HzFrameBudgetSummary = exports.buildMsx2Shooter60HzConstantsAsm = exports.resolveMsx2Shooter60HzBudgetForGeneration = exports.validateMsx2Shooter60HzBudget = exports.normalizeMsx2ShooterRuntimeConfig = exports.createDefaultMsx2ShooterRuntimeConfig = exports.MSX2_SHOOTER_IRQ_PROFILE_NUMERIC_IDS = exports.MSX2_SHOOTER_IRQ_PROFILES_60HZ = void 0;
exports.resolveMsx2ShooterScrollRowRoutine = resolveMsx2ShooterScrollRowRoutine;
exports.buildMsx2Shooter60HzFrameDispatchAsm = buildMsx2Shooter60HzFrameDispatchAsm;
exports.buildMsx2ShooterMusicTickAsm = buildMsx2ShooterMusicTickAsm;
exports.buildMsx2ShooterHudDirtyTaskAsm = buildMsx2ShooterHudDirtyTaskAsm;
exports.buildMsx2ShooterPaletteSmallTaskAsm = buildMsx2ShooterPaletteSmallTaskAsm;
exports.MSX2_SHOOTER_IRQ_PROFILES_60HZ = [
    {
        id: 'IRQ_IDLE',
        estimatedCycles: 1800,
        worstCaseCycles: 2400,
        maxAllowedCycles: 3000,
        vramBytes: 0,
        frequency: 'everyFrame',
        sustained: true,
        tasks: ['input', 'music'],
    },
    {
        id: 'IRQ_STAGE_NORMAL',
        estimatedCycles: 3600,
        worstCaseCycles: 4800,
        maxAllowedCycles: 6000,
        vramBytes: 128,
        frequency: 'everyFrame',
        sustained: true,
        tasks: ['input', 'sat_upload_24', 'music'],
    },
    {
        id: 'IRQ_STAGE_SCROLL_EVEN',
        estimatedCycles: 5200,
        worstCaseCycles: 6400,
        maxAllowedCycles: 7000,
        vramBytes: 160,
        frequency: 'every2Frames',
        sustained: true,
        tasks: ['input', 'sat_upload_24', 'scroll_row', 'music'],
    },
    {
        id: 'IRQ_STAGE_SCROLL_ODD',
        estimatedCycles: 3600,
        worstCaseCycles: 4800,
        maxAllowedCycles: 6000,
        vramBytes: 128,
        frequency: 'every2Frames',
        sustained: true,
        tasks: ['input', 'sat_upload_24', 'music'],
    },
    {
        id: 'IRQ_HUD_DIRTY',
        estimatedCycles: 4200,
        worstCaseCycles: 5800,
        maxAllowedCycles: 6500,
        vramBytes: 144,
        frequency: 'burst',
        sustained: false,
        tasks: ['input', 'sat_upload_24', 'hud_dirty', 'music'],
    },
    {
        id: 'IRQ_PALETTE_FLASH',
        estimatedCycles: 3900,
        worstCaseCycles: 5200,
        maxAllowedCycles: 6200,
        vramBytes: 132,
        frequency: 'burst',
        sustained: false,
        tasks: ['input', 'sat_upload_24', 'palette_small', 'music'],
    },
    {
        id: 'IRQ_BOSS',
        estimatedCycles: 3600,
        worstCaseCycles: 5000,
        maxAllowedCycles: 6200,
        vramBytes: 128,
        frequency: 'everyFrame',
        sustained: true,
        tasks: ['input', 'sat_upload_24', 'music'],
    },
    {
        id: 'IRQ_TRANSITION_FADE',
        estimatedCycles: 2200,
        worstCaseCycles: 3600,
        maxAllowedCycles: 4500,
        vramBytes: 32,
        frequency: 'transitionOnly',
        sustained: false,
        tasks: ['palette_step', 'music'],
    },
];
exports.MSX2_SHOOTER_IRQ_PROFILE_NUMERIC_IDS = {
    IRQ_IDLE: 0,
    IRQ_STAGE_NORMAL: 1,
    IRQ_STAGE_SCROLL_EVEN: 2,
    IRQ_STAGE_SCROLL_ODD: 3,
    IRQ_HUD_DIRTY: 4,
    IRQ_PALETTE_FLASH: 5,
    IRQ_BOSS: 6,
    IRQ_TRANSITION_FADE: 7,
};
const clampByte = (value, fallback, min = 0) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return fallback;
    return Math.max(min, Math.min(255, Math.floor(numeric)));
};
const normalizeProfileId = (value, fallback) => {
    const id = String(value || '');
    return exports.MSX2_SHOOTER_IRQ_PROFILES_60HZ.some(profile => profile.id === id)
        ? id
        : fallback;
};
const createDefaultMsx2ShooterRuntimeConfig = (patch = {}) => ({
    direction: patch.direction || 'vertical',
    scrollMode: patch.scrollMode || 'tileVertical',
    playerMode: patch.playerMode || 'single',
    stageId: patch.stageId || '',
    waveSetId: patch.waveSetId || '',
    bossId: patch.bossId || '',
    hudMode: patch.hudMode || 'compactTop',
    budget: {
        targetHz: 60,
        maxEnemies: 8,
        maxPlayerShots: 6,
        maxEnemyShots: 12,
        maxPowerups: 2,
        maxExplosions: 4,
        maxBossParts: 5,
        activeIrqProfile: 'IRQ_STAGE_NORMAL',
        irqProfiles: exports.MSX2_SHOOTER_IRQ_PROFILES_60HZ,
        ...(patch.budget || {}),
    },
});
exports.createDefaultMsx2ShooterRuntimeConfig = createDefaultMsx2ShooterRuntimeConfig;
const normalizeMsx2ShooterRuntimeConfig = (config) => {
    const defaults = (0, exports.createDefaultMsx2ShooterRuntimeConfig)(config || {});
    const activeIrqProfile = normalizeProfileId(config?.budget?.activeIrqProfile, defaults.budget.activeIrqProfile);
    return {
        ...defaults,
        direction: config?.direction === 'horizontal' ? 'horizontal' : 'vertical',
        scrollMode: config?.scrollMode || defaults.scrollMode,
        playerMode: config?.playerMode || defaults.playerMode,
        hudMode: config?.hudMode || defaults.hudMode,
        budget: {
            ...defaults.budget,
            maxEnemies: clampByte(config?.budget?.maxEnemies, defaults.budget.maxEnemies, 1),
            maxPlayerShots: clampByte(config?.budget?.maxPlayerShots, defaults.budget.maxPlayerShots, 1),
            maxEnemyShots: clampByte(config?.budget?.maxEnemyShots, defaults.budget.maxEnemyShots, 1),
            maxPowerups: clampByte(config?.budget?.maxPowerups, defaults.budget.maxPowerups, 0),
            maxExplosions: clampByte(config?.budget?.maxExplosions, defaults.budget.maxExplosions, 0),
            maxBossParts: clampByte(config?.budget?.maxBossParts, defaults.budget.maxBossParts, 0),
            targetHz: 60,
            activeIrqProfile,
            irqProfiles: exports.MSX2_SHOOTER_IRQ_PROFILES_60HZ,
        },
    };
};
exports.normalizeMsx2ShooterRuntimeConfig = normalizeMsx2ShooterRuntimeConfig;
const validateMsx2Shooter60HzBudget = (config) => {
    const shooter = (0, exports.normalizeMsx2ShooterRuntimeConfig)(config);
    const issues = [];
    const activeProfile = shooter.budget.irqProfiles.find(profile => profile.id === shooter.budget.activeIrqProfile);
    if (Number(config?.budget?.targetHz ?? shooter.budget.targetHz) !== 60) {
        issues.push({
            severity: 'error',
            code: 'frame_rate_not_60hz',
            message: 'Shooter 60Hz contract requires targetHz=60; other frame rates are not supported in this runtime path.',
        });
    }
    if (!activeProfile) {
        issues.push({
            severity: 'error',
            code: 'missing_irq_profile',
            message: `Unknown IRQ profile ${shooter.budget.activeIrqProfile}.`,
        });
        return issues;
    }
    if (activeProfile.sustained && activeProfile.worstCaseCycles > activeProfile.maxAllowedCycles) {
        issues.push({
            severity: 'error',
            code: 'sustained_irq_over_budget',
            message: `${activeProfile.id} worst case ${activeProfile.worstCaseCycles} cycles exceeds ${activeProfile.maxAllowedCycles}.`,
        });
    }
    else if (activeProfile.estimatedCycles > activeProfile.maxAllowedCycles) {
        issues.push({
            severity: 'warning',
            code: 'estimated_irq_over_budget',
            message: `${activeProfile.id} estimate ${activeProfile.estimatedCycles} cycles exceeds ${activeProfile.maxAllowedCycles}.`,
        });
    }
    if (shooter.scrollMode === 'tileVertical' && !activeProfile.tasks.includes('scroll_row')) {
        issues.push({
            severity: 'warning',
            code: 'scroll_without_scroll_irq',
            message: 'Tile vertical scroll is selected but the active IRQ profile does not upload a scroll row.',
        });
    }
    if (shooter.scrollMode === 'bossStatic' && activeProfile.tasks.includes('scroll_row')) {
        issues.push({
            severity: 'warning',
            code: 'boss_static_scroll_irq',
            message: 'Boss-static scroll should not spend IRQ time on scroll rows.',
        });
    }
    if (shooter.playerMode === 'twoPlayerLimited' && shooter.budget.maxPlayerShots > 6) {
        issues.push({
            severity: 'warning',
            code: 'two_player_shot_pressure',
            message: 'Two-player limited mode should keep total player shots at 6 or less for 60 Hz.',
        });
    }
    if (shooter.budget.maxEnemies > 10) {
        issues.push({
            severity: 'warning',
            code: 'enemy_pool_pressure',
            message: 'More than 10 active enemies is risky for the initial 60 Hz ASM budget.',
        });
    }
    if (shooter.budget.maxEnemyShots > 16) {
        issues.push({
            severity: 'warning',
            code: 'enemy_shot_pressure',
            message: 'More than 16 enemy shots should wait until ROM profiling confirms spare frame time.',
        });
    }
    return issues;
};
exports.validateMsx2Shooter60HzBudget = validateMsx2Shooter60HzBudget;
const resolveMsx2Shooter60HzBudgetForGeneration = (config) => {
    const normalized = (0, exports.normalizeMsx2ShooterRuntimeConfig)(config);
    const activeProfile = normalized.budget.irqProfiles.find(profile => profile.id === normalized.budget.activeIrqProfile);
    if (normalized.scrollMode === 'tileVertical'
        && activeProfile
        && !activeProfile.tasks.includes('scroll_row')) {
        return (0, exports.normalizeMsx2ShooterRuntimeConfig)({
            ...normalized,
            budget: {
                ...normalized.budget,
                activeIrqProfile: 'IRQ_STAGE_SCROLL_EVEN',
            },
        });
    }
    if (normalized.scrollMode === 'bossStatic'
        && activeProfile
        && activeProfile.tasks.includes('scroll_row')) {
        return (0, exports.normalizeMsx2ShooterRuntimeConfig)({
            ...normalized,
            budget: {
                ...normalized.budget,
                activeIrqProfile: 'IRQ_BOSS',
            },
        });
    }
    return normalized;
};
exports.resolveMsx2Shooter60HzBudgetForGeneration = resolveMsx2Shooter60HzBudgetForGeneration;
const buildMsx2Shooter60HzConstantsAsm = (config) => {
    const shooter = (0, exports.resolveMsx2Shooter60HzBudgetForGeneration)(config);
    const profileId = exports.MSX2_SHOOTER_IRQ_PROFILE_NUMERIC_IDS[shooter.budget.activeIrqProfile];
    const activeProfile = shooter.budget.irqProfiles.find(profile => profile.id === shooter.budget.activeIrqProfile);
    const maxFrameCycles = activeProfile?.maxAllowedCycles ?? 6000;
    return `; MSX2 shooter 60Hz contract sourced from screen.runtime.shooter
MSX2_SHOOTER60HZ_TARGET_HZ EQU 60
MSX2_SHOOTER60HZ_MAX_ENEMIES EQU ${shooter.budget.maxEnemies}
MSX2_SHOOTER60HZ_MAX_PLAYER_SHOTS EQU ${shooter.budget.maxPlayerShots}
MSX2_SHOOTER60HZ_MAX_ENEMY_SHOTS EQU ${shooter.budget.maxEnemyShots}
MSX2_SHOOTER60HZ_MAX_POWERUPS EQU ${shooter.budget.maxPowerups}
MSX2_SHOOTER60HZ_MAX_EXPLOSIONS EQU ${shooter.budget.maxExplosions}
MSX2_SHOOTER60HZ_MAX_BOSS_PARTS EQU ${shooter.budget.maxBossParts}
MSX2_SHOOTER60HZ_MAX_FRAME_CYCLES EQU ${maxFrameCycles}    ; ${shooter.budget.activeIrqProfile} sustained budget
MSX2_SHOOTER60HZ_ACTIVE_IRQ_PROFILE EQU ${profileId}    ; ${shooter.budget.activeIrqProfile}`;
};
exports.buildMsx2Shooter60HzConstantsAsm = buildMsx2Shooter60HzConstantsAsm;
const buildMsx2Shooter60HzFrameBudgetSummary = (config, options = {}) => {
    if (!config)
        return null;
    const shooter = (0, exports.resolveMsx2Shooter60HzBudgetForGeneration)(config);
    const profile = shooter.budget.irqProfiles.find(entry => entry.id === shooter.budget.activeIrqProfile);
    if (!profile)
        return null;
    const maxFrameCycles = profile.maxAllowedCycles;
    const estimatedHeadroomCycles = maxFrameCycles - profile.estimatedCycles;
    const worstCaseHeadroomCycles = maxFrameCycles - profile.worstCaseCycles;
    let frameBudgetStatus = 'ok';
    if (profile.sustained && profile.worstCaseCycles > maxFrameCycles) {
        frameBudgetStatus = 'error';
    }
    else if (profile.estimatedCycles > maxFrameCycles) {
        frameBudgetStatus = 'warning';
    }
    return {
        targetHz: 60,
        activeIrqProfile: shooter.budget.activeIrqProfile,
        maxFrameCycles,
        estimatedCycles: profile.estimatedCycles,
        worstCaseCycles: profile.worstCaseCycles,
        estimatedHeadroomCycles,
        worstCaseHeadroomCycles,
        frameBudgetStatus,
        scrollRowRoutine: options.scrollRowRoutine,
    };
};
exports.buildMsx2Shooter60HzFrameBudgetSummary = buildMsx2Shooter60HzFrameBudgetSummary;
function resolveMsx2ShooterScrollRowRoutine(shooter, options = {}) {
    const verticalScrollRow = shooter.scrollMode === 'tileVertical'
        || options.movementMode === 'shooterVertical';
    return verticalScrollRow && shooter.direction !== 'horizontal'
        ? 'update_msx2_shooter_scroll_row'
        : 'update_msx2_bg_scroll';
}
function buildMsx2Shooter60HzFrameDispatchAsm(options) {
    const scrollRowRoutine = options.scrollRowRoutine || 'update_msx2_bg_scroll';
    const profile = options.shooter.budget.irqProfiles.find(entry => entry.id === options.shooter.budget.activeIrqProfile);
    const profileLabel = options.shooter.budget.activeIrqProfile;
    const tasks = profile?.tasks ?? [];
    const scrollRowTask = Boolean(options.backgroundScrollEnabled
        && tasks.includes('scroll_row'));
    const scrollRowEvenFramesOnly = scrollRowTask && profile?.frequency === 'every2Frames';
    const satUploadTask = Boolean(options.hardwareSprites && tasks.includes('sat_upload_24'));
    const musicTask = tasks.includes('music');
    const hudDirtyTask = tasks.includes('hud_dirty');
    const paletteTask = tasks.includes('palette_small');
    const beginLines = [
        `update_msx2_shooter60hz_frame:`,
        `    ; Shooter 60Hz profile ${profileLabel} pre-update tasks (compile-time).`,
        `    ld a, (msx2_runtime_frame_counter)`,
        `    inc a`,
        `    ld (msx2_runtime_frame_counter), a`,
    ];
    if (scrollRowEvenFramesOnly) {
        beginLines.push(`    and 1`, `    ret nz`, `    jp ${scrollRowRoutine}`);
    }
    else if (scrollRowTask) {
        beginLines.push(`    jp ${scrollRowRoutine}`);
    }
    beginLines.push(`    ret`, '');
    const endLines = [
        `update_msx2_shooter60hz_present_frame:`,
        `    ; Shooter 60Hz profile ${profileLabel} post-update tasks (compile-time).`,
    ];
    if (satUploadTask) {
        if (options.pushBoxEnabled) {
            endLines.push(`    call update_msx2_box2_boxes`);
        }
        endLines.push(`    call write_hardware_sprite_attrs`);
    }
    if (hudDirtyTask) {
        endLines.push(`    call msx2_shooter_hud_dirty_task`);
    }
    if (paletteTask) {
        endLines.push(`    call msx2_shooter_palette_small_task`);
    }
    if (musicTask) {
        endLines.push(`    call ${options.snakeMusic ? 'update_msx2_snake_music' : 'update_msx2_shooter_music_tick'}`);
    }
    endLines.push(`    ret`, '');
    return `${[...beginLines, ...endLines].join('\n')}`;
}
;
function buildMsx2ShooterMusicTickAsm(options = {}) {
    if (options.snakeMusic) {
        return '';
    }
    return `update_msx2_shooter_music_tick:
    ; Coarse music scheduler (~10 Hz at 60 fps) for shooter IRQ budget.
    ld a, (msx2_music_tick)
    inc a
    ld (msx2_music_tick), a
    cp 6
    ret c
    xor a
    ld (msx2_music_tick), a
    ret

`;
}
function buildMsx2ShooterHudDirtyTaskAsm(options = {}) {
    if (!options.enabled) {
        return '';
    }
    return `msx2_shooter_hud_dirty_task:
    ld a, (msx2_hud_dirty_flag)
    or a
    ret z
    xor a
    ld (msx2_hud_dirty_flag), a
    call draw_msx2_lives_hud
    call draw_msx2_score_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    ret

`;
}
function buildMsx2ShooterPaletteSmallTaskAsm(options = {}) {
    if (!options.enabled) {
        return '';
    }
    return `msx2_shooter_palette_small_task:
    ; Small palette flash hook for IRQ_PALETTE_FLASH profile.
    ret

`;
}
