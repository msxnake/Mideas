
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { PlayIcon, StopIcon, ListBulletIcon, CheckCircleIcon, MusicNoteIcon, SoundIcon } from '../icons/MsxIcons'; // Added MusicNoteIcon, SoundIcon
import { DEFAULT_PT3_ROWS_PER_PATTERN } from '../../constants';

interface TrackerHeaderProps {
  songName: string;
  onSongNameChange: (name: string) => void;
  songTitle: string;
  onSongTitleChange: (title: string) => void;
  songAuthor: string;
  onSongAuthorChange: (author: string) => void;
  bpm: number;
  onBpmChange: (value: number | string) => void;
  speed: number;
  onSpeedChange: (value: number | string) => void;
  patternRows: number;
  onPatternRowsChange: (value: string) => void;
  editStepJump: number;
  onEditStepJumpChange: (value: number) => void;
  globalVolume: number;
  onGlobalVolumeChange: (value: number | string) => void;
  isPlaying: boolean;
  onPlayStop: () => void;
  onOpenFileOperations: () => void;
  onLoadSampleSong: () => void;
  onSilenceAllChannels: () => void; // New prop for silencing all channels
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  songName, onSongNameChange, songTitle, onSongTitleChange, songAuthor, onSongAuthorChange,
  bpm, onBpmChange, speed, onSpeedChange, patternRows, onPatternRowsChange,
  editStepJump, onEditStepJumpChange, globalVolume, onGlobalVolumeChange,
  isPlaying, onPlayStop, onOpenFileOperations, onLoadSampleSong, onSilenceAllChannels // Added onSilenceAllChannels
}) => {
  const [localPatternRows, setLocalPatternRows] = useState(String(patternRows));

  useEffect(() => {
    setLocalPatternRows(String(patternRows));
  }, [patternRows]);

  const handleSetRows = () => {
    onPatternRowsChange(localPatternRows);
  };


  return (
    <div className="p-2 border-b border-msx-border flex flex-wrap gap-x-3 gap-y-2 items-center text-xs">
      <div>
        <label className="text-msx-textsecondary mr-1">Name:</label>
        <input type="text" value={songName} onChange={e => onSongNameChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-28"/>
      </div>
      <div>
        <label className="text-msx-textsecondary mr-1">Title:</label>
        <input type="text" value={songTitle} onChange={e => onSongTitleChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-28"/>
      </div>
      <div>
        <label className="text-msx-textsecondary mr-1">Author:</label>
        <input type="text" value={songAuthor} onChange={e => onSongAuthorChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-28"/>
      </div>
      <div className="flex items-center space-x-1">
        <Button onClick={onOpenFileOperations} size="sm" variant="ghost" icon={<ListBulletIcon/>} title="File Operations (Load/Save/Import)">File Ops</Button>
        <Button onClick={onLoadSampleSong} size="sm" variant="ghost" icon={<MusicNoteIcon />} title="Load 'Ode to Joy' Sample">Sample</Button> 
      </div>
      <span className="border-l border-msx-border h-5 mx-1"></span>
      <div>
        <label className="text-msx-textsecondary mr-1">BPM:</label>
        <input type="number" value={bpm} min="30" max="300" onChange={e => onBpmChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-14"/>
      </div>
      <div>
        <label className="text-msx-textsecondary mr-1">Speed:</label>
        <input type="number" value={speed} min="1" max="31" onChange={e => onSpeedChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-12"/>
      </div>
       <div className="flex items-center">
        <label className="text-msx-textsecondary mr-1">Rows ({patternRows}):</label>
        <input 
          type="number" 
          value={localPatternRows} 
          onChange={e => setLocalPatternRows(e.target.value)} 
          onBlur={handleSetRows} // Keep onBlur as a fallback
          className="p-1 bg-msx-bgcolor border border-msx-border rounded w-12"/>
        <Button onClick={handleSetRows} size="sm" variant="ghost" className="ml-1 !p-0.5" title="Set Pattern Rows">
          <CheckCircleIcon className="w-3.5 h-3.5 text-msx-highlight"/>
        </Button>
      </div>
      <div>
        <label className="text-msx-textsecondary mr-1">Step:</label>
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
          className="p-1 bg-msx-bgcolor border border-msx-border rounded w-12"
          title="Row jump step for editing (1-12)"
        />
      </div>
      <div>
        <label className="text-msx-textsecondary mr-1">Vol:</label>
        <input type="number" value={globalVolume} min="0" max="15" onChange={e => onGlobalVolumeChange(e.target.value)} className="p-1 bg-msx-bgcolor border border-msx-border rounded w-12"/>
      </div>
      <div className="flex-grow"></div>
      <Button onClick={onPlayStop} size="sm" variant={isPlaying ? "danger" : "primary"} icon={isPlaying ? <StopIcon /> : <PlayIcon />}>
        {isPlaying ? 'Stop' : 'Play Pattern'}
      </Button>
       <Button onClick={onSilenceAllChannels} size="sm" variant="danger" icon={<SoundIcon className="opacity-70"/>} title="Silence All Channels">
        Silence
      </Button>
    </div>
  );
};
