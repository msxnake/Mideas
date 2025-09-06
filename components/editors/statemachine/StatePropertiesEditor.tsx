import React from 'react';
import { StateMachineState } from '../../../copia3';
import { Button } from '../../common/Button';

interface StatePropertiesEditorProps {
  state: StateMachineState;
  onUpdate: (properties: { [key: string]: any }) => void;
}

export const StatePropertiesEditor: React.FC<StatePropertiesEditorProps> = ({ state, onUpdate }) => {
  const properties = state.properties || {};

  const handlePropChange = (key: string, value: any) => {
    onUpdate({ ...properties, [key]: value });
  };

  const handleAddProp = () => {
    const newKey = `prop_${Object.keys(properties).length}`;
    onUpdate({ ...properties, [newKey]: '' });
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const newProps = { ...properties };
    const value = newProps[oldKey];
    delete newProps[oldKey];
    newProps[newKey] = value;
    onUpdate(newProps);
  };

  const handleDeleteProp = (key: string) => {
    const newProps = { ...properties };
    delete newProps[key];
    onUpdate(newProps);
  };

  return (
    <div className="space-y-2">
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} className="flex items-center space-x-2">
          <input
            type="text"
            value={key}
            onChange={(e) => handleKeyChange(key, e.target.value)}
            className="w-1/3 p-1 bg-msx-bgcolor-dark border-msx-border rounded text-sm"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handlePropChange(key, e.target.value)}
            className="w-2/3 p-1 bg-msx-bgcolor-dark border-msx-border rounded text-sm"
          />
          <Button onClick={() => handleDeleteProp(key)} variant="danger" size="sm">X</Button>
        </div>
      ))}
      <Button onClick={handleAddProp} size="sm">+ Add Property</Button>
    </div>
  );
};
