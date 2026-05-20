import React, { useEffect, useRef } from 'react';
import { TrackerChannelId } from '../../types';

interface OscilloscopeSource {
  getOscilloscopeSnapshot?: () => Float32Array[];
}

interface PsgOscilloscopePanelProps {
  channels: readonly TrackerChannelId[];
  mutedChannels: Set<TrackerChannelId>;
  synthesizer: OscilloscopeSource | null;
  isPlaying: boolean;
}

const SCOPE_WIDTH = 320;
const SCOPE_HEIGHT = 42;

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
  const width = canvas.clientWidth || SCOPE_WIDTH;
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
  ctx.fillText(String(channelId), 7, 13);

  if (!samples || samples.length < 2 || isMuted || !isPlaying) {
    ctx.strokeStyle = isMuted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(148, 163, 184, 0.28)';
    ctx.beginPath();
    ctx.moveTo(24, height / 2);
    ctx.lineTo(width - 5, height / 2);
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
}) => {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const latestPropsRef = useRef({ channels, mutedChannels, synthesizer, isPlaying });

  useEffect(() => {
    latestPropsRef.current = { channels, mutedChannels, synthesizer, isPlaying };
  }, [channels, mutedChannels, synthesizer, isPlaying]);

  useEffect(() => {
    let frameId = 0;

    const render = () => {
      const { channels: latestChannels, mutedChannels: latestMuted, synthesizer: latestSynth, isPlaying: latestPlaying } = latestPropsRef.current;
      const snapshots = latestSynth?.getOscilloscopeSnapshot?.();

      latestChannels.slice(0, 3).forEach((channelId, index) => {
        const canvas = canvasRefs.current[index];
        if (!canvas) return;
        drawScope(canvas, snapshots?.[index], channelId, latestMuted.has(channelId), latestPlaying);
      });

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="grid flex-shrink-0 grid-cols-3 gap-2 border-b border-msx-border bg-[#03070d] px-3 py-2">
      {channels.slice(0, 3).map((channelId, index) => (
        <div key={channelId} className="min-w-0 rounded border border-msx-border/70 bg-black/40 p-1">
          <canvas
            ref={element => { canvasRefs.current[index] = element; }}
            className="block h-[42px] w-full"
            aria-label={`Oscilloscope channel ${channelId}`}
          />
        </div>
      ))}
    </div>
  );
};
