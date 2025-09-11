import React, { useState } from 'react';
import { Condition, ConditionType, ConditionTypes } from '../../../statemachine.types';
import { Button } from '../../common/Button';

interface ConditionBuilderProps {
  onUpdate: (condition: Condition | null) => void;
  condition: Condition;
  level?: number;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ onUpdate, condition, level = 0 }) => {

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ConditionType;
    const newCondition: Condition = { type: newType };

    if (newType === 'AND' || newType === 'OR' || newType === 'XOR') {
      newCondition.conditions = [{ type: ConditionTypes.KEY_PRESSED, params: { key: '' } }];
    } else if (newType === 'NOT') {
      newCondition.conditions = [{ type: ConditionTypes.KEY_PRESSED, params: { key: '' } }];
    } else {
      newCondition.params = {};
    }
    onUpdate(newCondition);
  };

  const handleParamChange = (paramName: string, value: any) => {
    const newCondition = { ...condition, params: { ...condition.params, [paramName]: value } };
    onUpdate(newCondition);
  };

  const handleSubConditionUpdate = (index: number, subCondition: Condition | null) => {
    if (!condition.conditions) return;

    const newSubConditions = [...condition.conditions];
    if (subCondition === null) { // Deletion
      newSubConditions.splice(index, 1);
    } else { // Update
      newSubConditions[index] = subCondition;
    }
    onUpdate({ ...condition, conditions: newSubConditions });
  };

  const addSubCondition = () => {
    if (!condition.conditions) return;
    const newSubConditions = [...condition.conditions, { type: ConditionTypes.KEY_PRESSED, params: { key: '' } }];
    onUpdate({ ...condition, conditions: newSubConditions });
  };

  const renderParams = () => {
    switch (condition.type) {
      case ConditionTypes.KEY_PRESSED:
      case ConditionTypes.KEY_RELEASED:
        return (
          <input
            type="text"
            placeholder="Key (e.g. 'ArrowUp')"
            value={condition.params?.key || ''}
            onChange={(e) => handleParamChange('key', e.target.value)}
            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
          />
        );
      case ConditionTypes.VARIABLE_EQUALS:
      case ConditionTypes.VARIABLE_GREATER:
        return (
          <div className="flex space-x-1">
            <input
              type="text"
              placeholder="Variable Name"
              value={condition.params?.variable || ''}
              onChange={(e) => handleParamChange('variable', e.target.value)}
              className="w-1/2 p-1 bg-msx-bgcolor border-msx-border rounded"
            />
            <input
              type="text"
              placeholder="Value"
              value={condition.params?.value || ''}
              onChange={(e) => handleParamChange('value', e.target.value)}
              className="w-1/2 p-1 bg-msx-bgcolor border-msx-border rounded"
            />
          </div>
        );
      // TODO: Add editors for other condition types
      default:
        return null;
    }
  };

  const isComposite = condition.type === 'AND' || condition.type === 'OR' || condition.type === 'XOR' || condition.type === 'NOT';

  const convertToComposite = (logicalOperator: 'AND' | 'OR' | 'XOR' | 'NOT') => {
    if (logicalOperator === 'NOT') {
      onUpdate({ type: logicalOperator, conditions: [condition] });
    } else {
      onUpdate({ type: logicalOperator, conditions: [condition, { type: ConditionTypes.KEY_PRESSED, params: { key: '' } }] });
    }
  };

  // Visual styling based on nesting level
  const getNestedStyling = (level: number) => {
    const baseClasses = 'p-2 rounded space-y-2';
    const borderColors = [
      'border border-msx-border', // Level 0 - main border
      'ml-3 border-l-2 border-blue-400', // Level 1 - blue
      'ml-3 border-l-2 border-green-400', // Level 2 - green  
      'ml-3 border-l-2 border-yellow-400', // Level 3 - yellow
      'ml-3 border-l-2 border-red-400', // Level 4 - red
      'ml-3 border-l-2 border-purple-400', // Level 5+ - purple
    ];
    
    const borderClass = level < borderColors.length ? borderColors[level] : borderColors[borderColors.length - 1];
    return `${baseClasses} ${borderClass}`;
  };

  // Limit deep nesting to prevent UI issues (max 5 levels)
  const maxNestingLevel = 5;
  const canAddLogicalOperators = level < maxNestingLevel;

  return (
    <div className={getNestedStyling(level)}>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-msx-textsecondary opacity-60">L{level}</span>
        <select value={condition.type} onChange={handleTypeChange} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded text-sm">
          {Object.values(ConditionTypes).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <Button onClick={() => onUpdate(null)} variant="danger" size="sm" title="Remove Condition">X</Button>
      </div>
      
      {isComposite ? (
        <div className="space-y-2">
          {condition.conditions?.map((sub, index) => (
            <div key={index} className="space-y-1">
              <ConditionBuilder 
                condition={sub} 
                onUpdate={(sc) => handleSubConditionUpdate(index, sc)} 
                level={level + 1} 
              />
              {/* Logical Operators for sub-conditions - Only show for simple conditions and within nesting limits */}
              {canAddLogicalOperators && sub.type !== 'AND' && sub.type !== 'OR' && sub.type !== 'XOR' && sub.type !== 'NOT' && (
                <div className={`flex gap-1 ${level > 0 ? 'ml-4' : ''}`}>
                  <Button 
                    onClick={() => {
                      const newSubCondition = { type: 'AND' as const, conditions: [sub, { type: ConditionTypes.KEY_PRESSED, params: { key: '' } }] };
                      handleSubConditionUpdate(index, newSubCondition);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    + AND
                  </Button>
                  <Button 
                    onClick={() => {
                      const newSubCondition = { type: 'OR' as const, conditions: [sub, { type: ConditionTypes.KEY_PRESSED, params: { key: '' } }] };
                      handleSubConditionUpdate(index, newSubCondition);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    + OR
                  </Button>
                  <Button 
                    onClick={() => {
                      const newSubCondition = { type: 'XOR' as const, conditions: [sub, { type: ConditionTypes.KEY_PRESSED, params: { key: '' } }] };
                      handleSubConditionUpdate(index, newSubCondition);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    + XOR
                  </Button>
                  <Button 
                    onClick={() => {
                      const newSubCondition = { type: 'NOT' as const, conditions: [sub] };
                      handleSubConditionUpdate(index, newSubCondition);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    + NOT
                  </Button>
                </div>
              )}
              {/* Show nesting limit message */}
              {!canAddLogicalOperators && sub.type !== 'AND' && sub.type !== 'OR' && sub.type !== 'XOR' && sub.type !== 'NOT' && (
                <div className="ml-4">
                  <span className="text-xs text-msx-textsecondary opacity-60">
                    Max nesting depth reached (Level {maxNestingLevel})
                  </span>
                </div>
              )}
            </div>
          ))}
          <Button onClick={addSubCondition} size="sm">+ Add Condition</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {renderParams()}
          {/* Logical Operators - Show at root level or when within nesting limits */}
          {(level === 0 || canAddLogicalOperators) && (
            <div className="flex gap-1">
              <Button 
                onClick={() => convertToComposite('AND')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                + AND
              </Button>
              <Button 
                onClick={() => convertToComposite('OR')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                + OR
              </Button>
              <Button 
                onClick={() => convertToComposite('XOR')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                + XOR
              </Button>
              <Button 
                onClick={() => convertToComposite('NOT')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                + NOT
              </Button>
            </div>
          )}
          {/* Show nesting limit message for simple conditions */}
          {level > 0 && !canAddLogicalOperators && (
            <div>
              <span className="text-xs text-msx-textsecondary opacity-60">
                Max nesting depth reached (Level {maxNestingLevel})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
