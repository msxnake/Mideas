/** A softer touch reaches higher AY volume without losing velocity dynamics. */
export function midiVelocityToTrackerVolume(
  velocity: number,
  sensitivity: number,
  /**
   * Volume a note gets no matter how softly it was played, 1..15.
   *
   * The AY volume register is 4 bits and its low half is barely audible, so a
   * light touch mapped straight onto 1..15 lands somewhere nobody can hear.
   * Rather than clamp the curve -- which would flatten every soft note onto the
   * same value and throw the dynamics away -- the curve is spread across
   * `minimumVolume`..15, so a gentle press is quiet relative to a hard one while
   * still being audible.
   */
  minimumVolume = 1,
): number {
  const normalized = Math.max(1, Math.min(127, velocity)) / 127;
  const curved = Math.pow(normalized, 1 / sensitivity);
  const floor = Math.max(1, Math.min(15, Math.round(minimumVolume)));
  // No floor asked for: keep the original mapping exactly, so existing songs and
  // saved settings keep behaving the way they were dialled in.
  if (floor <= 1) return Math.max(1, Math.min(15, Math.round(15 * curved)));
  return Math.max(floor, Math.min(15, floor + Math.round((15 - floor) * curved)));
}
