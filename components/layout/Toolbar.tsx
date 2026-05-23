

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common/Button';
import { ProjectAsset, DataFormat, EditorType, ScreenKind, ExportRomMode } from '../../types';
import { SaveFloppyIcon, FolderOpenIcon, PlayIcon, CogIcon, PlusCircleIcon, QuestionMarkCircleIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PuzzlePieceIcon, TilesetIcon, SpriteIcon, MapIcon, WorldMapIcon, SoundIcon, MusicNoteIcon, CodeIcon, BugIcon, SwapHorizIcon, GameFlowIcon, PencilIcon, WorldViewIcon, SparklesIcon, ClockIcon, TrashIcon, ImageIcon } from '../icons/MsxIcons';
import { APP_VERSION } from '../../constants';
import { getRecentProjects, removeRecentProject, clearRecentProjects, formatRecentDate, RecentProject } from '../../utils/recentProjects';
import { getProjectTargetFromScreenMode, isAssetTypeEnabledForProject } from '../../utils/projectTarget';


/**
 * Props for the Toolbar component.
 */
interface ToolbarProps {
  /** Callback to create a new project. */
  onNewProject: () => void;
  /** Callback to create a new asset of a specific type. */
  onNewAsset: (type: ProjectAsset['type'], options?: { select?: boolean; screenKind?: ScreenKind }) => void;
  /** Callback to save the current project. */
  onSaveProject: () => void;
  /** Callback to open the "Save As" dialog for the project. */
  onSaveProjectAs: () => void;
  /** Callback to open the file dialog to load a project. */
  onLoadProject: () => void;
  /** Callback to open the Boss package import dialog. */
  onImportBossPackage: () => void;
  /** @deprecated OBSOLETO - Callback to export all code files. */
  onExportAllCodeFiles?: () => void;
  /** Callback to export Z80 code. */
  onExportZ80Code: () => void;
  /** Callback to export an intermediate JSON representation of the game structure. */
  onExportGameStructureJson: () => void;
  /** @deprecated OBSOLETO - Callback to compile the current code. */
  onCompile?: () => void;
  /** Callback for the debug action. */
  onDebug: () => void;
  /** @deprecated OBSOLETO - Callback to run the compiled project. */
  onRun?: () => void;
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
  /** The default ROM mode used when opening the Z80 export modal. */
  defaultExportRomMode: ExportRomMode;
  /** Callback to set the default Z80 export ROM mode. */
  setDefaultExportRomMode: (mode: ExportRomMode) => void;
  /** Whether the Boss Editor zoom level is saved/restored across sessions. */
  saveBossZoom: boolean;
  /** Callback to enable or disable Boss Editor zoom persistence. */
  setSaveBossZoom: (enabled: boolean) => void;
  /** Whether the Sprite Editor zoom level is saved/restored across sessions. */
  saveSpriteZoom: boolean;
  /** Callback to enable or disable Sprite Editor zoom persistence. */
  setSaveSpriteZoom: (enabled: boolean) => void;
  /** Whether the Tile Editor zoom level is saved/restored across sessions. */
  saveTileZoom: boolean;
  /** Callback to enable or disable Tile Editor zoom persistence. */
  setSaveTileZoom: (enabled: boolean) => void;
  /** Whether the Screen Editor zoom level is saved/restored across sessions. */
  saveScreenZoom: boolean;
  /** Callback to enable or disable Screen Editor zoom persistence. */
  setSaveScreenZoom: (enabled: boolean) => void;
  /** Whether the sector lines visibility is saved/restored across sessions. */
  saveSectorLines: boolean;
  /** Callback to enable or disable sector lines persistence. */
  setSaveSectorLines: (enabled: boolean) => void;
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
  /** Callback to open the world view editor. */
  onOpenWorldView: () => void;
  /** Callback to open the PNG to MSX conversion tool. */
  onOpenPngMsxTool: () => void;
  /** @deprecated OBSOLETO - Callback to open the data compression modal. */
  onCompressAllDataFiles?: () => void;
  /** @deprecated OBSOLETO - Callback for the "Compile and Run" action. */
  onCompileAndRun?: () => void;
  /** @deprecated OBSOLETO - Callback for the "Compress, Export, Compile, Run" action. */
  onCompressExportCompileRun?: () => void;
  /** Callback to configure the ASM compiler. */
  onConfigureASM: () => void;
  /** Callback to configure the emulator. */
  onConfigureEmulator: () => void;
  /** Callback to toggle between the current and last active editor. */
  onToggleEditor: () => void;
  /** Whether the editor toggle button is disabled. */
  isToggleEditorDisabled: boolean;
  /** Current MSX screen mode for asset creation/rendering. */
  currentScreenMode: string;
  /** Whether a project is loaded or has been created. */
  hasActiveProject: boolean;
  /** Callback to load a recent project by its path. */
  onOpenRecentProject?: (path: string) => void;
}


