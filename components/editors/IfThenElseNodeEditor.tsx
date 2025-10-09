import React, { useState, useEffect, useMemo } from 'react';
import { GameFlowIfThenElseNode, ProjectAsset } from '../../types';
import { getAllGlobalVariables } from '../../utils/globalVariablesUtils';
import { Button } from '../common/Button';

interface IfThenElseNodeEditorProps {
  node: GameFlowIfThenElseNode;
  onNodeChange: (updatedNode: GameFlowIfThenElseNode) => void;
  allAssets: ProjectAsset[];
}

export const IfThenElseNodeEditor: React.FC<IfThenElseNodeEditorProps> = ({ node, onNodeChange, allAssets }) => {
  const [variableName, setVariableName] = useState(node.variableName || 'Goal');
  const [operator, setOperator] = useState(node.operator || '==');
  const [compareValue, setCompareValue] = useState(node.compareValue || 'Completed');
  const [customValue, setCustomValue] = useState('');

  // Get all variables (default + custom)
  const allVariables = useMemo(() => getAllGlobalVariables(allAssets), [allAssets]);

  const selectedVariable = allVariables.find(v => v.name === variableName);
  const availableValues = selectedVariable?.values || [];
  const isCustomValue = availableValues.length > 0 && availableValues[0].value === 'number';

  useEffect(() => {
    // If current compareValue is not in available values, treat as custom
    if (isCustomValue && !isNaN(Number(compareValue))) {
      setCustomValue(compareValue);
    }
  }, [variableName, compareValue, isCustomValue]);

  const handleVariableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariable = e.target.value;
    setVariableName(newVariable);

    // Reset compare value to first available option
    const variable = allVariables.find(v => v.name === newVariable);
    if (variable && variable.values.length > 0) {
      if (variable.values[0].value === 'number') {
        setCompareValue('0');
        setCustomValue('0');
      } else {
        setCompareValue(variable.values[0].label);
      }
    }

    onNodeChange({
      ...node,
      variableName: newVariable,
      compareValue: variable?.values[0]?.value === 'number' ? '0' : (variable?.values[0]?.label || 'Completed'),
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

    // Validate numeric input
    if (!isNaN(Number(newValue))) {
      setCompareValue(newValue);
      onNodeChange({ ...node, compareValue: newValue });
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
    score: '💯 Score & Points',
    player: '👤 Player State',
    inventory: '🎒 Inventory',
    progress: '🗺️ Progress',
    time: '⏱️ Time',
    difficulty: '⚡ Difficulty',
    special: '⭐ Special'
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-bold text-msx-textcolor">Configure If-Then-Else Condition</h3>

      {/* Variable Selection */}
      <div>
        <label className="block text-sm font-medium text-msx-textcolor mb-1">
          Variable:
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
                  {variable.name} ({variable.type === '16bit' ? '16-bit' : '8-bit'})
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
        {isCustomValue ? (
          <div>
            <input
              type="number"
              value={customValue}
              onChange={handleCustomValueChange}
              className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
              placeholder="Enter number"
              min={selectedVariable?.type === '16bit' ? 0 : 0}
              max={selectedVariable?.type === '16bit' ? 65535 : 255}
            />
            <p className="text-xs text-msx-textcolor opacity-70 mt-1">
              Range: 0-{selectedVariable?.type === '16bit' ? '65535' : '255'}
            </p>
          </div>
        ) : (
          <select
            value={compareValue}
            onChange={handleCompareValueChange}
            className="w-full px-3 py-2 bg-msx-bgcolor border border-msx-border text-msx-textcolor rounded pixel-font"
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
