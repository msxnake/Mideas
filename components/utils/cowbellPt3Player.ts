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

type CowbellZXPT3Player = {
  Track: new (url: string, opts?: Record<string, unknown>) => CowbellTrack;
};

type CowbellGlobal = {
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

export class CowbellPT3Player {
  private objectUrl: string | null = null;
  private track: CowbellTrack | null = null;
  private audioElement: CowbellAudioElement | null = null;

  constructor(
    private readonly bytes: Uint8Array,
    private readonly events: ExternalPT3PlaybackEvents = {}
  ) {}

  public async open(): Promise<void> {
    this.close();

    const cowbell = await loadCowbell();
    const blob = new Blob([this.bytes], { type: 'application/octet-stream' });
    this.objectUrl = URL.createObjectURL(blob);

    const player = new cowbell.Player.ZXPT3({
      ayFrequency: 1773400,
      commandFrequency: 50,
      stereoMode: 'ACB',
      ayMode: 'AY',
    });
    this.track = new player.Track(this.objectUrl, {
      ayFrequency: 1773400,
      commandFrequency: 50,
      stereoMode: 'ACB',
      ayMode: 'AY',
    });
    this.audioElement = this.track.open();
    this.bindEvents();
  }

  public async play(): Promise<void> {
    if (!this.audioElement) {
      await this.open();
    }
    this.audioElement?.play();
  }

  public pause(): void {
    this.audioElement?.pause();
  }

  public stop(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.events.onTimeUpdate?.(0, this.getDuration());
  }

  public seek(timeSeconds: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = Math.max(0, timeSeconds);
    this.events.onTimeUpdate?.(this.audioElement.currentTime, this.getDuration());
  }

  public close(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.track?.close?.();
    this.track = null;
    this.audioElement = null;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private bindEvents(): void {
    if (!this.audioElement) return;

    this.audioElement.onloadedmetadata = () => {
      this.events.onLoadedMetadata?.(this.getDuration());
    };
    this.audioElement.onplay = () => {
      this.events.onPlay?.();
    };
    this.audioElement.onpause = () => {
      this.events.onPause?.();
      this.events.onTimeUpdate?.(this.audioElement?.currentTime ?? 0, this.getDuration());
    };
    this.audioElement.onended = () => {
      this.events.onEnded?.();
    };
    this.audioElement.ontimeupdate = () => {
      this.events.onTimeUpdate?.(this.audioElement?.currentTime ?? 0, this.getDuration());
    };
  }

  private getDuration(): number | null {
    const duration = this.audioElement?.duration;
    return typeof duration === 'number' && Number.isFinite(duration) ? duration : null;
  }
}
