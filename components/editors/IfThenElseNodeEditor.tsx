import React, { useState, useEffect, useMemo } from 'react';
import { GameFlowIfThenElseNode, ProjectAsset } from '../../types';
import { getCustomGlobalVariables } from '../../utils/globalVariablesUtils';
import { Button } from '../common/Button';

interface IfThenElseNodeEditorProps {
  node: GameFlowIfThenElseNode;
  onNodeChange: (updatedNode: GameFlowIfThenElseNode) => void;
  allAssets: ProjectAsset[];
}

export const IfThenElseNodeEditor: React.FC<IfThenElseNodeEditorProps> = ({ node, onNodeChange, allAssets }) => {
  // Get only custom variables (NOT defaults)
  const customVariables = useMemo(() => getCustomGlobalVariables(allAssets), [allAssets]);

  // Set default to first custom variable if available, otherwise empty
  const defaultVariableName = customVariables.length > 0 ? customVariables[0].name : '';

  const [variableName, setVariableName] = useState(node.variableName || defaultVariableName);
  const [operator, setOperator] = useState(node.operator || '==');
  const [compareValue, setCompareValue] = useState(node.compareValue || '');
  const [customValue, setCustomValue] = useState('');

  // Use custom variables instead of all variables
  const allVariables = customVariables;

  const selectedVariable = allVariables.find(v => v.name === variableName);
  const availableValues = selectedVariable?.values || [];
  // Decide input mode primarily by the variable type
  const varType = (selectedVariable?.type || '').toLowerCase();
  const isNumeric = varType === 'byte' || varType === 'word' || varType === '8bit' || varType === '16bit';
  const isBoolean = varType === 'boolean';
  const isString = varType === 'string';
  // Backward compatibility: some numeric variables expose values[0] = { value: 'number' }
  const isCustomValue = isNumeric || (availableValues.length > 0 && (availableValues[0] as any).value === 'number');

  useEffect(() => {
    // Keep the UI field in sync for custom inputs
    if (isCustomValue || isString) {
      setCustomValue(compareValue ?? '');
    }
  }, [variableName, compareValue, isCustomValue, isString]);

  const handleVariableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariable = e.target.value;
    setVariableName(newVariable);

    // Reset compare value depending on variable type and available values
    const variable = allVariables.find(v => v.name === newVariable);
    const nextType = (variable?.type || '').toLowerCase();
    let nextCompare = '';
    if (nextType === 'boolean') {
      nextCompare = (variable?.values?.[0]?.label?.toString()) || 'False';
    } else if (nextType === 'string') {
      nextCompare = '';
    } else if (nextType === 'byte' || nextType === '8bit' || nextType === 'word' || nextType === '16bit') {
      nextCompare = '0';
    } else if (variable && variable.values && variable.values.length > 0) {
      nextCompare = variable.values[0].label.toString();
    }

    setCompareValue(nextCompare);
    setCustomValue(nextCompare);

    onNodeChange({
      ...node,
      variableName: newVariable,
      compareValue: nextCompare,
      operator: '=='
    });
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as '==' | '!=' | '>' | '<' | '>=' | '<=';
    setOperator(newOperator);
    onNodeChange({ ...node, operator: newOperator });
  };

  const handleCompareValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setCompareValue(newValue);
    onNodeChange({ ...node, compareValue: newValue });
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);

    // For string variables, accept free text
    if (isString) {
      setCompareValue(newValue);
      onNodeChange({ ...node, compareValue: newValue });
      return;
    }

    // For numeric variables, accept positive and negative integers only
    if (/^-?\d*$/.test(newValue)) {
      setCompareValue(newValue);
      // Persist only when it's a complete integer (not just '-')
      if (/^-?\d+$/.test(newValue)) {
        onNodeChange({ ...node, compareValue: newValue });
      }
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
    objective: 'Objectives',
    score: 'Score & Points',
    player: 'Player State',
    inventory: 'Inventory',
    progress: 'Progress',
    time: 'Time',
    difficulty: 'Difficulty',
    special: 'Special'
  };

  // Check if there are no custom variables
  if (customVariables.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <h3 className="text-lg font-bold text-msx-textcolor">Configure If-Then-Else Condition</h3>

        <div className="p-4 bg-yellow-900/30 border border-yellow-600 rounded">
          <p className="text-sm text-yellow-300 mb-2">⚠️ No custom variables found</p>
          <p className="text-xs text-msx-textcolor opacity-70">
            To use IfThenElse conditions, you need to create custom variables in the GlobalVariables asset first.
          </p>
          <p className="text-xs text-msx-textcolor opacity-70 mt-2">
            Go to: Assets → GlobalVariables → Add custom variable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-bold text-msx-textcolor">Configure If-Then-Else Condition</h3>

      {/* Variable Selection */}
      <div>
        <label className="block text-sm font-medium text-msx-textcolor mb-1">
          Variable (Custom only):
        </label>
        <select
          value={variableName}
          onChange={handleVariableChange}
          className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
        >
          {Object.entries(variablesByCategory).map(([category, variables]) => (
            <optgroup key={category} label={categoryLabels[category] || category}>
              {variables.map(variable => (
                <option key={variable.name} value={variable.name}>
                  {variable.name} ({(['word','16bit'] as any).includes((variable as any).type) ? '16-bit' : '8-bit'})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedVariable && (
          <p className="text-xs text-msx-textcolor opacity-70 mt-1">
            {selectedVariable.description}
          </p>
        )}
      </div>

      {/* Operator Selection */}
      <div>
        <label className="block text-sm font-medium text-msx-textcolor mb-1">
          Operator:
        </label>
        <select
          value={operator}
          onChange={handleOperatorChange}
          className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
        >
          <option value="==">== (equals)</option>
          <option value="!=">!= (not equals)</option>
          <option value=">"> &gt; (greater than)</option>
          <option value="<">&lt; (less than)</option>
          <option value=">=">&gt;= (greater or equal)</option>
          <option value="<=">&lt;= (less or equal)</option>
        </select>
      </div>

      {/* Compare Value Selection */}
      <div>
        <label className="block text-sm font-medium text-msx-textcolor mb-1">
          Compare Value:
        </label>
        {isString ? (
          <div>
            <input
              type="text"
              value={customValue}
              onChange={handleCustomValueChange}
              className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
              placeholder={'Enter text'}
            />
          </div>
        ) : isCustomValue && !isBoolean ? (
          <div>
            <input
              type={'text'}
              value={customValue}
              onChange={handleCustomValueChange}
              className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
              placeholder={'Enter number (e.g., -5, 42)'}
            />
            <p className="text-xs text-msx-textcolor opacity-70 mt-1">Accepts positive and negative integers</p>
          </div>
        ) : isBoolean ? (
          <select
            value={compareValue || 'False'}
            onChange={handleCompareValueChange}
            className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
          >
            {(availableValues.length > 0 ? availableValues : [
              { label: 'False', value: 0 },
              { label: 'True', value: 1 },
            ]).map((val: any) => (
              <option key={String(val.label)} value={String(val.label)}>{String(val.label)}</option>
            ))}
          </select>
        ) : (
          <select
            value={compareValue}
            onChange={handleCompareValueChange}
            className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
          >
            {availableValues.length > 0 ? (
              availableValues.map((val: any) => (
                <option key={String(val.label)} value={String(val.label)}>
                  {String(val.label)}{(val.value !== undefined && val.value !== null && val.value !== 'number') ? ` (${val.value})` : ''}
                </option>
              ))
            ) : (
              <option value="">-- enter value --</option>
            )}
          </select>
        )}
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-msx-bgcolor border border-msx-border rounded">
        <p className="text-xs text-msx-textcolor opacity-70 mb-1">Condition Preview:</p>
        <p className="text-sm font-mono text-msx-textcolor font-bold">
          IF {variableName} {operator} {compareValue}
        </p>
        <p className="text-xs text-msx-textcolor opacity-70 mt-2">
          ASM: {selectedVariable?.asmName}
        </p>
      </div>
    </div>
  );
};
