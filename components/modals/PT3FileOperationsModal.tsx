
import React, { useState, useRef, useEffect } from 'react';
import { TrackerSongData } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { parsePT3File } from '../utils/pt3Parser';
import { normalizeImportedPT3Data } from '../utils/trackerUtils';
import { generateTrackerSongASM } from '../utils/pt3AsmExport';
import { SaveFloppyIcon, FolderOpenIcon, CodeIcon } from '../icons/MsxIcons';

interface PT3FileOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  songData: TrackerSongData;
  onLoadSongData: (newData: TrackerSongData, fileName?: string) => void;
  currentSongName: string;
}

export const PT3FileOperationsModal: React.FC<PT3FileOperationsModalProps> = ({
  isOpen,
  onClose,
  songData,
  onLoadSongData,
  currentSongName,
}) => {
  const [saveAsFilename, setSaveAsFilename] = useState(currentSongName || 'song.json');
  const pt3FileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    if (isOpen) {
        setSaveAsFilename(currentSongName || 'song.json');
    }
  }, [isOpen, currentSongName]);


  if (!isOpen) return null;

  const handleSaveJson = (filenameOverride?: string) => {
    const filename = filenameOverride || `${currentSongName || 'pt3_song'}.json`;
    const dataStr = JSON.stringify(songData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAsm = () => {
    const asmContent = generateTrackerSongASM(songData);
    const filename = `${currentSongName || 'pt3_song'}.asm`;
    const blob = new Blob([asmContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPt3File = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const parsedData = parsePT3File(arrayBuffer);
          const normalizedSongData = normalizeImportedPT3Data(parsedData, file.name);
          onLoadSongData(normalizedSongData, file.name);
          onClose();
        } catch (error) {
          console.error("Error importing PT3 file:", error);
          alert(`Failed to import PT3: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            if (pt3FileInputRef.current) pt3FileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        alert("Error reading .pt3 file.");
         if (pt3FileInputRef.current) pt3FileInputRef.current.value = "";
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleLoadJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedJson = JSON.parse(text);

          if (
            typeof parsedJson === 'object' &&
            parsedJson !== null &&
            typeof parsedJson.name === 'string' &&
            Array.isArray(parsedJson.patterns) &&
            Array.isArray(parsedJson.order) &&
            Array.isArray(parsedJson.instruments) &&
            Array.isArray(parsedJson.ornaments) &&
            typeof parsedJson.bpm === 'number' &&
            typeof parsedJson.speed === 'number'
          ) {
            const loadedSongData = normalizeImportedPT3Data(parsedJson as Partial<TrackerSongData>, file.name);
            onLoadSongData(loadedSongData, file.name);
            onClose();
          } else {
            throw new Error("Invalid JSON file format: Does not appear to be valid PT3 Song data.");
          }
        } catch (error) {
          console.error("Error loading JSON song file:", error);
          alert(`Failed to load JSON song: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        alert("Error reading .json file.");
        if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
      };
      reader.readAsText(file);
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pt3FileOpsModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-md animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pt3FileOpsModalTitle" className="text-lg text-msx-highlight mb-6 text-center">
          PT3 Tracker File Operations
        </h2>

        <div className="space-y-3">
          <Button
            onClick={() => handleSaveJson()}
            variant="primary"
            size="md"
            icon={<SaveFloppyIcon />}
            className="w-full justify-center"
            aria-label="Save current song as JSON"
          >
            Save Song (.json)
          </Button>

          <Panel title="Save Song As (.json)" className="text-xs">
            <div className="p-2 space-y-2">
                <label htmlFor="saveAsPt3Filename" className="sr-only">Filename for Save As</label>
                <input
                id="saveAsPt3Filename"
                type="text"
                value={saveAsFilename}
                onChange={(e) => setSaveAsFilename(e.target.value)}
                className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                placeholder="Enter filename..."
                />
                <Button
                onClick={() => handleSaveJson(saveAsFilename)}
                variant="secondary"
                size="sm"
                icon={<SaveFloppyIcon />}
                className="w-full justify-center"
                disabled={!saveAsFilename.trim()}
                aria-label="Confirm Save As"
                >
                Save As
                </Button>
            </div>
          </Panel>

          <Button
            onClick={() => jsonFileInputRef.current?.click()}
            variant="primary"
            size="md"
            icon={<FolderOpenIcon />}
            className="w-full justify-center"
            aria-label="Load song from JSON file"
          >
            Load Song (.json)
          </Button>
          <input
            type="file"
            accept=".json"
            ref={jsonFileInputRef}
            onChange={handleLoadJsonFile}
            className="hidden"
            aria-label="JSON song file input"
          />

          <Button
            onClick={handleExportAsm}
            variant="secondary" 
            size="md"
            icon={<CodeIcon />}
            className="w-full justify-center"
            aria-label="Export current song as ASM file"
          >
            Export Song as ASM
          </Button>

          <Button
            onClick={() => pt3FileInputRef.current?.click()}
            variant="secondary" 
            size="md"
            icon={<FolderOpenIcon />}
            className="w-full justify-center"
            aria-label="Import .PT3 file"
          >
            Import .PT3 File
          </Button>
          <input
            type="file"
            accept=".pt3,audio/pt3,application/octet-stream"
            ref={pt3FileInputRef}
            onChange={handleImportPt3File}
            className="hidden"
            aria-label=".PT3 file input"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="ghost" size="md" aria-label="Close file operations modal">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
