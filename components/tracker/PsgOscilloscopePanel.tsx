import React, { useEffect, useRef } from 'react';
import { TrackerChannelId } from '../../types';
import { EraserIcon } from '../icons/MsxIcons';

interface OscilloscopeSource {
  getOscilloscopeSnapshot?: () => Float32Array[];
}

interface PsgOscilloscopePanelProps {
  channels: readonly TrackerChannelId[];
  mutedChannels: Set<TrackerChannelId>;
  synthesizer: OscilloscopeSource | null;
  isPlaying: boolean;
  /** PT3 source rows add the FX/CMD field to every channel column. */
  sourcePT3Mode?: boolean;
  /** The pattern grid's scrolling container. The scope strip mirrors its
   *  horizontal scroll so each scope stays above its channel column. */
  gridScrollRef?: React.RefObject<HTMLDivElement>;
  /** Clicking a scope toggles that channel's mute state. */
  onToggleMute?: (channelId: TrackerChannelId) => void;
  /** Clears every cell of that channel in the current pattern. */
  onClearChannel?: (channelId: TrackerChannelId) => void;
}

// Must mirror PatternEditorGrid's layout so each scope sits exactly above its
// channel column:
//   Row column   = w-12                                    -> 48px
//   Channel col  = border-l-4 + px-1 + w-10 + w-7*3        -> 4 + 8 + 40 + 84 = 136px
const ROW_COLUMN_WIDTH_PX = 48;
const CHANNEL_COLUMN_WIDTH_PX = 136;
const SOURCE_PT3_COMMAND_WIDTH_PX = 128;

// Same per-channel left accent colours as PatternEditorGrid, kept in sync so
// the scope strip visually joins the column headers below it.
const CHANNEL_ACCENTS = [
  'border-l-emerald-400/80',
  'border-l-sky-400/80',
  'border-l-amber-300/80',
  'border-l-fuchsia-400/80',
  'border-l-rose-400/80',
] as const;

const SCOPE_HEIGHT = 42;

// Draw a small speaker-with-slash "muted" glyph centred in the scope so the
// mute state is readable at a glance inside the window itself.
const drawMuteIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.fillStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';

  // Speaker body: a rectangle mouth + triangular cone.
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 3);
  ctx.lineTo(cx - 4, cy - 3);
  ctx.lineTo(cx, cy - 7);
  ctx.lineTo(cx, cy + 7);
  ctx.lineTo(cx - 4, cy + 3);
  ctx.lineTo(cx - 8, cy + 3);
  ctx.closePath();
  ctx.fill();

  // Diagonal slash across the speaker.
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 6);
  ctx.lineTo(cx + 10, cy + 6);
  ctx.stroke();
  ctx.restore();
};

const drawScope = (
  canvas: HTMLCanvasElement,
  samples: Float32Array | undefined,
  channelId: TrackerChannelId,
  isMuted: boolean,
  isPlaying: boolean
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || CHANNEL_COLUMN_WIDTH_PX;
  const height = canvas.clientHeight || SCOPE_HEIGHT;
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.fillStyle = isMuted ? '#ef4444' : '#22c55e';
  ctx.font = '10px monospace';
  ctx.fillText(String(channelId), 5, 12);

  if (isMuted) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 4, height / 2);
    ctx.stroke();
    drawMuteIcon(ctx, width / 2, height / 2);
    return;
  }

  if (!samples || samples.length < 2 || !isPlaying) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 4, height / 2);
    ctx.stroke();
    return;
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
  }

  const center = sum / samples.length;
  const span = Math.max(max - min, 0.004);
  const gain = (height * 0.72) / span;
  const xStep = width / (samples.length - 1);

  ctx.strokeStyle = '#67e8f9';
  ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
  ctx.shadowBlur = 5;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const x = i * xStep;
    const y = (height / 2) - ((samples[i] - center) * gain);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
};

export const PsgOscilloscopePanel: React.FC<PsgOscilloscopePanelProps> = ({
  channels,
  mutedChannels,
  synthesizer,
  isPlaying,
  sourcePT3Mode = false,
  gridScrollRef,
  onToggleMute,
  onClearChannel,
}) => {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const latestPropsRef = useRef({ channels, mutedChannels, synthesizer, isPlaying });
  const channelColumnWidth = CHANNEL_COLUMN_WIDTH_PX
    + (sourcePT3Mode ? SOURCE_PT3_COMMAND_WIDTH_PX : 0);

  useEffect(() => {
    latestPropsRef.current = { channels, mutedChannels, synthesizer, isPlaying };
  }, [channels, mutedChannels, synthesizer, isPlaying]);

  // Scope drawing loop.
  useEffect(() => {
    let frameId = 0;

    const render = () => {
      const { channels: latestChannels, mutedChannels: latestMuted, synthesizer: latestSynth, isPlaying: latestPlaying } = latestPropsRef.current;
      const snapshots = latestSynth?.getOscilloscopeSnapshot?.();

      latestChannels.forEach((channelId, index) => {
        const canvas = canvasRefs.current[index];
        if (!canvas) return;
        drawScope(canvas, snapshots?.[index], channelId, latestMuted.has(channelId), latestPlaying);
      });

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  // Mirror the pattern grid's horizontal scroll so every scope tracks its
  // channel column as the user scrolls the pattern sideways.
  useEffect(() => {
    const scroller = gridScrollRef?.current;
    const strip = stripRef.current;
    if (!scroller || !strip) return;

    const sync = () => {
      strip.style.transform = `translateX(${-scroller.scrollLeft}px)`;
    };
    sync();
    scroller.addEventListener('scroll', sync, { passive: true });
    return () => scroller.removeEventListener('scroll', sync);
  }, [gridScrollRef, channels.length]);

  return (
    <div className="flex-shrink-0 overflow-hidden border-b border-msx-border bg-[#03070d]">
      <div ref={stripRef} className="flex will-change-transform">
        {/* Row-number column spacer: keeps scopes aligned with channel columns. */}
        <div
          className="flex-shrink-0 border-r border-msx-border/45"
          style={{ width: ROW_COLUMN_WIDTH_PX }}
        />
        {channels.map((channelId, index) => {
          const isMuted = mutedChannels.has(channelId);
          return (
            <div
              key={channelId}
              className={`relative box-border flex-shrink-0 border-l-4 ${CHANNEL_ACCENTS[index % CHANNEL_ACCENTS.length]} px-1 py-1`}
              style={{ width: channelColumnWidth }}
            >
              <canvas
                ref={element => { canvasRefs.current[index] = element; }}
                onClick={onToggleMute ? () => onToggleMute(channelId) : undefined}
                className={`block h-[42px] w-full rounded-sm border bg-black/40 ${onToggleMute ? 'cursor-pointer' : ''} ${isMuted ? 'border-red-500/70' : 'border-msx-border/60 hover:border-msx-highlight/60'}`}
                aria-label={`Oscilloscope channel ${channelId}${isMuted ? ' (muted)' : ''}`}
                title={onToggleMute ? `Canal ${channelId}: clic para ${isMuted ? 'activar' : 'silenciar'}` : undefined}
              />
              {onClearChannel && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClearChannel(channelId); }}
                  className="absolute right-1 top-1 rounded-sm border border-msx-border/60 bg-black/60 p-0.5 text-msx-textsecondary opacity-70 transition-colors hover:border-red-500/70 hover:text-red-400 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500/60"
                  title={`Borrar el contenido del canal ${channelId} en este patrón`}
                  aria-label={`Clear channel ${channelId}`}
                >
                  <EraserIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
