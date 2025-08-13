import React from 'react';
import { ThemeConfig, ColorKeys } from '../../contexts/ThemeContext'; 
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { TilesetIcon, PlayIcon } from '../icons/MsxIcons';

interface ThemePreviewProps {
  effectiveColors: Record<ColorKeys, string>;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ effectiveColors }) => {
  // Create a style object for the preview elements
  const previewStyle = {
    '--msx-bgcolor': effectiveColors.bgcolor,
    '--msx-panelbg': effectiveColors.panelbg,
    '--msx-accent': effectiveColors.accent,
    '--msx-highlight': effectiveColors.highlight,
    '--msx-textprimary': effectiveColors.textprimary,
    '--msx-textsecondary': effectiveColors.textsecondary,
    '--msx-border': effectiveColors.border,
    '--msx-danger': effectiveColors.danger,
    '--msx-warning': effectiveColors.warning,
  } as React.CSSProperties;

  return (
    <div className="p-3 border border-msx-border rounded-md bg-msx-bgcolor text-msx-textprimary" style={previewStyle}>
      <h4 className="text-sm font-semibold mb-2 text-msx-textprimary">Live Preview</h4>
      <div className="space-y-3">
        <Panel title="Sample Panel" icon={<TilesetIcon className="w-4 h-4" />}>
          <p className="text-xs text-msx-textsecondary mb-2">
            This is some text inside a panel. The colors should reflect your current theme settings.
          </p>
          <div className="flex space-x-2">
            <Button variant="primary" size="sm">Primary</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="danger" size="sm" icon={<PlayIcon className="w-3 h-3" />}>Run</Button>
          </div>
        </Panel>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-msx-textprimary">Primary Text</span>
          <span className="text-xs text-msx-textsecondary">Secondary Text</span>
          <span className="text-xs text-msx-accent">Accent Text</span>
          <span className="text-xs text-msx-highlight">Highlight Text</span>
        </div>

        <div className="p-2 bg-msx-panelbg border border-msx-border rounded">
            <input 
                type="text" 
                defaultValue="Input Field" 
                className="w-full p-1.5 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            />
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;
