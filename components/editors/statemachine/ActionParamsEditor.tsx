import React, { useMemo } from 'react';
import { Action, ActionTypes } from '../../../statemachine.types';
import { ProjectAsset } from '../../../types';
import { getAllGlobalVariables } from '../../../utils/globalVariablesUtils';

interface ActionParamsEditorProps {
  action: Action;
  onUpdateParams: (params: { [key: string]: any }) => void;
  allAssets?: ProjectAsset[];
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

export const ActionParamsEditor: React.FC<ActionParamsEditorProps> = ({ action, onUpdateParams, allAssets = [] }) => {
  // Get all variables (default + custom)
  const allVariables = useMemo(() => getAllGlobalVariables(allAssets), [allAssets]);

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
        const availableSprites = allAssets.filter(a => a.type === 'sprite');
        return (
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-400 w-16">Sprite</label>
            <select
              value={action.params.sprite || ''}
              onChange={(e) => handleParamChange('sprite', e.target.value)}
              className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
            >
              <option value="">-- Select Sprite --</option>
              {availableSprites.map((spriteAsset) => (
                <option key={spriteAsset.id} value={spriteAsset.data.name}>
                  {spriteAsset.data.name}
                </option>
              ))}
            </select>
          </div>
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
        const selectedVar = allVariables.find(v => v.name === action.params.variable);
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Variable</label>
              <select
                value={action.params.variable || 'Goal'}
                onChange={(e) => handleParamChange('variable', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                {allVariables.map((variable) => (
                  <option key={variable.name} value={variable.name}>
                    {variable.category} → {variable.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Value</label>
              <select
                value={action.params.value || ''}
                onChange={(e) => handleParamChange('value', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="">-- Select Value --</option>
                {selectedVar?.values.map((val) => (
                  <option key={val.value} value={val.label}>
                    {val.label} ({val.value})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case ActionTypes.INCREMENT_VARIABLE:
      case ActionTypes.DECREMENT_VARIABLE:
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Variable</label>
              <select
                value={action.params.variable || 'Score'}
                onChange={(e) => handleParamChange('variable', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                {allVariables.map((variable) => (
                  <option key={variable.name} value={variable.name}>
                    {variable.category} → {variable.name}
                  </option>
                ))}
              </select>
            </div>
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

      case ActionTypes.CHANGE_GAME_FLOW_NODE:
        const availableNodes = allAssets.filter(a => a.type === 'gameflow');
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-24">Target Node</label>
              <input
                type="text"
                placeholder='Type "START" or node ID'
                value={action.params.nodeId || action.params.targetNodeId || ''}
                onChange={(e) => handleParamChange('nodeId', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              />
            </div>
            <div className="text-xs text-yellow-400 italic">
              🎮 Use "START" to go to the Start node, or enter a specific node ID
            </div>
          </div>
        );

      case ActionTypes.DECREASE_LIVES:
      case ActionTypes.INCREASE_LIVES:
        return (
          <div className="space-y-2">
            <ParamInput
              label="Amount"
              type="number"
              value={action.params.amount !== undefined ? action.params.amount : 1}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? 1 : parseInt(val, 10);
                handleParamChange('amount', isNaN(parsedVal) ? 1 : parsedVal);
              }}
            />
            <div className="text-xs text-yellow-400 italic">
              ❤️ Modifies the entity's comp_health.current value
            </div>
          </div>
        );

      case ActionTypes.RESPAWN_PLAYER:
        return (
          <div className="space-y-2">
            <div className="text-xs text-msx-textsecondary mb-2">
              Leave X and Y empty to use entity's initial spawn position
            </div>
            <ParamInput
              label="X Position"
              type="number"
              value={action.params.x ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? undefined : parseFloat(val);
                handleParamChange('x', parsedVal);
              }}
            />
            <ParamInput
              label="Y Position"
              type="number"
              value={action.params.y ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const parsedVal = val === '' ? undefined : parseFloat(val);
                handleParamChange('y', parsedVal);
              }}
            />
            <div className="text-xs text-yellow-400 italic">
              🔄 Resets entity position and velocity
            </div>
          </div>
        );

      case ActionTypes.BREAK_TILE:
      case ActionTypes.REPLACE_TILE:
        const availableTiles = allAssets.filter(a => a.type === 'tile');
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-20">Direction</label>
              <select
                value={action.params.direction || 'up'}
                onChange={(e) => handleParamChange('direction', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="up">⬆️ Up (Above player)</option>
                <option value="down">⬇️ Down (Below player)</option>
                <option value="left">⬅️ Left (Left of player)</option>
                <option value="right">➡️ Right (Right of player)</option>
                <option value="up-right">↗️ Up-Right (Diagonal)</option>
                <option value="up-left">↖️ Up-Left (Diagonal)</option>
                <option value="down-right">↘️ Down-Right (Diagonal)</option>
                <option value="down-left">↙️ Down-Left (Diagonal)</option>
              </select>
            </div>

            {action.type === ActionTypes.REPLACE_TILE && (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-400 w-20">Replace with</label>
                <select
                  value={action.params.replacementTileId || ''}
                  onChange={(e) => handleParamChange('replacementTileId', e.target.value)}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                >
                  <option value="">-- Empty (remove tile) --</option>
                  {availableTiles.map((tileAsset) => (
                    <option key={tileAsset.id} value={tileAsset.id}>
                      {tileAsset.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs text-yellow-400 italic p-2 bg-black bg-opacity-30 rounded">
              {action.type === ActionTypes.BREAK_TILE
                ? '🔨 Breaks tile only if it has "isBreakable" property enabled in Tile Editor'
                : '🔄 Replaces tile with selected tile (or removes it if empty)'}
            </div>
          </div>
        );

      default:
        return <div className="text-xs text-gray-500">No parameters for this action.</div>;
    }
  };

  return <div className="mt-2 p-2 bg-msx-bgcolor-darker rounded">{renderParams()}</div>;
};