/**
 * A reusable dropdown menu component.
 */
const DropdownMenu: React.FC<{ label: string; children: React.ReactNode; alignRight?: boolean; disabled?: boolean }> = ({ label, children, alignRight, disabled }) => {
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
      return React.cloneElement(child, {
        onClick: () => {
          if ((child.props as any).onClick) (child.props as any).onClick();
          handleSelect();
        }
      } as any);
    }
    return child;
  });

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => { if (!disabled) setIsOpen(o => !o); }}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs rounded-md font-sans focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'bg-msx-border text-msx-textprimary' : 'bg-transparent text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary disabled:hover:bg-transparent disabled:hover:text-msx-textsecondary'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
      </button>
      {isOpen && (
        <div className={`absolute top-full mt-1 bg-msx-panelbg border border-msx-border rounded-md shadow-lg z-30 py-1 w-56 animate-fadeIn ${alignRight ? 'right-0' : 'left-0'}`}>
          {childrenWithProps}
        </div>
      )}
    </div>
  );
};

/**
 * An item within a DropdownMenu.
 */
const DropdownItem: React.FC<{ onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; disabled?: boolean; colorClass?: string; }> = ({ onClick, children, icon, disabled, colorClass }) => {
  const baseClasses = "w-full text-left px-3 py-1.5 text-xs flex items-center disabled:opacity-35 disabled:grayscale disabled:cursor-not-allowed disabled:line-through disabled:decoration-red-500 disabled:decoration-2";
  const defaultClasses = "text-msx-textsecondary hover:bg-msx-accent hover:text-white disabled:hover:bg-transparent disabled:hover:text-msx-textsecondary";
  const customClasses = colorClass || defaultClasses;

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${customClasses}`}>
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

const DropdownSelectItem: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
  return (
    <label className="w-full px-3 py-1.5 text-xs text-msx-textsecondary flex items-center justify-between gap-2">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-msx-textprimary text-xs w-24"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
};


/**
 * The main toolbar component for the application.
 * It contains dropdown menus for file operations, editing, running, configuration, and help.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject, onNewAsset, onSaveProject, onSaveProjectAs, onLoadProject,
  onImportBossPackage,
  onExportAllCodeFiles, onExportZ80Code, onExportGameStructureJson, onCompile, onDebug, onRun, onOpenHelpDocs,
  onOpenThemeSettings, dataOutputFormat, setDataOutputFormat,
  autosaveEnabled, setAutosaveEnabled, defaultExportRomMode, setDefaultExportRomMode, saveBossZoom, setSaveBossZoom, saveSpriteZoom, setSaveSpriteZoom, saveTileZoom, setSaveTileZoom, saveScreenZoom, setSaveScreenZoom, saveSectorLines, setSaveSectorLines, onSaveConfig, onResetConfig, isAutosaving,
  onUndo, onRedo, isUndoDisabled, isRedoDisabled, onOpenAbout,
  onOpenComponentDefEditor, onOpenEntityTemplateEditor, onOpenWorldView, onOpenPngMsxTool, onCompressAllDataFiles,
  onCompileAndRun, onCompressExportCompileRun, onConfigureASM, onConfigureEmulator,
  onToggleEditor, isToggleEditorDisabled,
  currentScreenMode,
  hasActiveProject,
  onOpenRecentProject
}) => {
  const { loadConfig: loadThemeConfig } = useTheme();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false);
  const recentMenuRef = useRef<HTMLDivElement>(null);

  // Load recent projects on mount and when menu opens
  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, []);

  // Close recent menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentMenuRef.current && !recentMenuRef.current.contains(event.target as Node)) {
        setIsRecentMenuOpen(false);
      }
    };
    if (isRecentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRecentMenuOpen]);

  const handleOpenRecent = useCallback((path: string) => {
    if (onOpenRecentProject) {
      onOpenRecentProject(path);
    }
    setIsRecentMenuOpen(false);
  }, [onOpenRecentProject]);

  const handleRemoveRecent = useCallback((e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecentProject(path);
    setRecentProjects(getRecentProjects());
  }, []);

  const handleClearRecentProjects = useCallback(() => {
    clearRecentProjects();
    setRecentProjects([]);
    setIsRecentMenuOpen(false);
  }, []);

  const handleLoadIdeConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.ide) {
          if (config.ide.dataOutputFormat) setDataOutputFormat(config.ide.dataOutputFormat);
          if (typeof config.ide.autosaveEnabled === 'boolean') setAutosaveEnabled(config.ide.autosaveEnabled);
          if (['auto', 'simple32k', 'plain48k', 'megarom'].includes(config.ide.defaultExportRomMode)) {
            setDefaultExportRomMode(config.ide.defaultExportRomMode);
          }
        }
        if (config.theme) {
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

  /** Vertical separator between toolbar groups */
  const Sep = () => <div className="w-px h-5 bg-msx-border shrink-0 mx-0.5" />;
  const projectTarget = getProjectTargetFromScreenMode(currentScreenMode);
  const canCreateAsset = (type: ProjectAsset['type']) => hasActiveProject && isAssetTypeEnabledForProject(type, currentScreenMode);
  const shouldShowAssetType = (type: ProjectAsset['type']) => !hasActiveProject || isAssetTypeEnabledForProject(type, currentScreenMode);
  const shouldShowMsx1Controls = !hasActiveProject || projectTarget === 'MSX1';
  const shouldShowMsx2Controls = !hasActiveProject || projectTarget === 'MSX2';

  return (
    <div className="bg-msx-panelbg border-b border-msx-border px-2 py-1 flex items-center gap-1 shadow-md relative">
      <input type="file" ref={configFileInputRef} onChange={handleLoadIdeConfig} accept=".json" style={{ display: 'none' }} />

      {/* GROUP 1: Project */}
      <DropdownMenu label="File">
        <DropdownItem onClick={onNewProject} icon={<PlusCircleIcon />}>New Project</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={onSaveProject} icon={<SaveFloppyIcon />} disabled={!hasActiveProject}>Save Project</DropdownItem>
        <DropdownItem onClick={onSaveProjectAs} icon={<SaveFloppyIcon />} disabled={!hasActiveProject}>Save Project As...</DropdownItem>
        <DropdownItem onClick={onLoadProject} icon={<FolderOpenIcon />}>Load Project</DropdownItem>
        {shouldShowMsx1Controls && (
          <DropdownItem onClick={onImportBossPackage} icon={<BugIcon />} disabled={!hasActiveProject}>MSX1 Import Boss Package (.json)</DropdownItem>
        )}

        {/* Open Recent Submenu */}
        <div ref={recentMenuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRecentProjects(getRecentProjects());
              setIsRecentMenuOpen(!isRecentMenuOpen);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center justify-between"
          >
            <span className="flex items-center">
              <span className="mr-2 w-4 h-4"><ClockIcon /></span>
              Open Recent
            </span>
            <span className="text-[10px]">▶</span>
          </button>

          {isRecentMenuOpen && (
            <div className="absolute left-full top-0 ml-1 bg-msx-panelbg border border-msx-border rounded-md shadow-lg z-40 py-1 w-72 max-h-80 overflow-y-auto animate-fadeIn">
              {recentProjects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-msx-textsecondary italic">No recent projects</div>
              ) : (
                <>
                  {recentProjects.map((project) => (
                    <div
                      key={project.path}
                      onClick={() => handleOpenRecent(project.path)}
                      className="w-full text-left px-3 py-1.5 text-xs text-msx-textsecondary hover:bg-msx-accent hover:text-white flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-[10px] opacity-60">{formatRecentDate(project.lastOpened)}</div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveRecent(e, project.path)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded transition-opacity"
                        title="Remove from recent"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <DropdownSeparator />
                  <button
                    onClick={handleClearRecentProjects}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    Clear Recent Projects
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <DropdownSeparator />
        <DropdownItem onClick={onExportZ80Code} disabled={!hasActiveProject}>Export Z80 Code</DropdownItem>
        <DropdownItem onClick={onExportGameStructureJson} disabled={!hasActiveProject}>Export Game Structure (.json)</DropdownItem>
      </DropdownMenu>

      <Sep />

      {/* GROUP 2: Edit */}
      <Button onClick={onUndo} variant="ghost" size="sm" icon={<ArrowUturnLeftIcon />} title="Undo (Ctrl+Z)" disabled={!hasActiveProject || isUndoDisabled}>Undo</Button>
      <Button onClick={onRedo} variant="ghost" size="sm" icon={<ArrowUturnRightIcon />} title="Redo (Ctrl+Y)" disabled={!hasActiveProject || isRedoDisabled}>Redo</Button>

      <Sep />

      {/* GROUP 3: New Asset */}
      <DropdownMenu label="New Asset" disabled={!hasActiveProject}>
        <DropdownItem onClick={() => onNewAsset('statemachine')} icon={<PuzzlePieceIcon />} colorClass="text-purple-200 hover:bg-purple-600 hover:text-white" disabled={!canCreateAsset('statemachine')}>State Machine</DropdownItem>
        <DropdownSeparator />
        {shouldShowAssetType('tile') && <DropdownItem onClick={() => onNewAsset('tile')} icon={<TilesetIcon />} colorClass="text-red-200 hover:bg-red-500 hover:text-white" disabled={!canCreateAsset('tile')}>MSX1 Tile</DropdownItem>}
        {shouldShowAssetType('sprite') && <DropdownItem onClick={() => onNewAsset('sprite')} icon={<SpriteIcon />} colorClass="text-orange-200 hover:bg-orange-500 hover:text-white" disabled={!canCreateAsset('sprite')}>MSX1 Sprite</DropdownItem>}
        {shouldShowAssetType('msx2sprite') && <DropdownItem onClick={() => onNewAsset('msx2sprite')} icon={<SpriteIcon />} colorClass="text-cyan-200 hover:bg-cyan-600 hover:text-white" disabled={!canCreateAsset('msx2sprite')}>MSX2 Sprites</DropdownItem>}
        {shouldShowAssetType('msx2screen') && <DropdownItem onClick={() => onNewAsset('msx2screen')} icon={<MapIcon />} colorClass="text-blue-200 hover:bg-blue-600 hover:text-white" disabled={!canCreateAsset('msx2screen')}>MSX2 SCREEN 4 Room (16x12)</DropdownItem>}
        {shouldShowAssetType('msx2bitmaproom') && <DropdownItem onClick={() => onNewAsset('msx2bitmaproom')} icon={<MapIcon />} colorClass="text-sky-200 hover:bg-sky-600 hover:text-white" disabled={!canCreateAsset('msx2bitmaproom')}>MSX2 SCREEN 4 Bitmap Room</DropdownItem>}
        {shouldShowAssetType('msx2hudfont') && <DropdownItem onClick={() => onNewAsset('msx2hudfont')} icon={<PencilIcon />} colorClass="text-emerald-200 hover:bg-emerald-600 hover:text-white" disabled={!canCreateAsset('msx2hudfont')}>MSX2 HUD Font</DropdownItem>}
        {shouldShowAssetType('font') && <DropdownItem onClick={() => onNewAsset('font')} icon={<PencilIcon />} colorClass="text-yellow-200 hover:bg-yellow-500 hover:text-white" disabled={!canCreateAsset('font')}>MSX1 Font</DropdownItem>}
        {shouldShowAssetType('boss') && <DropdownItem onClick={() => onNewAsset('boss')} icon={<BugIcon />} colorClass="text-green-200 hover:bg-green-500 hover:text-white" disabled={!canCreateAsset('boss')}>MSX1 Boss</DropdownItem>}
        {shouldShowAssetType('screenmap') && <DropdownItem onClick={() => onNewAsset('screenmap', { screenKind: 'playable' })} icon={<MapIcon />} colorClass="text-blue-200 hover:bg-blue-500 hover:text-white" disabled={!canCreateAsset('screenmap')}>MSX1 Playable Screen</DropdownItem>}
        {shouldShowAssetType('screenmap') && <DropdownItem onClick={() => onNewAsset('screenmap', { screenKind: 'tutorial' })} icon={<MapIcon />} colorClass="text-cyan-200 hover:bg-cyan-500 hover:text-white" disabled={!canCreateAsset('screenmap')}>MSX1 Tutorial Screen</DropdownItem>}
        {shouldShowAssetType('screenmap') && <DropdownItem onClick={() => onNewAsset('screenmap', { screenKind: 'dialog' })} icon={<MapIcon />} colorClass="text-sky-200 hover:bg-sky-500 hover:text-white" disabled={!canCreateAsset('screenmap')}>MSX1 Dialog Screen</DropdownItem>}
        {shouldShowAssetType('screenmap') && <DropdownItem onClick={() => onNewAsset('screenmap', { screenKind: 'cutscene' })} icon={<MapIcon />} colorClass="text-indigo-200 hover:bg-indigo-500 hover:text-white" disabled={!canCreateAsset('screenmap')}>MSX1 Cutscene Screen</DropdownItem>}
        <DropdownItem onClick={() => onNewAsset('worldmap')} icon={<WorldMapIcon />} colorClass="text-indigo-200 hover:bg-indigo-500 hover:text-white" disabled={!canCreateAsset('worldmap')}>World Map</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('gameflow')} icon={<GameFlowIcon />} colorClass="text-violet-200 hover:bg-violet-500 hover:text-white" disabled={!canCreateAsset('gameflow')}>Game Flow</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('dialogue')} icon={<PencilIcon />} colorClass="text-cyan-200 hover:bg-cyan-500 hover:text-white" disabled={!canCreateAsset('dialogue')}>Dialogue</DropdownItem>
        {shouldShowAssetType('portrait') && <DropdownItem onClick={() => onNewAsset('portrait')} icon={<TilesetIcon />} colorClass="text-pink-200 hover:bg-pink-500 hover:text-white" disabled={!canCreateAsset('portrait')}>MSX1 Portrait</DropdownItem>}
        <DropdownSeparator />
        {shouldShowMsx2Controls && <DropdownItem onClick={() => onNewAsset('palette')} icon={<SparklesIcon />} colorClass="text-fuchsia-200 hover:bg-fuchsia-500 hover:text-white" disabled={!hasActiveProject}>MSX2 Palette</DropdownItem>}
        <DropdownSeparator />
        {shouldShowAssetType('tilebank') && <DropdownItem onClick={() => onNewAsset('tilebank')} icon={<TilesetIcon />} colorClass="text-purple-200 hover:bg-purple-500 hover:text-white" disabled={!canCreateAsset('tilebank')}>MSX1 Tile Banks</DropdownItem>}
        <DropdownItem onClick={onOpenComponentDefEditor} icon={<PuzzlePieceIcon />} colorClass="text-pink-200 hover:bg-pink-500 hover:text-white" disabled={!hasActiveProject}>Component Definition</DropdownItem>
        <DropdownItem onClick={onOpenEntityTemplateEditor} icon={<SpriteIcon />} colorClass="text-rose-200 hover:bg-rose-500 hover:text-white" disabled={!hasActiveProject}>Entity Template</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('globalvariables')} icon={<SparklesIcon />} colorClass="text-yellow-200 hover:bg-yellow-500 hover:text-white" disabled={!canCreateAsset('globalvariables')}>Global Variables</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => onNewAsset('sound')} icon={<SoundIcon />} colorClass="text-cyan-200 hover:bg-cyan-500 hover:text-white" disabled={!canCreateAsset('sound')}>Sound FX</DropdownItem>
        <DropdownItem onClick={() => onNewAsset('track')} icon={<MusicNoteIcon />} colorClass="text-emerald-200 hover:bg-emerald-500 hover:text-white" disabled={!canCreateAsset('track')}>Music Track</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => onNewAsset('presentationscreen')} icon={<MapIcon />} colorClass="text-teal-200 hover:bg-teal-500 hover:text-white" disabled={!canCreateAsset('presentationscreen')}>Presentation Screen</DropdownItem>
      </DropdownMenu>

      <Sep />

      {/* GROUP 4: Views / Editors */}
      <Button onClick={onOpenWorldView} variant="ghost" size="sm" icon={<WorldViewIcon />} title="World View" disabled={!hasActiveProject}>
        World View
      </Button>
      {shouldShowMsx1Controls && (
        <Button onClick={onOpenPngMsxTool} variant="ghost" size="sm" icon={<ImageIcon />} title="MSX1 PNG a Screen 2 Chars" disabled={!hasActiveProject}>
          MSX1 PNG a MSX
        </Button>
      )}
      <Button onClick={onOpenComponentDefEditor} variant="ghost" size="sm" icon={<PuzzlePieceIcon />} title="Component Definitions" disabled={!hasActiveProject}>
        Components
      </Button>
      <Button onClick={onOpenEntityTemplateEditor} variant="ghost" size="sm" icon={<SpriteIcon />} title="Entity Templates" disabled={!hasActiveProject}>
        Templates
      </Button>
      <Button onClick={onToggleEditor} variant="ghost" size="sm" icon={<SwapHorizIcon />} title="Toggle Last Editor" disabled={!hasActiveProject || isToggleEditorDisabled}>
        Last Editor
      </Button>

      {/* Spacer pushes Configure + Help to the right */}
      <div className="flex-1" />

      {/* GROUP 5: Settings + Help — always far right */}
      <DropdownMenu label="Configure" alignRight disabled={!hasActiveProject}>
        <DropdownItem onClick={onConfigureASM} disabled={!hasActiveProject}>Configure ASM Compiler...</DropdownItem>
        <DropdownItem onClick={onConfigureEmulator} disabled={!hasActiveProject}>Configure MSX Emulator...</DropdownItem>
        <DropdownSeparator />
        <DropdownToggleItem label="Data Format (Hex/Dec)" isChecked={dataOutputFormat === 'hex'} onToggle={() => setDataOutputFormat(dataOutputFormat === 'hex' ? 'decimal' : 'hex')} onText="Hex" offText="Dec" />
        <DropdownSelectItem
          label="ROM Mode"
          value={defaultExportRomMode}
          onChange={(value) => setDefaultExportRomMode(value as ExportRomMode)}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'simple32k', label: '32K' },
            { value: 'plain48k', label: '48K' },
            { value: 'megarom', label: 'MegaROM' },
          ]}
        />
        <DropdownToggleItem label="Autosave" isChecked={autosaveEnabled} onToggle={() => setAutosaveEnabled(!autosaveEnabled)} />
        {shouldShowMsx1Controls && <DropdownToggleItem label="Save Boss Zoom" isChecked={saveBossZoom} onToggle={() => setSaveBossZoom(!saveBossZoom)} />}
        {shouldShowMsx1Controls && <DropdownToggleItem label="Save Sprite Zoom" isChecked={saveSpriteZoom} onToggle={() => setSaveSpriteZoom(!saveSpriteZoom)} />}
        {shouldShowMsx1Controls && <DropdownToggleItem label="Save Tile Zoom" isChecked={saveTileZoom} onToggle={() => setSaveTileZoom(!saveTileZoom)} />}
        <DropdownToggleItem label="Save Screen Zoom" isChecked={saveScreenZoom} onToggle={() => setSaveScreenZoom(!saveScreenZoom)} />
        {shouldShowMsx1Controls && <DropdownToggleItem label="MSX1 Save Sector Lines" isChecked={saveSectorLines} onToggle={() => setSaveSectorLines(!saveSectorLines)} />}
        <DropdownSeparator />
        <DropdownItem onClick={onOpenThemeSettings} icon={<CogIcon />}>Theme Settings...</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={onSaveConfig}>Save Config</DropdownItem>
        <DropdownItem onClick={() => configFileInputRef.current?.click()}>Load Config</DropdownItem>
        <DropdownItem onClick={onResetConfig}>Restore Default Config</DropdownItem>
      </DropdownMenu>

      <DropdownMenu label="Help" disabled={!hasActiveProject}>
        <DropdownItem onClick={onOpenHelpDocs} icon={<QuestionMarkCircleIcon />}>Tutorials</DropdownItem>
        <DropdownItem onClick={onOpenAbout}>About</DropdownItem>
      </DropdownMenu>

      <Sep />

      <div style={{ color: 'red', backgroundColor: 'white', padding: '2px 5px', fontSize: '12px', fontWeight: 'bold', borderRadius: '3px' }}>
        v{APP_VERSION}
      </div>

      {isAutosaving && (
        <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-msx-danger rounded-full blinking-dot-indicator" title="Autosaving project..." aria-live="polite" aria-label="Autosaving project" />
      )}
    </div>
  );
};
