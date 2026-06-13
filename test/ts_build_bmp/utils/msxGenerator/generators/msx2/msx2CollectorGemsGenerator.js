"use strict";
/**
 * MSX2 collector_gems skill generator (Z80 ASM).
 *
 * Passive skill: when the platform player picks up an effect-3 cell
 * (collectible) in `update_msx2_effect_state`, award `gemValue` points on
 * the shared 16-bit score (msx2_score_lo/hi) and optionally play a short
 * PSG blip through the existing `msx2_play_psg_sfx` helper.
 *
 * Unlike movement skills this one owns NO skill RAM: the score counter,
 * the collectible latch and the per-screen collected persistence already
 * exist in the base runtime, so the skill only injects code in the
 * `.collectible` branch (after the latch is set, before the
 * required-collectibles compare, so every gem scores even past the
 * exit requirement).
 *
 * Register-safety notes:
 *  - The hook runs after `clear_msx2_collectible_visual` (which already
 *    clobbers AF/BC/DE/HL), so no register needs preserving.
 *  - `msx2_play_psg_sfx` clobbers AF/B/HL only; the following
 *    `msx2_compare_collectibles_required` reloads everything it needs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_COLLECTOR_GEMS_RAM_BYTES = void 0;
exports.buildMsx2CollectorGemsCollectHookAsm = buildMsx2CollectorGemsCollectHookAsm;
exports.buildMsx2CollectorGemsSfxAsm = buildMsx2CollectorGemsSfxAsm;
/** collector_gems owns no skill RAM: score/latch live in the base runtime. */
exports.MSX2_COLLECTOR_GEMS_RAM_BYTES = 0;
function formatAsmByte(value) {
    const byte = Math.max(0, Math.min(255, Math.floor(Number(value) || 0)));
    return `#${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
/**
 * ASM injected inside `.collectible` (update_msx2_effect_state) right after
 * the collectible latch is set. Adds gemValue (16-bit) to the score and
 * refreshes the score HUD; optionally triggers the gem PSG blip.
 */
function buildMsx2CollectorGemsCollectHookAsm(config) {
    if (!config.enabled)
        return '';
    const gemValue = Math.max(1, Math.min(1000, Math.floor(Number(config.gemValue) || 100)));
    const lo = formatAsmByte(gemValue & 0xff);
    const hi = formatAsmByte((gemValue >> 8) & 0xff);
    const soundCall = config.collectSound
        ? `    call msx2_sfx_gem
`
        : '';
    return `    ; collector_gems skill: +${gemValue} points per gem (16-bit score add).
    ld a, (msx2_score_lo)
    add a, ${lo}
    ld (msx2_score_lo), a
    ld a, (msx2_score_hi)
    adc a, ${hi}
    ld (msx2_score_hi), a
    call draw_msx2_score_hud
${soundCall}`;
}
/**
 * Gem pickup PSG blip: high square tone on channel A with a fast envelope
 * decay. Emitted next to msx2_sfx_fire/msx2_sfx_hit so it shares
 * `msx2_play_psg_sfx`. The table sets BOTH envelope period bytes (11/12)
 * because the fire/hit tables leave stale values in whichever byte they
 * do not write.
 */
function buildMsx2CollectorGemsSfxAsm(config) {
    if (!config.enabled || !config.collectSound)
        return '';
    return `msx2_sfx_gem:
    ; collector_gems pickup blip. Clobbers AF/B/HL (msx2_play_psg_sfx).
    ld hl, msx2_sfx_gem_data
    ld b, 7
    jp msx2_play_psg_sfx

msx2_sfx_gem_data:
    db 7,#3E,0,#1C,1,#00,11,#28,12,#00,8,#10,13,#09

`;
}
