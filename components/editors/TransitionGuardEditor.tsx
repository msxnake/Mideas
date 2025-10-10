import React, { useState, useMemo } from 'react';
import { TransitionGuard } from '../../statemachine.types';
import { MideasGlobalVariable } from '../../constants';
import { ProjectAsset } from '../../types';

interface TransitionGuardEditorProps {
  guard?: TransitionGuard;
  onGuardChange: (guard: TransitionGuard | undefined) => void;
  allAssets?: ProjectAsset[];
}

export const TransitionGuardEditor: React.FC<TransitionGuardEditorProps> = ({ guard, onGuardChange, allAssets = [] }) => {
  const [enabled, setEnabled] = useState(!!guard);

  // Get all GlobalVariables assets from the project
  const globalVariablesAssets = useMemo(() =>
    allAssets.filter(asset => asset.type === 'globalvariables'),
    [allAssets]
  );

  // Selected GlobalVariables asset ID
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    globalVariablesAssets[0]?.id || ''
  );

  // Get custom variables from selected asset
  const customVariables = useMemo(() => {
    if (!selectedAssetId) return [];
    const asset = globalVariablesAssets.find(a => a.id === selectedAssetId);
    if (!asset || !asset.data) return [];
    return ((asset.data as any).customVariables || []) as MideasGlobalVariable[];
  }, [selectedAssetId, globalVariablesAssets]);

  const [variableName, setVariableName] = useState(guard?.variableName || customVariables[0]?.name || '');
  const [operator, setOperator] = useState(guard?.operator || '==');
  const [compareValue, setCompareValue] = useState(guard?.compareValue?.toString() || '0');

  const selectedVariable = customVariables.find(v => v.name === variableName);
  const availableValues = selectedVariable?.values || [];

  // Determine if we need a number input (for byte/word types or variables with 'number' value)
  const isNumericInput =
    selectedVariable?.type === 'byte' ||
    selectedVariable?.type === 'word' ||
    (availableValues.length > 0 && availableValues[0].value === 'number');

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onGuardChange(undefined);
    } else {
      onGuardChange({
        variableName,
        operator: operator as any,
        compareValue
      });
    }
  };

  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);

    // Reset to first variable of new asset
    const asset = globalVariablesAssets.find(a => a.id === assetId);
    if (asset && asset.data) {
      const vars = ((asset.data as any).customVariables || []) as MideasGlobalVariable[];
      if (vars.length > 0) {
        const firstVar = vars[0];
        setVariableName(firstVar.name);
        const newCompareValue = getDefaultCompareValue(firstVar);
        setCompareValue(newCompareValue);

        if (enabled) {
          onGuardChange({
            variableName: firstVar.name,
            operator: operator as any,
            compareValue: newCompareValue
          });
        }
      }
    }
  };

  const getDefaultCompareValue = (variable: MideasGlobalVariable): string => {
    if (variable.type === 'boolean') return 'true';
    if (variable.type === 'byte' || variable.type === 'word') return '0';
    if (variable.type === 'string') return '';
    if (variable.values && variable.values.length > 0) {
      return variable.values[0].value === 'number' ? '0' : variable.values[0].label;
    }
    return '0';
  };

  const handleVariableChange = (newVariable: string) => {
    setVariableName(newVariable);

    const variable = customVariables.find(v => v.name === newVariable);
    const newCompareValue = variable ? getDefaultCompareValue(variable) : '0';
    setCompareValue(newCompareValue);

    if (enabled) {
      onGuardChange({
        variableName: newVariable,
        operator: operator as any,
        compareValue: newCompareValue
      });
    }
  };

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    if (enabled) {
      onGuardChange({
        variableName,
        operator: newOperator as any,
        compareValue
      });
    }
  };

  const handleCompareValueChange = (newValue: string) => {
    setCompareValue(newValue);
    if (enabled) {
      onGuardChange({
        variableName,
        operator: operator as any,
        compareValue: newValue
      });
    }
  };

  // Group variables by category
  const variablesByCategory = customVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, typeof customVariables>);

  const categoryLabels: Record<string, string> = {
    objective: '🎯 Objectives',
    score: '💯 Score',
    player: '👤 Player',
    inventory: '🎒 Inventory',
    progress: '🗺️ Progress',
    time: '⏱️ Time',
    difficulty: '⚡ Difficulty',
    special: '⭐ Special',
    custom: '🔧 Custom'
  };

  // Show message if no GlobalVariables assets exist
  if (globalVariablesAssets.length === 0) {
    return (
      <div className="space-y-3 p-3 bg-msx-bgcolor-darker rounded border border-msx-border">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="guard-enabled"
            checked={false}
            disabled
            className="w-4 h-4"
          />
          <label htmlFor="guard-enabled" className="text-sm font-bold text-msx-textsecondary cursor-not-allowed">
            Add Condition (Guard)
          </label>
        </div>
        <p className="text-xs text-msx-textsecondary italic">
          ⚠️ No GlobalVariables assets found. Create a GlobalVariables asset first to use guards.
        </p>
      </div>
    );
  }

  // Show message if selected asset has no custom variables
  if (customVariables.length === 0) {
    return (
      <div className="space-y-3 p-3 bg-msx-bgcolor-darker rounded border border-msx-border">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="guard-enabled"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="guard-enabled" className="text-sm font-bold text-msx-textcolor cursor-pointer">
            Add Condition (Guard)
          </label>
        </div>

        {/* Asset Selection */}
        <div>
          <label className="block text-xs font-medium text-msx-textsecondary mb-1">
            GlobalVariables Asset:
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => handleAssetChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
          >
            {globalVariablesAssets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-msx-textsecondary italic">
          ⚠️ No custom variables defined in this asset. Add variables in the GlobalVariables editor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-msx-bgcolor-darker rounded border border-msx-border">
      {/* Enable/Disable Guard */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="guard-enabled"
          checked={enabled}
          onChange={(e) => handleEnabledChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="guard-enabled" className="text-sm font-bold text-msx-textcolor cursor-pointer">
          Add Condition (Guard)
        </label>
      </div>

      {enabled && (
        <>
          {/* GlobalVariables Asset Selection */}
          <div>
            <label className="block text-xs font-medium text-msx-textsecondary mb-1">
              GlobalVariables Asset:
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
            >
              {globalVariablesAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-msx-textsecondary mt-1 italic">
              Select which GlobalVariables asset to use
            </p>
          </div>

          {/* Variable Selection (grouped by category) */}
          <div>
            <label className="block text-xs font-medium text-msx-textsecondary mb-1">
              Variable:
            </label>
            <select
              value={variableName}
              onChange={(e) => handleVariableChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
            >
              {Object.entries(variablesByCategory).map(([category, variables]) => (
                <optgroup key={category} label={categoryLabels[category] || category}>
                  {variables.map(variable => (
                    <option key={variable.name} value={variable.name}>
                      {variable.name} ({variable.type})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedVariable && (
              <p className="text-xs text-msx-textsecondary mt-1">
                {selectedVariable.description}
              </p>
            )}
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-xs font-medium text-msx-textsecondary mb-1">
              Operator:
            </label>
            <select
              value={operator}
              onChange={(e) => handleOperatorChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
            >
              <option value="==">== (equals)</option>
              <option value="!=">!= (not equals)</option>
              {selectedVariable?.type !== 'boolean' && selectedVariable?.type !== 'string' && (
                <>
                  <option value=">">&gt; (greater)</option>
                  <option value="<">&lt; (less)</option>
                  <option value=">=">&gt;= (greater or equal)</option>
                  <option value="<=">&lt;= (less or equal)</option>
                </>
              )}
            </select>
          </div>

          {/* Compare Value Selection */}
          <div>
            <label className="block text-xs font-medium text-msx-textsecondary mb-1">
              Compare Value:
            </label>

            {/* Boolean type */}
            {selectedVariable?.type === 'boolean' && (
              <select
                value={compareValue}
                onChange={(e) => handleCompareValueChange(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            )}

            {/* String type */}
            {selectedVariable?.type === 'string' && (
              <input
                type="text"
                value={compareValue}
                onChange={(e) => handleCompareValueChange(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
                placeholder="Enter string value"
              />
            )}

            {/* Numeric types (byte/word) or numeric custom values */}
            {isNumericInput && selectedVariable?.type !== 'boolean' && selectedVariable?.type !== 'string' && (
              <>
                {availableValues.length > 0 && availableValues[0].value !== 'number' ? (
                  // Has predefined values (enum-like)
                  <select
                    value={compareValue}
                    onChange={(e) => handleCompareValueChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
                  >
                    {availableValues.map(val => (
                      <option key={val.label} value={val.label}>
                        {val.label} ({val.value})
                      </option>
                    ))}
                  </select>
                ) : (
                  // Free numeric input
                  <div>
                    <input
                      type="number"
                      value={compareValue}
                      onChange={(e) => handleCompareValueChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
                      placeholder="Enter number"
                      min={0}
                      max={selectedVariable?.type === 'word' ? 65535 : 255}
                    />
                    <p className="text-xs text-msx-textsecondary mt-1">
                      Range: 0-{selectedVariable?.type === 'word' ? '65535' : '255'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preview */}
          <div className="p-2 bg-msx-bgcolor border border-msx-primary rounded">
            <p className="text-xs text-msx-textsecondary mb-1">Guard Preview:</p>
            <p className="text-xs font-mono text-msx-primary font-bold">
              IF {variableName} {operator} {compareValue}
            </p>
            <p className="text-xs text-msx-textsecondary mt-1 italic">
              ⚠️ Transition only occurs if this condition is TRUE
            </p>
          </div>
        </>
      )}
    </div>
  );
};
