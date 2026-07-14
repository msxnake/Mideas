import assert from 'node:assert/strict';
import {
  SCC_CHANNEL_COUNT,
  SCC_CHANNEL_IDS,
  SCC_ENABLE_ADDRESS,
  SCC_ENABLE_VALUE,
  SCC_MIXER_ADDRESS,
  SCC_MIXER_MASK,
  SCC_ORIGINAL_SHARED_WAVEFORM_CHANNELS,
  SCC_PERIOD_BASE_ADDRESS,
  SCC_VOLUME_BASE_ADDRESS,
  SCC_WAVEFORM_BASE_ADDRESSES,
  SCC_WAVEFORM_SIZE,
  getSccPeriodRegisterPairForChannel,
  getSccVolumeRegisterForChannel,
  getSccWaveformAddressForChannel,
} from '../utils/audio/sccConstants.js';

assert.equal(SCC_CHANNEL_COUNT, 5, 'SCC original must expose five logical channels');
assert.equal(SCC_WAVEFORM_SIZE, 32, 'Each SCC waveform must have 32 samples');
assert.equal(SCC_ENABLE_ADDRESS, 0x9000, 'SCC enable address must remain #9000 for the minimal contract');
assert.equal(SCC_ENABLE_VALUE, 0x3f, 'SCC enable value must remain #3F');
assert.equal(SCC_MIXER_ADDRESS, 0x988f, 'SCC mixer register must remain #988F');
assert.equal(SCC_MIXER_MASK, 0x1f, 'Only SCC mixer bits 0..4 are valid in the minimal contract');
assert.equal(SCC_PERIOD_BASE_ADDRESS, 0x9880, 'SCC period registers start at #9880');
assert.equal(SCC_VOLUME_BASE_ADDRESS, 0x988a, 'SCC volume registers start at #988A');

assert.deepEqual(SCC_CHANNEL_IDS, ['1', '2', '3', '4', '5']);
assert.deepEqual(SCC_ORIGINAL_SHARED_WAVEFORM_CHANNELS, [4, 5]);
assert.deepEqual(SCC_WAVEFORM_BASE_ADDRESSES, {
  1: 0x9800,
  2: 0x9820,
  3: 0x9840,
  4: 0x9860,
  5: 0x9860,
});

for (let channel = 1; channel <= SCC_CHANNEL_COUNT; channel += 1) {
  const waveform = getSccWaveformAddressForChannel(channel);
  const period = getSccPeriodRegisterPairForChannel(channel);
  const volume = getSccVolumeRegisterForChannel(channel);

  assert.equal(waveform, SCC_WAVEFORM_BASE_ADDRESSES[channel], `Unexpected waveform base for channel ${channel}`);
  assert.equal(period.low, SCC_PERIOD_BASE_ADDRESS + ((channel - 1) * 2), `Unexpected period low for channel ${channel}`);
  assert.equal(period.high, period.low + 1, `Unexpected period high for channel ${channel}`);
  assert.equal(volume, SCC_VOLUME_BASE_ADDRESS + (channel - 1), `Unexpected volume register for channel ${channel}`);
}

assert.throws(() => getSccWaveformAddressForChannel(0), RangeError);
assert.throws(() => getSccWaveformAddressForChannel(6), RangeError);
assert.throws(() => getSccPeriodRegisterPairForChannel(1.5), RangeError);
assert.throws(() => getSccVolumeRegisterForChannel(-1), RangeError);

console.log('SCC constants contract OK');
