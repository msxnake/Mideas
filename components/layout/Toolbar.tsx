

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common/Button';
import { ProjectAsset, DataFormat, EditorType } from '../../types'; 
import { SaveFloppyIcon, FolderOpenIcon, PlayIcon, CogIcon, PlusCircleIcon, QuestionMarkCircleIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PuzzlePieceIcon, TilesetIcon, SpriteIcon, MapIcon, WorldMapIcon, SoundIcon, MusicNoteIcon, CodeIcon, BugIcon } from '../icons/MsxIcons';

// --- PROPS INTERFACE ---
interface ToolbarProps {
  onNewProject: () => void;
  onNewAsset: (type: ProjectAsset['type']) => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onLoadProject: () => void;
  onExportAllCodeFiles: () => void;
  onCompile: () => void;
  onDebug: () => void;
  onRun: () => void;
  onOpenHelpDocs: () => void;
  onOpenThemeSettings: () => void;
  dataOutputFormat: DataFormat;
  setDataOutputFormat: (format: DataFormat) => void;
  autosaveEnabled: boolean;
  setAutosaveEnabled: (enabled: boolean) => void;
  onSaveConfig: () => void;
  onResetConfig: () => void;
  isAutosaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  onOpenAbout: () => void;
  onOpenComponentDefEditor: () => void;
  onOpenEntityTemplateEditor: () => void;
  onCompressAllDataFiles: () => void;
  onCompileAndRun: () => void;
  onCompressExportCompileRun: () => void;
  onConfigureASM: () => void;
  onConfigureEmulator: () => void;
}

