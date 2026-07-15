/**
 * Canonical SCC original register map and invariants for isolated tooling/tests.
 * Keep this module runtime-agnostic until the SCC backend is explicitly wired in.
 */

export const SCC_CHANNEL_COUNT = 5;
export const SCC_WAVEFORM_SIZE = 32;
export const SCC_ENABLE_ADDRESS = 0x9000;
export const SCC_ENABLE_VALUE = 0x3f;
export const SCC_MIXER_ADDRESS = 0x988f;
export const SCC_MIXER_MASK = 0x1f;
export const SCC_PERIOD_BASE_ADDRESS = 0x9880;
export const SCC_VOLUME_BASE_ADDRESS = 0x988a;

export const SCC_CHANNEL_IDS = Object.freeze(['1', '2', '3', '4', '5']);
export const SCC_ORIGINAL_SHARED_WAVEFORM_CHANNELS = Object.freeze([4, 5]);

export const SCC_WAVEFORM_BASE_ADDRESSES = Object.freeze({
  1: 0x9800,
  2: 0x9820,
  3: 0x9840,
  4: 0x9860,
  5: 0x9860,
});

function assertValidChannel(channel) {
  if (!Number.isInteger(channel) || channel < 1 || channel > SCC_CHANNEL_COUNT) {
    throw new RangeError(`SCC channel must be an integer between 1 and ${SCC_CHANNEL_COUNT}. Received: ${channel}`);
  }
}

export function getSccWaveformAddressForChannel(channel) {
  assertValidChannel(channel);
  return SCC_WAVEFORM_BASE_ADDRESSES[channel];
}

export function getSccPeriodRegisterPairForChannel(channel) {
  assertValidChannel(channel);
  const low = SCC_PERIOD_BASE_ADDRESS + ((channel - 1) * 2);
  return Object.freeze({ low, high: low + 1 });
}

export function getSccVolumeRegisterForChannel(channel) {
  assertValidChannel(channel);
  return SCC_VOLUME_BASE_ADDRESS + (channel - 1);
}
