/**
 * Calcula el indice de patron SAT para sprites 16x16 MSX2.
 *
 * En MSX2 SCREEN 4, cada sprite 16x16 ocupa EXACTAMENTE 1 slot de patron en SAT.
 * stride = numero de layers (no layers*4).
 * layerOffset = indice de layer (no layerIndex*4).
 * mirrorOffset = layers * frames (no *4).
 */

export interface SatPatternParams {
  basePatternIndex: number;
  layerCount: number;
  frameCount: number;
  layerIndex: number;
  mirrorPatternOffset: number;
  authoredFacing?: 'left' | 'right';
  labelSuffix?: string;
  frameMapLabel?: string;
}

/**
 * Genera ASM para calcular el patron SAT de un sprite layer.
 *
 * Formula: pattern = base + animFrame * layerCount + layerIndex (+ mirrorOffset si aplica)
 *
 * DESTROYS: AF, B, DE, HL (depende del path)
 * PRESERVES: IX, IY
 */
export function buildSatPatternIndexAsm(params: SatPatternParams): string {
  const {
    basePatternIndex,
    layerCount,
    frameCount,
    layerIndex,
    mirrorPatternOffset,
    authoredFacing,
    labelSuffix = '0',
    frameMapLabel,
  } = params;

  const constantIndex = basePatternIndex + layerIndex;

  const baseAsm = frameCount <= 1 || layerCount <= 0
    ? `    ld a, ${constantIndex}`
    : frameMapLabel
      ? `    ld a, (msx2_player_anim_frame)
    ld hl, ${frameMapLabel}
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
${multiplyABy(layerCount)}    add a, ${constantIndex}`
      : `    ld a, (msx2_player_anim_frame)
${multiplyABy(layerCount)}    add a, ${constantIndex}`;

  if (!mirrorPatternOffset || !authoredFacing) {
    return baseAsm;
  }

  const jumpToBase = authoredFacing === 'right' ? 'z' : 'nz';
  return `${baseAsm}
    ld b, a
    ld a, (msx2_player_facing_dx)
    cp 1
    ld a, b
    jp ${jumpToBase}, .msx2_v2_pattern_base_${labelSuffix}
    add a, ${mirrorPatternOffset}
.msx2_v2_pattern_base_${labelSuffix}:`;
}

function multiplyABy(multiplier: number): string {
  if (multiplier <= 1) return '';
  if (multiplier === 2) return '    add a, a\n';
  if (multiplier === 4) return '    add a, a\n    add a, a\n';
  if (multiplier === 8) return '    add a, a\n    add a, a\n    add a, a\n';
  return `    ld b, a
    xor a
${Array.from({ length: multiplier }, () => '    add a, b\n').join('')}`;
}
