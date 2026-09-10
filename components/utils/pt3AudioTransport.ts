export interface PT3TransportEvents {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number, duration: number | null) => void;
  onLoadedMetadata?: (duration: number | null) => void;
  onLoop?: (iteration: number, revision: number) => void;
  onError?: (message: string) => void;
}

export interface PT3LoopRange { startFrame: number; endFrame: number }

/** Cowbell's PT3 decoder in a Worker; its AY emulator on the audio thread. */
export class PT3AudioTransport {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private worker: Worker | null = null;
  private opening: Promise<void> | null = null;
  private generation = 0;
  private playing = false;
  private duration = 0;
  private loop: PT3LoopRange | null = null;
  private mutedMask = 0;
  private requestId = 0;
  private newestRevision = 0;
  private appliedRevision = 0;
  private iteration = 0;
  private anchor = { frame: 0, contextTime: 0 };
  private pendingSeek: number | null = null;
  private scopes = [new Float32Array(1024), new Float32Array(1024), new Float32Array(1024)];
  private compiling = false;
  private queuedSnapshot: { bytes: Uint8Array; revision: number; resolve: (revision: number) => void; reject: (error: Error) => void } | null = null;
  private requests = new Map<number, { resolve: (log: ArrayBuffer) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();

  constructor(private readonly bytes: Uint8Array, private readonly events: PT3TransportEvents = {}) {}

  private decode(bytes: Uint8Array): Promise<ArrayBuffer> {
    if (!this.worker) return Promise.reject(new Error('El decodificador PT3 está cerrado.'));
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requests.delete(id);
        reject(new Error('La preparación del módulo PT3 ha excedido 30 segundos.'));
      }, 30000);
      this.requests.set(id, { resolve, reject, timer });
      const copy = bytes.slice();
      this.worker!.postMessage({ id, bytes: copy.buffer }, [copy.buffer]);
    });
  }

  public open(): Promise<void> {
    if (this.opening) return this.opening;
    if (this.node) return Promise.resolve();
    const generation = ++this.generation;
    const context = new AudioContext({ latencyHint: 'interactive' });
    this.context = context;
    void context.resume().catch(() => undefined); // play() awaits and reports a resume failure.
    this.worker = new Worker('/audio/pt3-decode-worker.js');
    this.worker.onmessage = ({ data }) => {
      const request = this.requests.get(data.id);
      if (!request) return;
      clearTimeout(request.timer); this.requests.delete(data.id);
      if (data.error) request.reject(new Error(data.error)); else request.resolve(data.log);
    };
    this.worker.onerror = event => {
      const error = new Error(event.message || 'No se pudo cargar el decodificador PT3.');
      for (const request of this.requests.values()) { clearTimeout(request.timer); request.reject(error); }
      this.requests.clear();
    };
    this.opening = (async () => {
      const [log] = await Promise.all([this.decode(this.bytes), context.audioWorklet.addModule('/audio/pt3-worklet.js')]);
      if (generation !== this.generation) throw new Error('Carga PT3 cancelada.');
      this.duration = log.byteLength / 15 / 50;
      const node = new AudioWorkletNode(context, 'mideas-pt3', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      this.node = node;
      node.onprocessorerror = () => this.events.onError?.('El procesador de audio PT3 ha fallado.');
      node.port.onmessage = ({ data }) => {
        if (generation !== this.generation) return;
        if (data.type === 'position') {
          this.anchor = { frame: data.frame, contextTime: data.contextTime };
          this.iteration = data.iteration; this.appliedRevision = data.revision;
          this.events.onTimeUpdate?.(this.getCurrentTime(), this.duration);
        } else if (data.type === 'scopes') this.scopes = data.scopes;
        else if (data.type === 'loop') {
          this.iteration = data.iteration; this.appliedRevision = data.revision;
          this.events.onLoop?.(data.iteration, data.revision);
        } else if (data.type === 'ended') {
          this.playing = false;
          this.anchor = { frame: this.duration * 50, contextTime: context.currentTime };
          this.events.onEnded?.();
        }
      };
      node.connect(context.destination);
      node.port.postMessage({ type: 'load', log, revision: 0 }, [log]);
      node.port.postMessage({ type: 'mute', mask: this.mutedMask });
      node.port.postMessage({ type: 'loop', range: this.loop });
      if (this.pendingSeek !== null) { this.seek(this.pendingSeek); this.pendingSeek = null; }
      this.events.onLoadedMetadata?.(this.duration);
    })().catch(error => {
      if (generation === this.generation) this.close();
      throw error;
    }).finally(() => { if (generation === this.generation) this.opening = null; });
    return this.opening;
  }

  public async play(): Promise<void> {
    await this.open();
    await this.context!.resume();
    if (!this.node || !this.context) return;
    if (this.anchor.frame >= this.duration * 50) this.seek(0);
    this.anchor = { frame: this.anchor.frame, contextTime: this.context.currentTime };
    this.playing = true; this.node.port.postMessage({ type: 'play' });
    this.events.onPlay?.();
  }

  public pause(): void {
    if (!this.playing) return;
    this.anchor = { frame: this.getCurrentTime() * 50, contextTime: this.context?.currentTime ?? 0 };
    this.playing = false; this.node?.port.postMessage({ type: 'pause' });
    this.events.onPause?.();
    this.events.onTimeUpdate?.(this.getCurrentTime(), this.duration);
  }

  public stop(): void { this.pause(); this.seek(0); }

  public getCurrentTime(): number {
    let frame = this.anchor.frame;
    if (this.playing && this.context) frame += Math.max(0, this.context.currentTime - this.anchor.contextTime) * 50;
    if (this.loop && frame >= this.loop.endFrame) {
      frame = this.loop.startFrame + (frame - this.loop.startFrame) % (this.loop.endFrame - this.loop.startFrame);
    }
    return Math.max(0, Math.min(frame / 50, this.duration));
  }

  public getLoopIteration(): number { return this.iteration; }
  public getAppliedRevision(): number { return this.appliedRevision; }

  public seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return;
    if (!this.node) { this.pendingSeek = seconds; return; }
    const frame = Math.max(0, Math.min(Math.floor(seconds * 50), this.duration * 50 - 1));
    this.anchor = { frame, contextTime: this.context?.currentTime ?? 0 }; this.iteration = 0;
    this.node.port.postMessage({ type: 'seek', frame });
    this.events.onTimeUpdate?.(frame / 50, this.duration);
  }

  public setLoopRange(range: PT3LoopRange | null): void {
    this.loop = range && range.endFrame > range.startFrame ? range : null;
    this.node?.port.postMessage({ type: 'loop', range: this.loop });
  }

  /** Compile asynchronously. A stale result can never replace a newer take. */
  public queueModule(bytes: Uint8Array): Promise<number> {
    const revision = ++this.newestRevision;
    return new Promise((resolve, reject) => {
      this.queuedSnapshot?.resolve(this.queuedSnapshot.revision);
      this.queuedSnapshot = { bytes, revision, resolve, reject };
      void this.compileLatest();
    });
  }

  private async compileLatest(): Promise<void> {
    if (this.compiling || !this.queuedSnapshot) return;
    const snapshot = this.queuedSnapshot;
    this.queuedSnapshot = null; this.compiling = true;
    const generation = this.generation;
    try {
      const log = await this.decode(snapshot.bytes);
      if (generation === this.generation && snapshot.revision === this.newestRevision && this.node) {
        this.node.port.postMessage({ type: 'queue', log, revision: snapshot.revision }, [log]);
      }
      snapshot.resolve(snapshot.revision);
    } catch (error) {
      snapshot.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.compiling = false;
      if (this.worker) void this.compileLatest();
    }
  }

  public getOscilloscopeSnapshot(): Float32Array[] { return this.scopes; }
  public setMutedChannels(channels: Iterable<string>): void {
    this.mutedMask = 0;
    for (const channel of channels) {
      const index = ['A', 'B', 'C'].indexOf(channel);
      if (index >= 0) this.mutedMask |= 1 << index;
    }
    this.node?.port.postMessage({ type: 'mute', mask: this.mutedMask });
  }

  public close(): void {
    this.generation++; this.playing = false;
    this.queuedSnapshot?.reject(new Error('Carga PT3 cancelada.')); this.queuedSnapshot = null;
    for (const request of this.requests.values()) { clearTimeout(request.timer); request.reject(new Error('Carga PT3 cancelada.')); }
    this.requests.clear(); this.worker?.terminate(); this.worker = null;
    this.node?.disconnect(); this.node?.port.close(); this.node = null;
    void this.context?.close(); this.context = null; this.opening = null;
  }
}
