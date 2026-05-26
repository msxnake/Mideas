import { Msx2IrqProfileBudget, Msx2IrqProfileId, Msx2ShooterRuntimeConfig } from '../types';

export interface Msx2ShooterBudgetIssue {
  severity: 'warning' | 'error';
  code: string;
  message: string;
}

export const MSX2_SHOOTER_IRQ_PROFILES_60HZ: Msx2IrqProfileBudget[] = [
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

const clampByte = (value: unknown, fallback: number, min = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(255, Math.floor(numeric)));
};

const normalizeProfileId = (value: unknown, fallback: Msx2IrqProfileId): Msx2IrqProfileId => {
  const id = String(value || '');
  return MSX2_SHOOTER_IRQ_PROFILES_60HZ.some(profile => profile.id === id)
    ? id as Msx2IrqProfileId
    : fallback;
};

export const createDefaultMsx2ShooterRuntimeConfig = (
  patch: Partial<Msx2ShooterRuntimeConfig> = {}
): Msx2ShooterRuntimeConfig => ({
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
    irqProfiles: MSX2_SHOOTER_IRQ_PROFILES_60HZ,
    ...(patch.budget || {}),
  },
});

export const normalizeMsx2ShooterRuntimeConfig = (
  config: Partial<Msx2ShooterRuntimeConfig> | null | undefined
): Msx2ShooterRuntimeConfig => {
  const defaults = createDefaultMsx2ShooterRuntimeConfig(config || {});
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
      activeIrqProfile,
      irqProfiles: MSX2_SHOOTER_IRQ_PROFILES_60HZ,
    },
  };
};

export const validateMsx2Shooter60HzBudget = (
  config: Partial<Msx2ShooterRuntimeConfig> | null | undefined
): Msx2ShooterBudgetIssue[] => {
  const shooter = normalizeMsx2ShooterRuntimeConfig(config);
  const issues: Msx2ShooterBudgetIssue[] = [];
  const activeProfile = shooter.budget.irqProfiles.find(profile => profile.id === shooter.budget.activeIrqProfile);

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
  } else if (activeProfile.estimatedCycles > activeProfile.maxAllowedCycles) {
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
