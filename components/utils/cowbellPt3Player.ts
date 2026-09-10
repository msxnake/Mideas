import { PT3AudioTransport } from './pt3AudioTransport';
type CowbellAudioElement = {
  duration?: number;
  currentTime: number;
  paused: boolean;
  play: () => void;
  pause: () => void;
  onloadedmetadata?: () => void;
  onplay?: () => void;
  onpause?: () => void;
  onended?: () => void;
  ontimeupdate?: () => void;
};

type CowbellTrack = {
  open: () => CowbellAudioElement;
  close?: () => void;
};

type CowbellAYChip = {
  setRegister: (register: number, value: number) => void;
  generate: (buffer: AudioBuffer, offset: number, length: number) => void;
};

type CowbellAYChipConstructor = new (opts: Record<string, unknown>) => CowbellAYChip;

type CowbellZXPT3Player = {
  Track: new (url: string, opts?: Record<string, unknown>) => CowbellTrack;
};

type CowbellGlobal = {
  Common?: {
    AYChip?: CowbellAYChipConstructor;
  };
  Player: {
    ZXPT3: new (opts?: Record<string, unknown>) => CowbellZXPT3Player;
  };
};

declare global {
  interface Window {
    Cowbell?: CowbellGlobal;
  }
}

const COWBELL_SCRIPT_PATHS = [
  '/vendor/cowbell/cowbell.min.js',
  '/vendor/cowbell/ay_chip.min.js',
  '/vendor/cowbell/zx.min.js',
];

type ChannelAudioCapture = (
  channelIndex: number,
  left: Float32Array,
  right: Float32Array,
  offset: number,
  length: number
) => void;

/**
 * Split one AY into three phase-locked Cowbell chips. Each clone receives the
 * same register stream but only keeps its own amplitude register. Their sum is
 * therefore the original AY output, while Mideas can inspect and mute A/B/C
 * independently without changing PT3 timing, noise or hardware-envelope state.
 */
export const createSeparatedCowbellAYChip = (
  OriginalChip: CowbellAYChipConstructor,
  opts: Record<string, unknown>,
  isMuted: (channelIndex: number) => boolean,
  onChannelAudio: ChannelAudioCapture
): CowbellAYChip => {
  const chips = [0, 1, 2].map(() => new OriginalChip(opts));
  let scratchLength = 0;
  let scratchChannels: Array<[Float32Array, Float32Array]> = [];

  const ensureScratchBuffers = (length: number): void => {
    if (scratchLength === length) return;
    scratchLength = length;
    scratchChannels = chips.map(() => [new Float32Array(length), new Float32Array(length)]);
  };

  return {
    setRegister(register, value) {
      chips.forEach((chip, channelIndex) => {
        const amplitudeChannel = register >= 8 && register <= 10 ? register - 8 : null;
        chip.setRegister(register, amplitudeChannel === null || amplitudeChannel === channelIndex ? value : 0);
      });
    },
    generate(buffer, offset, length) {
      ensureScratchBuffers(buffer.length);
      const end = Math.min(buffer.length, offset + length);

      chips.forEach((chip, channelIndex) => {
        const channelBuffers = scratchChannels[channelIndex];
        const scratchBuffer = {
          length: buffer.length,
          numberOfChannels: 2,
          getChannelData: (outputChannel: number) => channelBuffers[outputChannel],
        } as AudioBuffer;
        chip.generate(scratchBuffer, offset, length);
        onChannelAudio(channelIndex, channelBuffers[0], channelBuffers[1], offset, end - offset);
      });

      const outputLeft = buffer.getChannelData(0);
      const outputRight = buffer.getChannelData(1);
      for (let sampleIndex = offset; sampleIndex < end; sampleIndex += 1) {
        let left = 0;
        let right = 0;
        for (let channelIndex = 0; channelIndex < chips.length; channelIndex += 1) {
          if (isMuted(channelIndex)) continue;
          left += scratchChannels[channelIndex][0][sampleIndex];
          right += scratchChannels[channelIndex][1][sampleIndex];
        }
        outputLeft[sampleIndex] = left;
        outputRight[sampleIndex] = right;
      }
    },
  };
};

const installCowbellAYChannelTap = (
  cowbell: CowbellGlobal,
  isMuted: (channelIndex: number) => boolean,
  onChannelAudio: ChannelAudioCapture
): (() => void) => {
  const common = cowbell.Common;
  const OriginalChip = common?.AYChip;
  if (!common || typeof OriginalChip !== 'function') return () => undefined;

  const SeparatedChip = function (this: CowbellAYChip, opts: Record<string, unknown>) {
    return createSeparatedCowbellAYChip(OriginalChip, opts, isMuted, onChannelAudio);
  } as unknown as CowbellAYChipConstructor;
  common.AYChip = SeparatedChip;

  return () => {
    if (common.AYChip === SeparatedChip) common.AYChip = OriginalChip;
  };
};

let cowbellLoadPromise: Promise<CowbellGlobal> | null = null;

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cowbell-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.cowbellSrc = src;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
};

export const loadCowbell = async (): Promise<CowbellGlobal> => {
  if (window.Cowbell?.Player?.ZXPT3) {
    return window.Cowbell;
  }

  if (!cowbellLoadPromise) {
    cowbellLoadPromise = COWBELL_SCRIPT_PATHS.reduce<Promise<void>>(
      (promise, src) => promise.then(() => loadScript(src)),
      Promise.resolve()
    ).then(() => {
      if (!window.Cowbell?.Player?.ZXPT3) {
        throw new Error('Cowbell ZXPT3 backend is not available after loading scripts.');
      }
      return window.Cowbell;
    });
  }

  return cowbellLoadPromise;
};

export interface ExternalPT3PlaybackEvents {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number | null) => void;
  onLoadedMetadata?: (duration: number | null) => void;
}

export class CowbellPT3Player extends PT3AudioTransport {}
