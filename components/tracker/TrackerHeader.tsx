import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { PlayIcon, StopIcon, ListBulletIcon, CheckCircleIcon, MusicNoteIcon, SoundIcon } from '../icons/MsxIcons';
import { DEFAULT_PT3_ROWS_PER_PATTERN } from '../../constants';
import { TrackerChannelId } from '../../types';

/**
 * Props for the {@link TrackerHeader} component.
 * @category Tracker
 */
interface TrackerHeaderProps {
  /** The name of the song asset. */
  songName: string;
  /** Callback to update the song name. */
  onSongNameChange: (name: string) => void;
  /** The title of the song. */
  songTitle: string;
  /** Callback to update the song title. */
  onSongTitleChange: (title: string) => void;
  /** The author of the song. */
  songAuthor: string;
  /** Callback to update the song author. */
  onSongAuthorChange: (author: string) => void;
  /** The beats per minute of the song. */
  bpm: number;
  /** Callback to update the BPM. */
  onBpmChange: (value: number | string) => void;
  /** The speed of the song (ticks per row). */
  speed: number;
  /** Callback to update the speed. */
  onSpeedChange: (value: number | string) => void;
  /** The number of rows in the current pattern. */
  patternRows: number;
  /** Callback to update the number of rows in the current pattern. */
  onPatternRowsChange: (value: string) => void;
  /** The step jump value for editing. */
  editStepJump: number;
  /** Callback to update the step jump value. */
  onEditStepJumpChange: (value: number) => void;
  /** The global volume of the song. */
  globalVolume: number;
  /** Callback to update the global volume. */
  onGlobalVolumeChange: (value: number | string) => void;
  /** The AY hardware envelope period (1-65535). */
  ayHardwareEnvelopePeriod?: number;
  /** Callback to update the hardware envelope period. */
  onAyHardwareEnvelopePeriodChange?: (value: number | string) => void;
  /** The AY noise generator period (0-31). */
  ayNoisePeriod?: number;
  /** Callback to update the noise period. */
  onAyNoisePeriodChange?: (value: number | string) => void;
  /** Whether the song is currently playing. */
  isPlaying: boolean;
  /** Callback to toggle playback. */
  onPlayStop: () => void;
  /** Visible tracker channels for the current sound chip. */
  channels: TrackerChannelId[];
  /** Channels muted in the tracker preview/playback engine. */
  mutedChannels: Set<TrackerChannelId>;
  /** Callback to toggle a single channel mute state. */
  onToggleChannelMute: (channelId: TrackerChannelId) => void;
  /** Callback to load a sample song. */
  onLoadSampleSong: () => void;
  /** Callback to silence all channels. */
  onSilenceAllChannels: () => void;
  /** The sound chip to target. */
  soundChip: 'PSG' | 'SCC';
  /** Callback to update the sound chip. */
  onSoundChipChange: (chip: 'PSG' | 'SCC') => void;
  /** Optional callback to import a PT3 file as external backend. */
  onImportPT3File?: () => void;
  /** Whether the current track uses the external PT3 backend. */
  isExternalPT3?: boolean;
}

/**
 * A header component for the tracker, containing song metadata, playback controls, and other settings.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Tracker
 */
