import React from 'react';
import { Action, ActionTypes } from '../../../copia3';

interface ActionParamsEditorProps {
  action: Action;
  onUpdateParams: (params: { [key: string]: any }) => void;
}

const ParamInput = ({ label, value, onChange, type = "text" }) => (
  <div className="flex items-center space-x-2">
    <label className="text-xs text-gray-400 w-16">{label}</label>
    <input 
      type={type}
      value={value ?? ''}
      onChange={onChange}
      step={type === "number" ? "any" : undefined}
      className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
    />
  </div>
);

export const ActionParamsEditor: React.FC<ActionParamsEditorProps> = ({ action, onUpdateParams }) => {

  const handleParamChange = (paramName: string, value: any) => {
    onUpdateParams({ ...action.params, [paramName]: value });
  };

  const renderParams = () => {
    switch (action.type) {
      case ActionTypes.SET_POSITION:
      case ActionTypes.MOVE_BY:
      case ActionTypes.SET_VELOCITY:
      case ActionTypes.APPLY_FORCE:
        return (
          <div className="space-y-2">
            <ParamInput 
              label="X"
              type="number"
              value={action.params.x}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? 0 : parseFloat(val);
                handleParamChange('x', isNaN(parsedVal) ? 0 : parsedVal);
              }}
            />
            <ParamInput 
              label="Y"
              type="number"
              value={action.params.y}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? 0 : parseFloat(val);
                handleParamChange('y', isNaN(parsedVal) ? 0 : parsedVal);
              }}
            />
          </div>
        );

      case ActionTypes.CHANGE_SPRITE:
        return (
          <ParamInput 
            label="Sprite Name"
            value={action.params.sprite}
            onChange={(e) => handleParamChange('sprite', e.target.value)}
          />
        );

      case ActionTypes.PLAY_ANIMATION:
        return (
          <ParamInput 
            label="Animation Name"
            value={action.params.animation}
            onChange={(e) => handleParamChange('animation', e.target.value)}
          />
        );

      case ActionTypes.PLAY_SOUND:
        return (
          <ParamInput 
            label="Sound ID"
            value={action.params.soundId}
            onChange={(e) => handleParamChange('soundId', e.target.value)}
          />
        );

      case ActionTypes.SET_VARIABLE:
        return (
          <div className="space-y-2">
            <ParamInput 
              label="Variable Name"
              value={action.params.variable}
              onChange={(e) => handleParamChange('variable', e.target.value)}
            />
            <ParamInput 
              label="Value"
              value={action.params.value}
              onChange={(e) => handleParamChange('value', e.target.value)}
            />
          </div>
        );

      case ActionTypes.INCREMENT_VARIABLE:
        return (
          <div className="space-y-2">
            <ParamInput 
              label="Variable Name"
              value={action.params.variable}
              onChange={(e) => handleParamChange('variable', e.target.value)}
            />
            <ParamInput 
              label="Amount"
              type="number"
              value={action.params.amount}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? 0 : parseFloat(val);
                handleParamChange('amount', isNaN(parsedVal) ? 0 : parsedVal);
              }}
            />
          </div>
        );

      default:
        return <div className="text-xs text-gray-500">No parameters for this action.</div>;
    }
  };

  return <div className="mt-2 p-2 bg-msx-bgcolor-darker rounded">{renderParams()}</div>;
};
