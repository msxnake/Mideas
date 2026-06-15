import React from 'react';
import { Panel } from '../common/Panel';
import { MusicNoteIcon } from '../icons/MsxIcons';
import type { UseMidiInputReturn, MidiLastMessage } from '../../utils/useMidiInput';

/**
 * Describes how an incoming MIDI note targets a tracker channel.
 * - `follow`: write at the currently focused cell (cursor).
 * - `fixed`: always write to a fixed channel index.
 * @category Tracker
 */
export type MidiChannelMode = 'follow' | 'fixed';

/**
 * Props for the {@link MidiInputPanel} component.
 * @category Tracker
 */
interface MidiInputPanelProps {
  /** The MIDI input hook state/handlers. */
  midi: UseMidiInputReturn;
  /** Octave offset applied to incoming MIDI notes. */
  octaveOffset: number;
  onOctaveOffsetChange: (value: number) => void;
  /** Channel targeting mode. */
  channelMode: MidiChannelMode;
  onChannelModeChange: (mode: MidiChannelMode) => void;
  /** Fixed channel index (used when channelMode === 'fixed'). */
  fixedChannelIndex: number;
  onFixedChannelIndexChange: (index: number) => void;
  /** Channel id labels for the fixed-channel selector. */
  channelLabels: string[];
}

const formatMessage = (msg: MidiLastMessage | null): string => {
  if (!msg) return '--';
  switch (msg.type) {
    case 'noteon':
      return `Note On  n${msg.note} v${msg.velocity}`;
    case 'noteoff':
      return `Note Off n${msg.note}`;
    case 'cc':
      return `CC ${msg.cc} = ${msg.value}`;
    default:
      return `[${msg.raw.map(b => b.toString(16).padStart(2, '0')).join(' ')}]`;
  }
};

const STATUS_LABEL: Record<UseMidiInputReturn['status'], string> = {
  unsupported: 'Not supported',
  idle: 'Idle',
  requesting: 'Requesting...',
  denied: 'Access denied',
  ready: 'Ready',
};

const STATUS_COLOR: Record<UseMidiInputReturn['status'], string> = {
  unsupported: 'text-red-400',
  idle: 'text-msx-textsecondary',
  requesting: 'text-yellow-300',
  denied: 'text-red-400',
  ready: 'text-green-400',
};

/**
 * A panel for configuring MIDI input (e.g. Akai MPK Mini MK3) for the tracker.
 *
 * Lets the user enable/disable MIDI, pick the input device, set an octave
 * offset, choose channel-targeting behaviour, and shows the last received
 * message for debugging.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const MidiInputPanel: React.FC<MidiInputPanelProps> = ({
  midi,
  octaveOffset,
  onOctaveOffsetChange,
  channelMode,
  onChannelModeChange,
  fixedChannelIndex,
  onFixedChannelIndexChange,
  channelLabels,
}) => {
  const {
    supported, status, enabled, setEnabled, inputs, selectedInputId, selectInput, lastMessage,
  } = midi;

  return (
    <Panel title="MIDI Input" icon={<MusicNoteIcon />} bodyClassName="p-2">
      <div className="space-y-2 text-[0.65rem]">
        {!supported && (
          <p className="rounded border border-red-500/50 bg-red-500/10 p-1 text-red-300">
            Web MIDI not available in this browser. Use Chrome or Edge over http://localhost.
          </p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-msx-accent"
              checked={enabled}
              disabled={!supported}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>Enable MIDI</span>
          </label>
          <span className={`font-mono ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wider text-msx-textsecondary">Device</span>
          <select
            className="rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 font-mono text-msx-textprimary disabled:opacity-50"
            value={selectedInputId ?? ''}
            disabled={!enabled || inputs.length === 0}
            onChange={(e) => selectInput(e.target.value || null)}
          >
            {inputs.length === 0 && <option value="">No devices found</option>}
            {inputs.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="uppercase tracking-wider text-msx-textsecondary">Octave offset</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded border border-msx-border bg-msx-bgcolor px-1.5 leading-none text-msx-textprimary hover:border-msx-highlight"
              onClick={() => onOctaveOffsetChange(Math.max(-4, octaveOffset - 1))}
            >-</button>
            <span className="w-6 text-center font-mono text-msx-highlight">{octaveOffset > 0 ? `+${octaveOffset}` : octaveOffset}</span>
            <button
              type="button"
              className="rounded border border-msx-border bg-msx-bgcolor px-1.5 leading-none text-msx-textprimary hover:border-msx-highlight"
              onClick={() => onOctaveOffsetChange(Math.min(4, octaveOffset + 1))}
            >+</button>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wider text-msx-textsecondary">Target channel</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                className="accent-msx-accent"
                checked={channelMode === 'follow'}
                onChange={() => onChannelModeChange('follow')}
              />
              <span>Follow cursor</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                className="accent-msx-accent"
                checked={channelMode === 'fixed'}
                onChange={() => onChannelModeChange('fixed')}
              />
              <span>Fixed</span>
            </label>
          </div>
          {channelMode === 'fixed' && (
            <select
              className="mt-1 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 font-mono text-msx-textprimary"
              value={fixedChannelIndex}
              onChange={(e) => onFixedChannelIndexChange(parseInt(e.target.value, 10) || 0)}
            >
              {channelLabels.map((label, idx) => (
                <option key={idx} value={idx}>Channel {label}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-0.5 border-t border-msx-border/60 pt-1">
          <span className="uppercase tracking-wider text-msx-textsecondary">Last message</span>
          <span className="truncate rounded bg-black/30 px-1 py-0.5 font-mono text-msx-highlight">
            {formatMessage(lastMessage)}
          </span>
        </div>
      </div>
    </Panel>
  );
};