export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  songName, onSongNameChange, songTitle, onSongTitleChange, songAuthor, onSongAuthorChange,
  bpm, onBpmChange, speed, onSpeedChange, patternRows, onPatternRowsChange,
  editStepJump, onEditStepJumpChange, globalVolume, onGlobalVolumeChange,
  ayHardwareEnvelopePeriod, onAyHardwareEnvelopePeriodChange,
  ayNoisePeriod, onAyNoisePeriodChange,
  isPlaying, onPlayStop, onLoadSampleSong, onSilenceAllChannels,
  channels, mutedChannels, onToggleChannelMute,
  soundChip, onSoundChipChange, onImportPT3File, isExternalPT3
}) => {
  const [localPatternRows, setLocalPatternRows] = useState(String(patternRows));

  useEffect(() => {
    setLocalPatternRows(String(patternRows));
  }, [patternRows]);

  const handleSetRows = () => {
    onPatternRowsChange(localPatternRows);
  };

  const fieldClass = "h-8 rounded border border-msx-border bg-msx-bgcolor/80 px-2 text-msx-textprimary outline-none transition-colors focus:border-msx-highlight focus:ring-1 focus:ring-msx-highlight/50";
  const labelClass = "mb-1 block text-[0.62rem] uppercase tracking-wider text-msx-textsecondary";
  const clusterClass = "flex flex-wrap items-end gap-2 rounded border border-msx-border/70 bg-black/10 px-2 py-1.5";

  return (
    <div className="border-b border-msx-border bg-msx-panelbg px-3 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-end gap-2 text-xs">
        <div className="mr-1 flex min-w-[17rem] flex-col gap-1">
          <div className="flex items-center gap-2">
            <MusicNoteIcon className="h-4 w-4 text-msx-highlight" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-msx-textsecondary">Tracker Composer</span>
            {isExternalPT3 && (
              <span className="rounded border border-msx-highlight/60 bg-msx-highlight/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-msx-highlight">
                PT3 active
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={songName} onChange={e => onSongNameChange(e.target.value)} className={`${fieldClass} w-32`} />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input type="text" value={songTitle} onChange={e => onSongTitleChange(e.target.value)} className={`${fieldClass} w-36`} />
            </div>
            <div>
              <label className={labelClass}>Author</label>
              <input type="text" value={songAuthor} onChange={e => onSongAuthorChange(e.target.value)} className={`${fieldClass} w-32`} />
            </div>
          </div>
        </div>

        <div className={clusterClass}>
          <div>
            <label className={labelClass}>Chip</label>
            <select value={soundChip} onChange={e => onSoundChipChange(e.target.value as 'PSG' | 'SCC')} className={`${fieldClass} w-20`}>
              <option value="PSG">PSG</option>
              <option value="SCC">SCC</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>BPM</label>
            <input type="number" value={isNaN(bpm) ? '' : bpm} min="30" max="300" onChange={e => onBpmChange(e.target.value)} className={`${fieldClass} w-16`} />
          </div>
          <div>
            <label className={labelClass}>Speed</label>
            <input type="number" value={isNaN(speed) ? '' : speed} min="1" max="31" onChange={e => onSpeedChange(e.target.value)} className={`${fieldClass} w-14`} />
          </div>
          <div>
            <label className={labelClass}>Rows {patternRows}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={localPatternRows}
                onChange={e => setLocalPatternRows(e.target.value)}
                onBlur={handleSetRows}
                className={`${fieldClass} w-14`}
              />
              <Button onClick={handleSetRows} size="sm" variant="ghost" className="!h-8 !p-1" title="Set Pattern Rows">
                <CheckCircleIcon className="h-3.5 w-3.5 text-msx-highlight" />
              </Button>
            </div>
          </div>
        </div>

        <div className={clusterClass}>
          <div>
            <label className={labelClass}>Step</label>
            <input
              type="number"
              value={editStepJump}
              min="1"
              max="12"
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 12) {
                  onEditStepJumpChange(val);
                } else if (e.target.value === "") {
                  onEditStepJumpChange(1);
                }
              }}
              className={`${fieldClass} w-14`}
              title="Row jump step for editing (1-12)"
            />
          </div>
          <div>
            <label className={labelClass}>Vol</label>
            <input type="number" value={isNaN(globalVolume) ? '' : globalVolume} min="0" max="15" onChange={e => onGlobalVolumeChange(e.target.value)} className={`${fieldClass} w-14`} />
          </div>
          {soundChip === 'PSG' && onAyHardwareEnvelopePeriodChange && (
            <div>
              <label className={labelClass} title="Hardware Envelope Period (1-65535)">HW Env</label>
              <input
                type="number"
                value={ayHardwareEnvelopePeriod ?? 100}
                min="1"
                max="65535"
                onChange={e => onAyHardwareEnvelopePeriodChange(e.target.value)}
                className={`${fieldClass} w-20`}
                title="AY Hardware Envelope Period (higher = slower envelope)"
              />
            </div>
          )}
          {soundChip === 'PSG' && onAyNoisePeriodChange && (
            <div>
              <label className={labelClass} title="Noise Generator Period (0-31)">Noise</label>
              <input
                type="number"
                value={ayNoisePeriod ?? 16}
                min="0"
                max="31"
                onChange={e => onAyNoisePeriodChange(e.target.value)}
                className={`${fieldClass} w-14`}
                title="AY Noise Period (lower = higher pitch noise)"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-1 rounded border border-msx-border/70 bg-black/10 px-2 py-1.5">
          <div className="mr-1 pb-1 text-[0.62rem] uppercase tracking-wider text-msx-textsecondary">Mute</div>
          {channels.map(channelId => {
            const isMuted = mutedChannels.has(channelId);
            return (
              <Button
                key={channelId}
                onClick={() => onToggleChannelMute(channelId)}
                size="sm"
                variant={isMuted ? "danger" : "ghost"}
                className="!h-8 !min-w-8 !px-2 font-mono"
                title={`${isMuted ? 'Unmute' : 'Mute'} channel ${channelId}`}
              >
                {channelId}
              </Button>
            );
          })}
        </div>

        <div className="flex min-w-[15rem] flex-grow flex-wrap items-end justify-end gap-1">
          <Button onClick={onLoadSampleSong} size="sm" variant="ghost" icon={<ListBulletIcon />} title="Load 'Ode to Joy' Sample">Sample</Button>
          {onImportPT3File && soundChip === 'PSG' && (
            <Button
              onClick={onImportPT3File}
              size="sm"
              variant={isExternalPT3 ? 'primary' : 'ghost'}
              title="Import external PT3 file (.pt3 or .99) - replaces native tracker data"
            >
              {isExternalPT3 ? 'PT3 active' : 'Import PT3'}
            </Button>
          )}
          <Button onClick={onPlayStop} size="sm" variant={isPlaying ? "danger" : "primary"} icon={isPlaying ? <StopIcon /> : <PlayIcon />}>
            {isPlaying ? 'Stop' : 'Play Pattern'}
          </Button>
          <Button onClick={onSilenceAllChannels} size="sm" variant="danger" icon={<SoundIcon className="opacity-70" />} title="Silence All Channels">
            Silence
          </Button>
        </div>
      </div>
    </div>
  );
};
