import React, { useMemo } from 'react';
import { GameFlowStartNode, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';
import { MideasGlobalVariable } from '../../constants';

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
  const globalVariablesAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'globalvariables'),
    [allAssets]
  );

  const customVariables = useMemo(() => {
    if (globalVariablesAssets.length === 0) return [];
    const asset = globalVariablesAssets[0];
    if (!asset?.data) return [];
    return ((asset.data as any).customVariables || []) as MideasGlobalVariable[];
  }, [globalVariablesAssets]);

  const initGlobals = node.initializeGlobals || { enabled: false, variables: [] };
  const systemConfig = node.systemConfig || {
    initPSG: true,
    clearSprites: true,
    clearVRAM: false,
    resetVDP: false,
    initialDelayFrames: 0,
  };

  const handleInitGlobalsEnabledChange = (enabled: boolean) => {
    onNodeChange({
      ...node,
      initializeGlobals: {
        ...initGlobals,
        enabled,
      },
    });
  };

  const handleAddVariable = () => {
    const defaultVar = customVariables[0];
    const newVar = {
      variableName: defaultVar?.name || 'score',
      value: defaultVar?.values?.[0]?.value || 0,
    };

    onNodeChange({
      ...node,
      initializeGlobals: {
        ...initGlobals,
        variables: [...(initGlobals.variables || []), newVar],
      },
    });
  };

  const handleDeleteVariable = (index: number) => {
    const updated = (initGlobals.variables || []).filter((_, i) => i !== index);
    onNodeChange({
      ...node,
      initializeGlobals: {
        ...initGlobals,
        variables: updated,
      },
    });
  };

  const handleVariableNameChange = (index: number, variableName: string) => {
    const variable = customVariables.find(v => v.name === variableName);
    const defaultValue = variable?.values?.[0]?.value || 0;

    const updated = (initGlobals.variables || []).map((v, i) =>
      i === index ? { variableName, value: defaultValue } : v
    );

    onNodeChange({
      ...node,
      initializeGlobals: {
        ...initGlobals,
        variables: updated,
      },
    });
  };

  const handleVariableValueChange = (index: number, value: number | boolean) => {
    const updated = (initGlobals.variables || []).map((v, i) =>
      i === index ? { ...v, value } : v
    );

    onNodeChange({
      ...node,
      initializeGlobals: {
        ...initGlobals,
        variables: updated,
      },
    });
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

      <Panel title="Initialize Global Variables">
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={initGlobals.enabled}
              onChange={(e) => handleInitGlobalsEnabledChange(e.target.checked)}
              className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
            />
            <span className="text-sm">Initialize global variables at game start</span>
          </label>
          {!initGlobals.enabled && (
            <p className="text-xs text-msx-textsecondary mt-2 italic">
              If disabled, variables will keep their default values
            </p>
          )}
        </div>

        {initGlobals.enabled && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-msx-textsecondary">
                {customVariables.length === 0
                  ? 'Create a Global Variables asset to configure initialization'
                  : 'Set initial values for your global variables'}
              </span>
              <Button
                onClick={handleAddVariable}
                size="sm"
                variant="secondary"
                icon={<PlusCircleIcon className="w-4 h-4" />}
                disabled={customVariables.length === 0}
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {(initGlobals.variables || []).map((v, index) => {
                const variable = customVariables.find(cv => cv.name === v.variableName);
                const isBoolean = variable?.type === 'boolean';

                return (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={v.variableName}
                      onChange={(e) => handleVariableNameChange(index, e.target.value)}
                      className="flex-1 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                      disabled={customVariables.length === 0}
                    >
                      {customVariables.map(variable => (
                        <option key={variable.name} value={variable.name}>
                          {variable.name} ({variable.type})
                        </option>
                      ))}
                    </select>

                    {isBoolean ? (
                      <select
                        value={v.value ? 'true' : 'false'}
                        onChange={(e) => handleVariableValueChange(index, e.target.value === 'true')}
                        className="w-32 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={Number(v.value)}
                        onChange={(e) => handleVariableValueChange(index, Number(e.target.value))}
                        className="w-32 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                        placeholder="0"
                      />
                    )}

                    <Button
                      onClick={() => handleDeleteVariable(index)}
                      size="sm"
                      variant="ghost"
                      icon={<TrashIcon className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}

              {(!initGlobals.variables || initGlobals.variables.length === 0) && (
                <div className="text-sm text-msx-textsecondary italic">
                  No variables configured. Click "Add" to initialize variables.
                </div>
              )}
            </div>

            <p className="text-xs text-msx-textsecondary mt-3 italic">
              💡 If no variables are specified, ALL global variables will be initialized to their first defined value
            </p>
          </>
        )}
      </Panel>

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