// --- REUSABLE DROPDOWN COMPONENTS ---
const DropdownMenu: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = () => {
    setIsOpen(false);
  };
  
  const childrenWithProps = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
          return React.cloneElement(child, { onClick: () => {
              if ((child.props as any).onClick) (child.props as any).onClick();
              handleSelect();
          }} as any);
      }
      return child;
  });

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`px-3 py-1.5 text-xs rounded-md font-sans focus:outline-none transition-colors duration-150 ${isOpen ? 'bg-msx-border text-msx-textprimary' : 'bg-transparent text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-msx-panelbg border border-msx-border rounded-md shadow-lg z-30 py-1 w-56 animate-fadeIn">
          {childrenWithProps}
        </div>
      )}
    </div>
  );
};

const DropdownItem: React.FC<{ onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; disabled?: boolean; }> = ({ onClick, children, icon, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-msx-textsecondary">
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

const DropdownSeparator: React.FC = () => <div className="my-1 border-t border-msx-border opacity-50" />;

const DropdownToggleItem: React.FC<{
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  onText?: string;
  offText?: string;
}> = ({ label, isChecked, onToggle, onText = 'On', offText = 'Off' }) => {
  return (
      <button onClick={onToggle} className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center justify-between">
          <span>{label}</span>
          <span className="text-msx-cyan font-semibold">{isChecked ? onText : offText}</span>
      </button>
  )
};


// --- MAIN TOOLBAR COMPONENT ---
export const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject, onNewAsset, onSaveProject, onSaveProjectAs, onLoadProject,
  onExportAllCodeFiles, onCompile, onDebug, onRun, onOpenHelpDocs,
  onOpenThemeSettings, dataOutputFormat, setDataOutputFormat,
  autosaveEnabled, setAutosaveEnabled, onSaveConfig, onResetConfig, isAutosaving,
  onUndo, onRedo, isUndoDisabled, isRedoDisabled, onOpenAbout,
  onOpenComponentDefEditor, onOpenEntityTemplateEditor, onCompressAllDataFiles,
  onCompileAndRun, onCompressExportCompileRun, onConfigureASM, onConfigureEmulator
}) => {
    const { loadConfig: loadThemeConfig } = useTheme();

    const handleLoadIdeConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target?.result as string);
                if(config.ide) {
                    if (config.ide.dataOutputFormat) setDataOutputFormat(config.ide.dataOutputFormat);
                    if (typeof config.ide.autosaveEnabled === 'boolean') setAutosaveEnabled(config.ide.autosaveEnabled);
                }
                if(config.theme) {
                    loadThemeConfig(config.theme);
                }
                alert("Configuration loaded.");
            } catch (error) {
                alert("Failed to load configuration file. It might be corrupted or in the wrong format.");
            }
        };
        reader.readAsText(file);
    };
    
    const configFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-msx-panelbg border-b border-msx-border p-1.5 flex items-center space-x-2 shadow-md relative">
      <input type="file" ref={configFileInputRef} onChange={handleLoadIdeConfig} accept=".json" style={{display: 'none'}} />

      {/* File Menu */}
      <DropdownMenu label="File">
        <DropdownItem onClick={onNewProject} icon={<PlusCircleIcon/>}>New Project</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={onSaveProject} icon={<SaveFloppyIcon/>}>Save Project</DropdownItem>
        <DropdownItem onClick={onSaveProjectAs} icon={<SaveFloppyIcon/>}>Save Project As...</DropdownItem>
        <DropdownItem onClick={onLoadProject} icon={<FolderOpenIcon/>}>Load Project</DropdownItem>
      </DropdownMenu>

      {/* Undo/Redo Buttons */}
      <Button onClick={onUndo} variant="ghost" size="sm" icon={<ArrowUturnLeftIcon />} title="Undo (Ctrl+Z)" disabled={isUndoDisabled}>Undo</Button>
      <Button onClick={onRedo} variant="ghost" size="sm" icon={<ArrowUturnRightIcon />} title="Redo (Ctrl+Y)" disabled={isRedoDisabled}>Redo</Button>

      {/* New Asset Menu */}
      <DropdownMenu label="New Asset">
        <DropdownItem onClick={() => onNewAsset('tile')} icon={<TilesetIcon/>}>Tile</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('sprite')} icon={<SpriteIcon/>}>Sprite</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('boss')} icon={<BugIcon/>}>Boss</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('screenmap')} icon={<MapIcon/>}>Screen Map</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('worldmap')} icon={<WorldMapIcon/>}>World Map</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={onOpenComponentDefEditor} icon={<PuzzlePieceIcon/>}>Component Definition</DropdownItem>
        <DropdownItem onClick={onOpenEntityTemplateEditor} icon={<SpriteIcon/>}>Entity Template</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('code')} icon={<CodeIcon/>}>Data Struct (Code)</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => onNewAsset('sound')} icon={<SoundIcon/>}>Sound FX</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('track')} icon={<MusicNoteIcon/>}>Music Track</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('code')} icon={<CodeIcon/>}>Code File</DropdownItem>
      </DropdownMenu>

      {/* Run Menu */}
      <DropdownMenu label="Run">
        <DropdownItem onClick={onExportAllCodeFiles}>Export all Code Files</DropdownItem>
        <DropdownItem onClick={onCompressAllDataFiles}>Compress all Data Files</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={onCompile}>Compile</DropdownItem>
        <DropdownItem onClick={onRun} icon={<PlayIcon/>}>Run</DropdownItem>
        <DropdownItem onClick={onCompileAndRun}>Compile and Run</DropdownItem>
        <DropdownSeparator/>
        <DropdownItem onClick={onCompressExportCompileRun} icon={<PlayIcon/>}>Compress, Export, Compile, Run</DropdownItem>
      </DropdownMenu>

      {/* Configure Menu */}
      <DropdownMenu label="Configure">
        <DropdownItem onClick={onConfigureASM}>Configure ASM Compiler...</DropdownItem>
        <DropdownItem onClick={onConfigureEmulator}>Configure MSX Emulator...</DropdownItem>
        <DropdownSeparator />
        <DropdownToggleItem label="Data Format (Hex/Dec)" isChecked={dataOutputFormat === 'hex'} onToggle={() => setDataOutputFormat(dataOutputFormat === 'hex' ? 'decimal' : 'hex')} onText="Hex" offText="Dec"/>
        <DropdownToggleItem label="Autosave" isChecked={autosaveEnabled} onToggle={() => setAutosaveEnabled(!autosaveEnabled)} />
        <DropdownSeparator />
        <DropdownItem onClick={onOpenThemeSettings} icon={<CogIcon/>}>Theme Settings...</DropdownItem>
        <DropdownSeparator/>
        <DropdownItem onClick={onSaveConfig}>Save Config</DropdownItem>
        <DropdownItem onClick={() => configFileInputRef.current?.click()}>Load Config</DropdownItem>
        <DropdownItem onClick={onResetConfig}>Restore Default Config</DropdownItem>
      </DropdownMenu>

      {/* Help Menu */}
      <DropdownMenu label="Help">
        <DropdownItem onClick={onOpenHelpDocs} icon={<QuestionMarkCircleIcon/>}>Tutorials</DropdownItem>
        <DropdownItem onClick={onOpenAbout}>About</DropdownItem>
      </DropdownMenu>
      
      <div className="flex-grow"></div>
      
      {isAutosaving && (
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-msx-danger rounded-full blinking-dot-indicator" title="Autosaving project..." aria-live="polite" aria-label="Autosaving project"/>
      )}
    </div>
  );
};
