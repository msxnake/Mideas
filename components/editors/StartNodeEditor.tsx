import React from 'react';
import { GameFlowStartNode, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { GameFlowGlobalInitializationEditor } from './GameFlowGlobalInitializationEditor';

interface StartNodeEditorProps {
  node: GameFlowStartNode;
  onNodeChange: (newNode: GameFlowStartNode) => void;
  allAssets?: ProjectAsset[];
}

export const StartNodeEditor: React.FC<StartNodeEditorProps> = ({
  node,
  onNodeChange,
  allAssets = [],
}) => {
  const initGlobals = node.initializeGlobals || { enabled: false, variables: [] };
  const systemConfig = node.systemConfig || {
    initPSG: true,
    clearSprites: true,
    clearVRAM: false,
    resetVDP: false,
    initialDelayFrames: 0,
  };

  const handleSystemConfigChange = (key: keyof typeof systemConfig, value: boolean | number) => {
    onNodeChange({
      ...node,
      systemConfig: {
        ...systemConfig,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4 p-4">
      <Panel title="Game Initialization">
        <p className="text-sm text-msx-textsecondary mb-4">
          Configure what happens when the game starts. This is the central initialization point.
        </p>
      </Panel>

      <GameFlowGlobalInitializationEditor
        config={node.initializeGlobals}
        onChange={(initializeGlobals) => onNodeChange({ ...node, initializeGlobals })}
        allAssets={allAssets}
        enabledLabel="Initialize global variables at game start"
        disabledHint="If disabled, variables keep their current values until another node changes them"
      />

      <Panel title="MSX System Initialization">
        <p className="text-xs text-msx-textsecondary mb-3">
          Configure which MSX hardware systems to initialize at game start
        </p>

        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.initPSG}
              onChange={(e) => handleSystemConfigChange('initPSG', e.target.checked)}
              className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
            />
            <div className="flex-1">
              <span className="text-sm">Initialize PSG (Silence sound channels)</span>
              <p className="text-xs text-msx-textsecondary">Silences PSG channels A, B, C</p>
            </div>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.clearSprites}
              onChange={(e) => handleSystemConfigChange('clearSprites', e.target.checked)}
              className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
            />
            <div className="flex-1">
              <span className="text-sm">Clear Sprite Table</span>
              <p className="text-xs text-msx-textsecondary">Clears sprite attribute table (moves all sprites off-screen)</p>
            </div>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.clearVRAM}
              onChange={(e) => handleSystemConfigChange('clearVRAM', e.target.checked)}
              className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
            />
            <div className="flex-1">
              <span className="text-sm">Clear VRAM Areas</span>
              <p className="text-xs text-msx-textsecondary">Clears pattern and color tables (slow, usually not needed)</p>
            </div>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.resetVDP}
              onChange={(e) => handleSystemConfigChange('resetVDP', e.target.checked)}
              className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
            />
            <div className="flex-1">
              <span className="text-sm">Reset VDP Registers</span>
              <p className="text-xs text-msx-textsecondary">Resets VDP to default configuration (usually not needed)</p>
            </div>
          </label>

          <div className="pt-2 border-t border-msx-border">
            <label className="block text-sm mb-2">Initial Delay (frames)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="300"
                value={systemConfig.initialDelayFrames || 0}
                onChange={(e) => handleSystemConfigChange('initialDelayFrames', Number(e.target.value))}
                className="w-24 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
              />
              <span className="text-xs text-msx-textsecondary">
                ({((systemConfig.initialDelayFrames || 0) / 60).toFixed(2)}s at 60fps)
              </span>
            </div>
            <p className="text-xs text-msx-textsecondary mt-1">
              Delay before continuing to next node (useful for logos/intros)
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Generated ASM Code">
        <p className="text-xs text-msx-textsecondary">
          This Start node will generate a <code className="bg-msx-border px-1 rounded">gameflow_node_start_XXX_init</code> routine
          that will:
        </p>
        <ul className="text-xs text-msx-textsecondary mt-2 space-y-1 list-disc list-inside">
          {systemConfig.initPSG && <li>Call init_psg_silence</li>}
          {systemConfig.clearSprites && <li>Call clear_sprite_table</li>}
          {systemConfig.clearVRAM && <li>Call clear_vram_areas</li>}
          {systemConfig.resetVDP && <li>Call reset_vdp_registers</li>}
          {initGlobals.enabled && (
            <li>
              Initialize {(initGlobals.variables || []).length > 0
                ? `${initGlobals.variables.length} variable(s)`
                : 'all global variables'}
            </li>
          )}
          {(systemConfig.initialDelayFrames || 0) > 0 && (
            <li>Wait {systemConfig.initialDelayFrames} frames</li>
          )}
        </ul>
      </Panel>
    </div>
  );
};
