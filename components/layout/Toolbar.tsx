

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common/Button';
import { ProjectAsset, DataFormat, EditorType } from '../../types'; 
import { SaveFloppyIcon, FolderOpenIcon, PlayIcon, CogIcon, PlusCircleIcon, QuestionMarkCircleIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PuzzlePieceIcon, TilesetIcon, SpriteIcon, MapIcon, WorldMapIcon, SoundIcon, MusicNoteIcon, CodeIcon, BugIcon, SwapHorizIcon, GameFlowIcon } from '../icons/MsxIcons';
import { APP_VERSION } from '../../constants';

/**
 * Props for the Toolbar component.
 */
interface ToolbarProps {
  /** Callback to create a new project. */
  onNewProject: () => void;
  /** Callback to create a new asset of a specific type. */
  onNewAsset: (type: ProjectAsset['type']) => void;
  /** Callback to save the current project. */
  onSaveProject: () => void;
  /** Callback to open the "Save As" dialog for the project. */
  onSaveProjectAs: () => void;
  /** Callback to open the file dialog to load a project. */
  onLoadProject: () => void;
  /** Callback to export all code files. */
  onExportAllCodeFiles: () => void;
  /** Callback to compile the current code. */
  onCompile: () => void;
  /** Callback for the debug action. */
  onDebug: () => void;
  /** Callback to run the compiled project. */
  onRun: () => void;
  /** Callback to open the help documentation viewer. */
  onOpenHelpDocs: () => void;
  /** Callback to open the theme settings modal. */
  onOpenThemeSettings: () => void;
  /** The current data format for ASM exports. */
  dataOutputFormat: DataFormat;
  /** Callback to set the data output format. */
  setDataOutputFormat: (format: DataFormat) => void;
  /** Whether autosave is currently enabled. */
  autosaveEnabled: boolean;
  /** Callback to enable or disable autosave. */
  setAutosaveEnabled: (enabled: boolean) => void;
  /** Callback to save the current IDE configuration. */
  onSaveConfig: () => void;
  /** Callback to reset the IDE configuration to defaults. */
  onResetConfig: () => void;
  /** A flag indicating if an autosave is in progress. */
  isAutosaving: boolean;
  /** Callback for the undo action. */
  onUndo: () => void;
  /** Callback for the redo action. */
  onRedo: () => void;
  /** Whether the undo action is currently disabled. */
  isUndoDisabled: boolean;
  /** Whether the redo action is currently disabled. */
  isRedoDisabled: boolean;
  /** Callback to open the "About" modal. */
  onOpenAbout: () => void;
  /** Callback to open the component definition editor. */
  onOpenComponentDefEditor: () => void;
  /** Callback to open the entity template editor. */
  onOpenEntityTemplateEditor: () => void;
  /** Callback to open the data compression modal. */
  onCompressAllDataFiles: () => void;
  /** Callback for the "Compile and Run" action. */
  onCompileAndRun: () => void;
  /** Callback for the "Compress, Export, Compile, Run" action. */
  onCompressExportCompileRun: () => void;
  /** Callback to configure the ASM compiler. */
  onConfigureASM: () => void;
  /** Callback to configure the emulator. */
  onConfigureEmulator: () => void;
  /** Callback to toggle between the current and last active editor. */
  onToggleEditor: () => void;
  /** Whether the editor toggle button is disabled. */
  isToggleEditorDisabled: boolean;
}

/**
 * A reusable dropdown menu component.
 */
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

/**
 * An item within a DropdownMenu.
 */
const DropdownItem: React.FC<{ onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; disabled?: boolean; }> = ({ onClick, children, icon, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-msx-textsecondary">
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

/**
 * A separator line within a DropdownMenu.
 */
const DropdownSeparator: React.FC = () => <div className="my-1 border-t border-msx-border opacity-50" />;

/**
 * A toggleable item within a DropdownMenu.
 */
const DropdownToggleItem: React.FC<{
  /** The label for the toggle item. */
  label: string;
  /** Whether the item is currently checked. */
  isChecked: boolean;
  /** Callback function to toggle the item's state. */
  onToggle: () => void;
  /** Optional text to display when the item is on. */
  onText?: string;
  /** Optional text to display when the item is off. */
  offText?: string;
}> = ({ label, isChecked, onToggle, onText = 'On', offText = 'Off' }) => {
  return (
      <button onClick={onToggle} className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center justify-between">
          <span>{label}</span>
          <span className="text-msx-cyan font-semibold">{isChecked ? onText : offText}</span>
      </button>
  )
};


/**
 * The main toolbar component for the application.
 * It contains dropdown menus for file operations, editing, running, configuration, and help.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject, onNewAsset, onSaveProject, onSaveProjectAs, onLoadProject,
  onExportAllCodeFiles, onCompile, onDebug, onRun, onOpenHelpDocs,
  onOpenThemeSettings, dataOutputFormat, setDataOutputFormat,
  autosaveEnabled, setAutosaveEnabled, onSaveConfig, onResetConfig, isAutosaving,
  onUndo, onRedo, isUndoDisabled, isRedoDisabled, onOpenAbout,
  onOpenComponentDefEditor, onOpenEntityTemplateEditor, onCompressAllDataFiles,
  onCompileAndRun, onCompressExportCompileRun, onConfigureASM, onConfigureEmulator,
  onToggleEditor, isToggleEditorDisabled
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
        <DropdownItem onClick={() => onNewAsset('statemachine')} icon={<PuzzlePieceIcon/>}>State Machine</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => onNewAsset('tile')} icon={<TilesetIcon/>}>Tile</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('sprite')} icon={<SpriteIcon/>}>Sprite</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('boss')} icon={<BugIcon/>}>Boss</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('screenmap')} icon={<MapIcon/>}>Screen Map</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('worldmap')} icon={<WorldMapIcon/>}>World Map</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('gameflow')} icon={<GameFlowIcon/>}>Game Flow</DropdownItem>
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

      <Button
        onClick={onToggleEditor}
        variant="ghost"
        size="sm"
        icon={<SwapHorizIcon />}
        title="Toggle Last Editor"
        disabled={isToggleEditorDisabled}
      >
        Last Editor
      </Button>
      
      <div className="flex-grow" />
      <div style={{color: 'red', backgroundColor: 'white', padding: '2px 5px', marginRight: '10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px'}}>
        v{APP_VERSION}
      </div>
      
      {isAutosaving && (
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-msx-danger rounded-full blinking-dot-indicator" title="Autosaving project..." aria-live="polite" aria-label="Autosaving project"/>
      )}
    </div>
  );
};
