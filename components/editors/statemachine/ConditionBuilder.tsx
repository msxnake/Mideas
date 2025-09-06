import React, { useState } from 'react';
import { Condition, ConditionType, ConditionTypes } from '../../../copia3';
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

    if (newType === 'AND' || newType === 'OR') {
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

  const isComposite = condition.type === 'AND' || condition.type === 'OR' || condition.type === 'NOT';

  return (
    <div className={`p-2 rounded space-y-2 ${level > 0 ? 'ml-4 border-l-2 border-msx-border' : 'border border-msx-border'}`}>
      <div className="flex items-center space-x-2">
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
            <ConditionBuilder 
              key={index} 
              condition={sub} 
              onUpdate={(sc) => handleSubConditionUpdate(index, sc)} 
              level={level + 1} 
            />
          ))}
          <Button onClick={addSubCondition} size="sm">+ Add Condition</Button>
        </div>
      ) : (
        <div>
          {renderParams()}
        </div>
      )}
    </div>
  );
};
