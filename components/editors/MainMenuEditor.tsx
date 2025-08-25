import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MainMenuConfig, MainMenuOption, MainMenuKeyMapping, ProjectAsset, MSX1ColorValue } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, CodeIcon, ListBulletIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { ExportMainMenuASMModal } from '../modals/ExportMainMenuASMModal';
import { generateMainMenuASM } from '../utils/mainMenuUtils';
import { MainMenuPreviewModal } from '../modals/MainMenuPreviewModal';
import { MSX1_PALETTE } from '../../constants';


interface MainMenuEditorProps {
    mainMenuConfig: MainMenuConfig;
    onUpdateMainMenuConfig: (updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => void;
    onSaveMenu: (menu: any) => void;
    allAssets: ProjectAsset[];
    msxFont: any;
    msxFontColorAttributes: any;
    currentScreenMode: string;
}

type MainMenuTab = 'Design' | 'Appearance' | 'Keys' | 'Settings' | 'Continue' | 'Intro' | 'Add Asset';

const KeyInput: React.FC<{ label: string; value: string; onSet: () => void; isListening: boolean }> = ({ label, value, onSet, isListening }) => (
    <div className="flex items-center justify-between p-2 bg-msx-bgcolor rounded">
        <span className="text-msx-textprimary">{label}:</span>
        <div className="flex items-center space-x-2">
            <span className="text-msx-cyan font-mono w-24 text-center border border-msx-border rounded px-2 py-1">
                {isListening ? '...' : value}
            </span>
            <Button onClick={onSet} size="sm" variant="secondary">{isListening ? 'Listening...' : 'Set Key'}</Button>
        </div>
    </div>
);

const InlineColorPicker: React.FC<{ label: string, color: MSX1ColorValue; onChange: (color: MSX1ColorValue) => void; }> = ({ label, color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
        <div className="flex items-center justify-between p-2 bg-msx-bgcolor rounded relative">
            <span className="text-msx-textprimary">{label}:</span>
            <Button onClick={() => setIsOpen(o => !o)} size="sm" variant="ghost" className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded border border-msx-border" style={{ backgroundColor: color }}></div>
                <span className="text-msx-textsecondary">{color}</span>
            </Button>
            {isOpen && (
                <div ref={pickerRef} className="absolute z-20 top-full right-0 mt-1 bg-msx-panelbg border border-msx-border rounded shadow-lg p-2">
                    <div className="grid grid-cols-8 gap-1">
                        {MSX1_PALETTE.map(c => (
                            <button
                                key={c.index}
                                className={`w-6 h-6 rounded border-2 ${color === c.hex ? 'border-white ring-1 ring-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                                onClick={() => { onChange(c.hex); setIsOpen(false); }}
                                title={`${c.name} (${c.index})`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const MainMenuEditor: React.FC<MainMenuEditorProps> = ({ mainMenuConfig, onUpdateMainMenuConfig, onSaveMenu, allAssets, msxFont, msxFontColorAttributes, currentScreenMode }) => {
    const [activeTab, setActiveTab] = useState<MainMenuTab>('Design');
    const [listeningForKey, setListeningForKey] = useState<keyof MainMenuKeyMapping | null>(null);
    const [menuName, setMenuName] = useState('Mi Menú Principal');

    const [assetPickerState, setAssetPickerState] = useState<{
        isOpen: boolean;
        assetType: 'screenmap' | 'sprite';
        onSelect: (assetId: string) => void;
    } | null>(null);

    const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [asmCode, setAsmCode] = useState('');
    
    const handleConfigChange = (field: keyof MainMenuConfig, value: any) => {
        onUpdateMainMenuConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSubConfigChange = (
        key: 'keyMapping' | 'settings' | 'continueScreen' | 'introScreen' | 'menuColors',
        field: string,
        value: any
    ) => {
        onUpdateMainMenuConfig(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] as any),
                [field]: value,
            },
        }));
    };

    const handleOptionChange = (index: number, field: keyof MainMenuOption, value: any) => {
        const newOptions = [...mainMenuConfig.options];
        (newOptions[index] as any)[field] = value;
        handleConfigChange('options', newOptions);
    };

    const handleAddOption = () => {
        const newOption: MainMenuOption = { id: `opt_${Date.now()}`, label: 'NUEVA OPCION', enabled: true };
        handleConfigChange('options', [...mainMenuConfig.options, newOption]);
    };
    
    const handleRemoveOption = (index: number) => {
        const newOptions = mainMenuConfig.options.filter((_, i) => i !== index);
        handleConfigChange('options', newOptions);
    };

    const handleMoveOption = (index: number, direction: 'up' | 'down') => {
        const newOptions = [...mainMenuConfig.options];
        const item = newOptions.splice(index, 1)[0];
        const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(newOptions.length, index + 1);
        newOptions.splice(newIndex, 0, item);
        handleConfigChange('options', newOptions);
    };
    
    const keyListenCallbackRef = useRef<((e: KeyboardEvent) => void) | null>(null);
    useEffect(() => {
        keyListenCallbackRef.current = (e: KeyboardEvent) => {
            if (listeningForKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubConfigChange('keyMapping', listeningForKey, e.key);
                setListeningForKey(null);
            }
        };
    }, [listeningForKey, handleSubConfigChange]);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => keyListenCallbackRef.current?.(e);
        if (listeningForKey) {
            window.addEventListener('keydown', listener, true);
        }
        return () => {
            window.removeEventListener('keydown', listener, true);
        };
    }, [listeningForKey]);

    const openAssetPicker = (assetType: 'screenmap' | 'sprite', onSelect: (assetId: string) => void) => {
        setAssetPickerState({ isOpen: true, assetType, onSelect });
    };
    
    const handleExportAsm = () => {
        const code = generateMainMenuASM(mainMenuConfig, allAssets);
        setAsmCode(code);
        setIsExportAsmModalOpen(true);
    };

    const handleSave = () => {
        if (!menuName.trim()) {
          alert('Por favor, introduce un nombre para el menú.');
          return;
        }

        const menuId = uuidv4();

        const menuAsset = {
          id: menuId,
          name: menuName,
          ...mainMenuConfig,
        };

        onSaveMenu(menuAsset);

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(menuAsset, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `${menuName.replace(/\s+/g, '_').toLowerCase()}.json`;
        link.click();

        alert(`¡Menú "${menuName}" guardado con éxito!`);
      };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Design': return (
                <div className="space-y-2">
                    {mainMenuConfig.options.map((opt, index) => (
                        <div key={opt.id} className="flex items-center space-x-2 p-2 bg-msx-bgcolor rounded">
                            <input type="text" value={opt.label} onChange={e => handleOptionChange(index, 'label', e.target.value)} className="p-1 flex-grow bg-msx-panelbg border border-msx-border rounded"/>
                            <label><input type="checkbox" checked={opt.enabled} onChange={e => handleOptionChange(index, 'enabled', e.target.checked)} className="form-checkbox"/> Enabled</label>
                            <Button onClick={() => handleMoveOption(index, 'up')} disabled={index === 0} icon={<ArrowUpIcon/>} size="sm" variant="ghost">{null}</Button>
                            <Button onClick={() => handleMoveOption(index, 'down')} disabled={index === mainMenuConfig.options.length - 1} icon={<ArrowDownIcon/>} size="sm" variant="ghost">{null}</Button>
                            <Button onClick={() => handleRemoveOption(index)} icon={<TrashIcon/>} size="sm" variant="danger">{null}</Button>
                        </div>
                    ))}
                    <Button onClick={handleAddOption} icon={<PlusCircleIcon/>} variant="secondary" size="sm">Add Menu Option</Button>
                </div>
            );
            case 'Appearance':
                const bgAsset = allAssets.find(a => a.id === mainMenuConfig.menuScreenAssetId);
                const cursorAsset = allAssets.find(a => a.id === mainMenuConfig.cursorSpriteAssetId);
                return (
                    <div className="space-y-3">
                        <Panel title="Visuals">
                            <div className="flex items-center space-x-2">
                                <Button onClick={() => openAssetPicker('screenmap', (id) => handleConfigChange('menuScreenAssetId', id))} variant="secondary" size="sm">Select Background Screen</Button>
                                <span className="text-msx-textsecondary truncate">Selected: {bgAsset ? `${bgAsset.name}` : 'None'}</span>
                            </div>
                             <div className="flex items-center space-x-2 mt-2">
                                <Button onClick={() => openAssetPicker('sprite', (id) => handleConfigChange('cursorSpriteAssetId', id))} variant="secondary" size="sm">Select Cursor Sprite</Button>
                                <span className="text-msx-textsecondary truncate">Selected: {cursorAsset ? `${cursorAsset.name}` : 'None'}</span>
                            </div>
                        </Panel>
                        <Panel title="Colors">
                           <InlineColorPicker label="Text" color={mainMenuConfig.menuColors.text} onChange={color => handleSubConfigChange('menuColors', 'text', color)} />
                           <InlineColorPicker label="Background" color={mainMenuConfig.menuColors.background} onChange={color => handleSubConfigChange('menuColors', 'background', color)} />
                           <InlineColorPicker label="Highlight Text" color={mainMenuConfig.menuColors.highlightText} onChange={color => handleSubConfigChange('menuColors', 'highlightText', color)} />
                           <InlineColorPicker label="Highlight BG" color={mainMenuConfig.menuColors.highlightBackground} onChange={color => handleSubConfigChange('menuColors', 'highlightBackground', color)} />
                           <InlineColorPicker label="Border" color={mainMenuConfig.menuColors.border || 'transparent'} onChange={color => handleSubConfigChange('menuColors', 'border', color)} />
                        </Panel>
                    </div>
                );
            case 'Keys': return (
                <div className="space-y-2">
                    {Object.keys(mainMenuConfig.keyMapping).map(key => (
                        <KeyInput 
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={mainMenuConfig.keyMapping[key as keyof MainMenuKeyMapping]}
                            onSet={() => setListeningForKey(key as keyof MainMenuKeyMapping)}
                            isListening={listeningForKey === key}
                        />
                    ))}
                </div>
            );
            case 'Settings': return (
                <div>
                    <label className="block mb-1">General Volume (0-15): {mainMenuConfig.settings.volume}</label>
                    <input type="range" min="0" max="15" value={mainMenuConfig.settings.volume} onChange={e => handleSubConfigChange('settings', 'volume', parseInt(e.target.value))} className="w-full accent-msx-accent"/>
                </div>
            );
            case 'Continue': return (
                <div className="space-y-2">
                    <label>Title Text:</label><input type="text" value={mainMenuConfig.continueScreen.title} onChange={e => handleSubConfigChange('continueScreen', 'title', e.target.value)} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded"/>
                    <label>Prompt Text:</label><input type="text" value={mainMenuConfig.continueScreen.prompt} onChange={e => handleSubConfigChange('continueScreen', 'prompt', e.target.value)} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded"/>
                </div>
            );
            case 'Intro': 
                const introBgAsset = allAssets.find(a => a.id === mainMenuConfig.introScreen.backgroundAssetId);
                return (
                    <div className="space-y-2">
                        <label>Intro Text:</label><textarea value={mainMenuConfig.introScreen.text} onChange={e => handleSubConfigChange('introScreen', 'text', e.target.value)} rows={5} className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded font-mono"/>
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => openAssetPicker('screenmap', (id) => handleSubConfigChange('introScreen', 'backgroundAssetId', id))} variant="secondary" size="sm">Select Background Asset</Button>
                            <span className="text-msx-textsecondary truncate">Selected: {introBgAsset ? `${introBgAsset.name} (${introBgAsset.type})` : 'None'}</span>
                        </div>
                    </div>
                );
            case 'Add Asset':
                return (
                    <div>
                      <h2>Guardar Menú como Asset</h2>
                      <input
                        type="text"
                        value={menuName}
                        onChange={(e) => setMenuName(e.target.value)}
                        placeholder="Nombre del Menú"
                        style={{ marginRight: '10px' }}
                        className="p-1 bg-msx-panelbg border border-msx-border rounded"
                      />
                      <Button onClick={handleSave}>Guardar y Exportar JSON</Button>
                    </div>
                );
        }
    };
    
    return (
        <Panel title="Main Menu Editor" icon={<ListBulletIcon/>} className="flex-grow flex flex-col !p-0">
            <div className="p-2 border-b border-msx-border flex items-center justify-between">
                <div className="flex space-x-1">
                    {(['Design', 'Appearance', 'Keys', 'Settings', 'Continue', 'Intro', 'Add Asset'] as MainMenuTab[]).map(tab => (
                        <Button key={tab} onClick={() => setActiveTab(tab)} variant={activeTab === tab ? 'primary' : 'ghost'} size="sm">{tab}</Button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsPreviewModalOpen(true)}>Preview</Button>
                    <Button variant="secondary" size="sm" icon={<CodeIcon/>} onClick={handleExportAsm}>Export ASM</Button>
                </div>
            </div>
            <div className="flex-grow p-3 overflow-y-auto" style={{ userSelect: 'none' }}>
                {renderTabContent()}
            </div>
             {assetPickerState?.isOpen && (
                <AssetPickerModal
                    isOpen={assetPickerState.isOpen}
                    onClose={() => setAssetPickerState(null)}
                    onSelectAsset={assetPickerState.onSelect}
                    assetTypeToPick={assetPickerState.assetType}
                    allAssets={allAssets}
                    currentSelectedId={null} // Can be improved to show current selection
                />
            )}
            {isExportAsmModalOpen && (
                <ExportMainMenuASMModal
                    isOpen={isExportAsmModalOpen}
                    onClose={() => setIsExportAsmModalOpen(false)}
                    asmCode={asmCode}
                />
            )}
            {isPreviewModalOpen && (
                <MainMenuPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    config={mainMenuConfig}
                    allAssets={allAssets}
                    globalFont={msxFont}
                    globalFontColorAttributes={msxFontColorAttributes}
                    currentScreenMode={currentScreenMode}
                />
            )}
        </Panel>
    );
};