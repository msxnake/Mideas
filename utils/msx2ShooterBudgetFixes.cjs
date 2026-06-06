'use strict';

const DEFAULT_SHOOTER_60HZ_FIX_ACTION =
  'Reduce shooter pools, switch IRQ profile, or defer this profile until OpenMSX profiling confirms spare frame time.';

const SHOOTER_60HZ_FIX_ACTIONS = {
  missing_irq_profile:
    'Pick a known IRQ profile in the Shooter 60Hz budget panel (for example IRQ_STAGE_NORMAL or IRQ_STAGE_SCROLL_EVEN).',
  sustained_irq_over_budget:
    'Switch to a lighter IRQ profile, reduce VRAM uploads, or defer this screen until OpenMSX profiling confirms spare frame time.',
  estimated_irq_over_budget:
    'Switch to a lighter IRQ profile or reduce HUD/palette burst work before keeping this profile at 60 Hz.',
  scroll_without_scroll_irq:
    'Switch the active IRQ profile to IRQ_STAGE_SCROLL_EVEN because tileVertical scroll requires scroll_row uploads every other frame.',
  boss_static_scroll_irq:
    'Switch to IRQ_BOSS or IRQ_STAGE_NORMAL; boss-static scroll should not pay for scroll_row uploads.',
  two_player_shot_pressure:
    'Reduce maxPlayerShots to 6 or less, or change playerMode away from twoPlayerLimited.',
  enemy_pool_pressure:
    'Reduce maxEnemies to 10 or less for the initial 60 Hz ASM budget.',
  enemy_shot_pressure:
    'Reduce maxEnemyShots to 16 or less, or defer this pool until OpenMSX profiling confirms spare frame time.',
  frame_rate_not_60hz:
    'Keep targetHz at 60; the MSX2 shooter runtime is locked to 60 frames/second on 60 Hz machines.',
};

function buildMsx2Shooter60HzSuggestedFix(item) {
  const code = String(item?.code || '');
  return {
    severity: item?.severity || 'warning',
    target: item?.screenId || code || 'shooter60Hz',
    reason: item?.message,
    action: SHOOTER_60HZ_FIX_ACTIONS[code] || DEFAULT_SHOOTER_60HZ_FIX_ACTION,
  };
}

function buildMsx2Shooter60HzSuggestedFixes(items) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map(item => buildMsx2Shooter60HzSuggestedFix(item));
}

module.exports = {
  buildMsx2Shooter60HzSuggestedFix,
  buildMsx2Shooter60HzSuggestedFixes,
};
