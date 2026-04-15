import React, { useEffect, useMemo } from 'react';
import { ProjectAsset, GameFlowGlobalInitializationConfig } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';
import { MideasGlobalVariable } from '../../constants';
import { getAllGlobalVariables } from '../../utils/globalVariablesUtils';

interface GameFlowGlobalInitializationEditorProps {
  config?: GameFlowGlobalInitializationConfig;
  onChange: (config: GameFlowGlobalInitializationConfig) => void;
  allAssets?: ProjectAsset[];
  title?: string;
  enabledLabel: string;
  disabledHint?: string;
  variableSource?: 'all' | 'custom';
}

const getDefaultVariableValue = (variable?: MideasGlobalVariable): number | boolean => {
  if (!variable) return 0;

  const rawValue = Array.isArray(variable.values) && variable.values.length > 0
    ? variable.values[0]?.value
    : 0;

  if (variable.type === 'boolean') {
    if (typeof rawValue === 'boolean') return rawValue;
    const normalized = String(rawValue ?? '').trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return false;
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? Math.trunc(numericValue) : 0;
};

export const GameFlowGlobalInitializationEditor: React.FC<GameFlowGlobalInitializationEditorProps> = ({
  config,
  onChange,
  allAssets = [],
  title = 'Initialize Global Variables',
  enabledLabel,
  disabledHint = 'If disabled, variables keep their current values',
  variableSource = 'custom',
}) => {
  const initGlobals = config || { enabled: false, variables: [] };
  const globalVariablesAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'globalvariables' && asset.data),
    [allAssets]
  );
  const selectedAssetId = initGlobals.globalVariablesAssetId || globalVariablesAssets[0]?.id || '';

  const availableVariables = useMemo(() => {
    if (variableSource === 'all') {
      return getAllGlobalVariables(allAssets);
    }

    if (!selectedAssetId) return [];

    const selectedAsset = globalVariablesAssets.find(asset => asset.id === selectedAssetId);
    if (!selectedAsset?.data) return [];

    return (((selectedAsset.data as any).customVariables || []) as MideasGlobalVariable[]).map((variable) => ({
      ...variable,
      name: variable.name?.trim?.() || variable.name,
    }));
  }, [allAssets, globalVariablesAssets, selectedAssetId, variableSource]);

  useEffect(() => {
    if (variableSource !== 'custom') return;
    if (initGlobals.globalVariablesAssetId || !globalVariablesAssets[0]?.id) return;

    onChange({
      ...initGlobals,
      globalVariablesAssetId: globalVariablesAssets[0].id,
    });
  }, [globalVariablesAssets, initGlobals, onChange, variableSource]);

  const handleEnabledChange = (enabled: boolean) => {
    onChange({
      ...initGlobals,
      enabled,
    });
  };

  const handleAssetChange = (globalVariablesAssetId: string) => {
    const selectedAsset = globalVariablesAssets.find(asset => asset.id === globalVariablesAssetId);
    const nextVariables = ((selectedAsset?.data as any)?.customVariables || []) as MideasGlobalVariable[];
    const fallbackVariable = nextVariables[0];

    onChange({
      ...initGlobals,
      globalVariablesAssetId,
      variables: (initGlobals.variables || []).map((entry) => {
        const stillExists = nextVariables.some(variable => variable.name === entry.variableName);
        if (stillExists) return entry;
        if (!fallbackVariable) return entry;

        return {
          variableName: fallbackVariable.name,
          value: getDefaultVariableValue(fallbackVariable),
        };
      }),
    });
  };

  const handleAddVariable = () => {
    const defaultVariable = availableVariables[0];
    if (!defaultVariable) return;

    onChange({
      ...initGlobals,
      variables: [
        ...(initGlobals.variables || []),
        {
          variableName: defaultVariable.name,
          value: getDefaultVariableValue(defaultVariable),
        },
      ],
    });
  };

  const handleDeleteVariable = (index: number) => {
    onChange({
      ...initGlobals,
      variables: (initGlobals.variables || []).filter((_, currentIndex) => currentIndex !== index),
    });
  };

  const handleVariableNameChange = (index: number, variableName: string) => {
    const nextVariable = availableVariables.find(variable => variable.name === variableName);

    onChange({
      ...initGlobals,
      variables: (initGlobals.variables || []).map((entry, currentIndex) =>
        currentIndex === index
          ? {
              variableName,
              value: getDefaultVariableValue(nextVariable),
            }
          : entry
      ),
    });
  };

  const handleVariableValueChange = (index: number, value: number | boolean) => {
    onChange({
      ...initGlobals,
      variables: (initGlobals.variables || []).map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, value } : entry
      ),
    });
  };

  return (
    <Panel title={title}>
      <div className="mb-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={initGlobals.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent"
          />
          <span className="text-sm">{enabledLabel}</span>
        </label>
        {!initGlobals.enabled && (
          <p className="text-xs text-msx-textsecondary mt-2 italic">
            {disabledHint}
          </p>
        )}
      </div>

      {initGlobals.enabled && (
        <>
          {variableSource === 'custom' && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-msx-textsecondary mb-1">
                Global Variables Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                disabled={globalVariablesAssets.length === 0}
              >
                {globalVariablesAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
              {globalVariablesAssets.length === 0 && (
                <p className="text-xs text-msx-textsecondary mt-1 italic">
                  Create a GlobalVariables asset first.
                </p>
              )}
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-msx-textsecondary">
              {availableVariables.length === 0
                ? 'The selected Global Variables asset has no user variables'
                : 'Set the values that should be applied when this node starts'}
            </span>
            <Button
              onClick={handleAddVariable}
              size="sm"
              variant="secondary"
              icon={<PlusCircleIcon className="w-4 h-4" />}
              disabled={availableVariables.length === 0}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {(initGlobals.variables || []).map((entry, index) => {
              const selectedVariable = availableVariables.find(variable => variable.name === entry.variableName);
              const isBoolean = selectedVariable?.type === 'boolean';

              return (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={entry.variableName}
                    onChange={(e) => handleVariableNameChange(index, e.target.value)}
                    className="flex-1 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                    disabled={availableVariables.length === 0}
                  >
                    {availableVariables.map(variable => (
                      <option key={variable.name} value={variable.name}>
                        {variable.name} ({variable.type})
                      </option>
                    ))}
                  </select>

                  {isBoolean ? (
                    <select
                      value={entry.value ? 'true' : 'false'}
                      onChange={(e) => handleVariableValueChange(index, e.target.value === 'true')}
                      className="w-32 bg-msx-bgcolor border border-msx-border text-white rounded px-2 py-1 focus:outline-none text-sm"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={Number(entry.value)}
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
                No variables configured. Click &quot;Add&quot; to initialize variables.
              </div>
            )}
          </div>

          <p className="text-xs text-msx-textsecondary mt-3 italic">
            If no variables are specified, the node falls back to its default initialization behavior.
          </p>
        </>
      )}
    </Panel>
  );
};
