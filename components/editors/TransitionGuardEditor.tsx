import React, { useState, useMemo } from 'react';
import { TransitionGuard } from '../../statemachine.types';
import { MIDEAS_GLOBAL_VARIABLES } from '../../constants';
import { ProjectAsset } from '../../types';
import { getAllGlobalVariables } from '../../utils/globalVariablesUtils';

interface TransitionGuardEditorProps {
  guard?: TransitionGuard;
  onGuardChange: (guard: TransitionGuard | undefined) => void;
  allAssets?: ProjectAsset[];
}

export const TransitionGuardEditor: React.FC<TransitionGuardEditorProps> = ({ guard, onGuardChange, allAssets = [] }) => {
  const [enabled, setEnabled] = useState(!!guard);
  const [variableName, setVariableName] = useState(guard?.variableName || 'Goal');
  const [operator, setOperator] = useState(guard?.operator || '==');
  const [compareValue, setCompareValue] = useState(guard?.compareValue?.toString() || 'Completed');

  // Get all variables (default + custom)
  const allVariables = useMemo(() => getAllGlobalVariables(allAssets), [allAssets]);

  const selectedVariable = allVariables.find(v => v.name === variableName);
  const availableValues = selectedVariable?.values || [];
  const isCustomValue = availableValues.length > 0 && availableValues[0].value === 'number';

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

  const handleVariableChange = (newVariable: string) => {
    setVariableName(newVariable);

    // Reset compare value to first available option
    const variable = allVariables.find(v => v.name === newVariable);
    const newCompareValue = variable?.values[0]?.value === 'number' ? '0' : (variable?.values[0]?.label || 'Completed');
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
  const variablesByCategory = allVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, typeof allVariables>);

  const categoryLabels: Record<string, string> = {
    objective: '🎯 Objectives',
    score: '💯 Score',
    player: '👤 Player',
    inventory: '🎒 Inventory',
    progress: '🗺️ Progress',
    time: '⏱️ Time',
    difficulty: '⚡ Difficulty',
    special: '⭐ Special'
  };

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
          {/* Variable Selection */}
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
                      {variable.name}
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
              <option value=">">&gt; (greater)</option>
              <option value="<">&lt; (less)</option>
              <option value=">=">&gt;= (greater or equal)</option>
              <option value="<=">&lt;= (less or equal)</option>
            </select>
          </div>

          {/* Compare Value Selection */}
          <div>
            <label className="block text-xs font-medium text-msx-textsecondary mb-1">
              Compare Value:
            </label>
            {isCustomValue ? (
              <div>
                <input
                  type="number"
                  value={compareValue}
                  onChange={(e) => handleCompareValueChange(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
                  placeholder="Enter number"
                  min={selectedVariable?.type === '16bit' ? 0 : 0}
                  max={selectedVariable?.type === '16bit' ? 65535 : 255}
                />
                <p className="text-xs text-msx-textsecondary mt-1">
                  Range: 0-{selectedVariable?.type === '16bit' ? '65535' : '255'}
                </p>
              </div>
            ) : (
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
