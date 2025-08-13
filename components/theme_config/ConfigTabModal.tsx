import React, { useState } from 'react';
import { useTheme, ThemeMode, ColorKeys } from '../../contexts/ThemeContext';
import ColorPicker from './ColorPicker';
import ThemePreview from './ThemePreview';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel'; // Re-using Panel for structure

interface ConfigTabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEMEABLE_COLOR_KEYS: { key: ColorKeys; label: string }[] = [
  { key: 'bgcolor', label: 'Main Background' },
  { key: 'panelbg', label: 'Panel Background' },
  { key: 'textprimary', label: 'Primary Text' },
  { key: 'textsecondary', label: 'Secondary Text' },
  { key: 'accent', label: 'Accent Color' },
  { key: 'highlight', label: 'Highlight Color' },
  { key: 'border', label: 'Border Color' },
  { key: 'danger', label: 'Danger Color' },
  { key: 'warning', label: 'Warning Color' },
];


export const ConfigTabModal: React.FC<ConfigTabModalProps> = ({ isOpen, onClose }) => {
  const { config, setThemeMode, updateCustomColor, resetToDefault, loadConfig, getEffectiveColors } = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportConfig = () => {
    const dataStr = JSON.stringify({ theme: config.theme, colors: config.colors }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msx-ide-theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        loadConfig(importedConfig); // useTheme's loadConfig handles validation
      } catch (error) {
        console.error('Error parsing theme JSON:', error);
        alert('Failed to import theme: Invalid JSON file.');
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
      }
    };
    reader.readAsText(file);
  };
  
  const effectiveColors = getEffectiveColors();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose} // Close if backdrop is clicked
      role="dialog"
      aria-modal="true"
      aria-labelledby="themeConfigModalTitle"
    >
      <div
        className="bg-msx-panelbg p-5 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-slideIn"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h2 id="themeConfigModalTitle" className="text-xl font-semibold text-msx-highlight mb-4 pb-2 border-b border-msx-border">
          Theme Settings
        </h2>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 text-sm">
          {/* Theme Mode Selection */}
          <Panel title="Theme Mode" className="shadow-sm">
            <div className="flex space-x-3 p-2">
              {(['light', 'dark', 'custom'] as ThemeMode[]).map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  variant={config.theme === mode ? 'primary' : 'ghost'}
                  size="md"
                  className="capitalize flex-1"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </Panel>

          {/* Custom Color Pickers (only if theme is 'custom') */}
          {config.theme === 'custom' && (
            <Panel title="Customize Colors" className="shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                {THEMEABLE_COLOR_KEYS.map(({ key, label }) => (
                  <div key={key} className="relative"> {/* Added relative for picker positioning */}
                    <ColorPicker
                      label={label}
                      color={config.colors[key]}
                      onChange={(newColor) => updateCustomColor(key, newColor)}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Theme Preview */}
          <Panel title="Preview" className="shadow-sm">
             <ThemePreview effectiveColors={effectiveColors} />
          </Panel>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-6 pt-4 border-t border-msx-border flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex space-x-2">
            <Button onClick={handleExportConfig} variant="secondary" size="md">Export JSON</Button>
            <Button onClick={handleImportClick} variant="secondary" size="md">Import JSON</Button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportConfig} className="hidden" />
          </div>
          <div className="flex space-x-2">
            <Button onClick={resetToDefault} variant="danger" size="md">Reset to Default</Button>
            <Button onClick={onClose} variant="primary" size="md">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
