import React, { useMemo } from 'react';
import { Action, ActionTypes } from '../../../statemachine.types';
import { ProjectAsset } from '../../../types';
import { getAllGlobalVariables } from '../../../utils/globalVariablesUtils';
import { DEFAULT_COMPONENT_DEFINITIONS } from '../../../data/defaults';

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

  const isNumericType = (t?: string) => {
    return t === 'byte' || t === 'word' || t === '8bit' || t === '16bit' || t === 'number';
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
        const availableSounds = allAssets.filter(a => a.type === 'sound');

        if (availableSounds.length === 0) {
          return (
            <div className="space-y-2">
              <div className="text-xs text-yellow-400 italic p-2 bg-black bg-opacity-30 rounded border border-yellow-600">
                ⚠️ No sound assets available. Create a sound asset first using the toolbar (New Asset → Sound).
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Sound</label>
              <select
                value={action.params.soundId || ''}
                onChange={(e) => handleParamChange('soundId', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="">-- Select Sound --</option>
                {availableSounds.map((soundAsset) => (
                  <option key={soundAsset.id} value={soundAsset.id}>
                    {soundAsset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-blue-400 italic">
              🔊 Plays the selected PSG sound effect (Yamaha AY-3-8910)
            </div>
          </div>
        );

      case ActionTypes.PLAY_MUSIC:
        const availableTracks = allAssets.filter(a => a.type === 'track');

        if (availableTracks.length === 0) {
          return (
            <div className="space-y-2">
              <div className="text-xs text-yellow-400 italic p-2 bg-black bg-opacity-30 rounded border border-yellow-600">
                ⚠️ No music tracks available. Create a tracker song first using the toolbar (New Asset → Track).
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Track</label>
              <select
                value={action.params.trackId || ''}
                onChange={(e) => handleParamChange('trackId', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="">-- Select Music Track --</option>
                {availableTracks.map((trackAsset) => (
                  <option key={trackAsset.id} value={trackAsset.id}>
                    {trackAsset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Loop</label>
              <input
                type="checkbox"
                checked={action.params.loop ?? true}
                onChange={(e) => handleParamChange('loop', e.target.checked)}
                className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
              />
              <span className="text-xs text-gray-400">Repeat music continuously</span>
            </div>
            <div className="text-xs text-blue-400 italic">
              🎵 Plays background music from Tracker Composer (PT3-style)
            </div>
          </div>
        );

      case ActionTypes.MUTE_MUSIC:
        return (
          <div className="space-y-2">
            <div className="text-xs text-blue-400 italic p-2 bg-black bg-opacity-30 rounded border border-blue-600">
              🔇 Mutes the currently playing music (useful for pause mode).
              <br />
              Use PLAY_MUSIC to resume, or STOP_MUSIC to completely stop playback.
            </div>
          </div>
        );

      case ActionTypes.STOP_MUSIC:
        return (
          <div className="space-y-2">
            <div className="text-xs text-red-400 italic p-2 bg-black bg-opacity-30 rounded border border-red-600">
              ⏹️ Stops the currently playing music and clears the playback state.
              <br />
              To temporarily pause, use MUTE_MUSIC instead.
            </div>
          </div>
        );

      case ActionTypes.SET_VARIABLE: {
        const selectedVar = allVariables.find(v => v.name === action.params.variable);
        const selectedVarType = selectedVar?.type;
        const hasEnumValues = (selectedVar?.values || []).length > 0 && !selectedVar?.values?.some(v => v.value === 'number');
        const supportsNumeric = isNumericType(selectedVarType) || selectedVar?.values?.some(v => v.value === 'number');
        const isBoolean = selectedVarType === 'boolean';
        const varNameLower = (selectedVar?.name || '').toLowerCase();
        const isAmmoVar = varNameLower.includes('ammo');
        const numericPlaceholder = isAmmoVar ? 'e.g., -1 = infinite' : (selectedVarType === 'byte' ? '0..255' : selectedVarType === 'word' ? '0..65535' : 'Enter number');
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Variable</label>
              <select
                value={action.params.variable || (allVariables[0]?.name || '')}
                onChange={(e) => {
                  // Reset value when variable changes
                  onUpdateParams({ ...action.params, variable: e.target.value, value: '' });
                }}
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
              {supportsNumeric ? (
                <input
                  type="number"
                  value={action.params.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = val === '' ? '' : Number(val);
                    handleParamChange('value', parsed);
                  }}
                  placeholder={numericPlaceholder}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                />
              ) : isBoolean ? (
                <select
                  value={String(action.params.value ?? '')}
                  onChange={(e) => handleParamChange('value', e.target.value === 'true')}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : hasEnumValues ? (
                <select
                  value={action.params.value ?? ''}
                  onChange={(e) => handleParamChange('value', e.target.value)}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                >
                  <option value="">-- Select Value --</option>
                  {selectedVar?.values.map((val) => (
                    <option key={String(val.value)} value={String(val.value)}>
                      {val.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={action.params.value ?? ''}
                  onChange={(e) => handleParamChange('value', e.target.value)}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                />
              )}
            </div>
            {isAmmoVar && (
              <div className="text-xs text-msx-textsecondary italic">Tip: -1 = infinite ammo; ≥ 0 consumes per shot.</div>
            )}
          </div>
        );
      }

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

      case ActionTypes.DESTROY_ENTITY:
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-16">Target</label>
              <select
                value={action.params.target || 'self'}
                onChange={(e) => handleParamChange('target', e.target.value)}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="self">💀 Self (Destroy this entity)</option>
                <option value="other">💥 Other (Destroy collided entity)</option>
              </select>
            </div>
            <div className="text-xs text-yellow-400 italic p-2 bg-black bg-opacity-30 rounded">
              {action.params.target === 'other'
                ? '💥 Destroys the entity we just collided with (e.g., pick up an item)'
                : '💀 Destroys this entity (e.g., enemy dies)'}
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

      case ActionTypes.SET_COMPONENT_PROPERTY: {
        const compDefs = DEFAULT_COMPONENT_DEFINITIONS;
        const selectedCompId = action.params.componentId || action.params.component || action.params.compId || '';
        const selectedComp = compDefs.find(cd => cd.id === selectedCompId);
        const selectedPropName = action.params.propertyName || action.params.prop || action.params.name || '';
        const selectedProp = selectedComp?.properties?.find(p => p.name === selectedPropName);

        const assetTypeMap: Record<string, ProjectAsset['type']> = {
          'sprite_ref': 'sprite',
          'sound_ref': 'sound',
          'behavior_script_ref': 'behavior',
          'entity_template_ref': 'entitytemplate',
          'statemachine_ref': 'statemachine',
          'tile_ref': 'tile',
        };

        const availableForRef = (propType?: string): ProjectAsset[] => {
          const at = propType ? assetTypeMap[propType] : undefined;
          return at ? allAssets.filter(a => a.type === at) : [];
        };

        const handleComponentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const compId = e.target.value;
          // Reset property/value on component change
          onUpdateParams({ componentId: compId, propertyName: '', value: '' });
        };

        const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
          const propName = e.target.value;
          // Reset value when property changes
          onUpdateParams({ ...action.params, propertyName: propName, value: '' });
        };

        const renderValueEditor = () => {
          const propType = selectedProp?.type;
          // Boolean
          if (propType === 'boolean') {
            return (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-400 w-20">Value</label>
                <select
                  value={String(action.params.value ?? '')}
                  onChange={(e) => onUpdateParams({ ...action.params, value: e.target.value === 'true' })}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            );
          }
          // Number-like
          if (propType === 'byte' || propType === 'word' || propType === '8bit' || propType === '16bit') {
            return (
              <ParamInput
                label="Value"
                type="number"
                value={action.params.value}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsedVal = val === '' ? 0 : parseFloat(val);
                  onUpdateParams({ ...action.params, value: isNaN(parsedVal) ? 0 : parsedVal });
                }}
              />
            );
          }
          // Asset references
          if (propType && propType.endsWith('_ref')) {
            const list = availableForRef(propType);
            if (list.length > 0) {
              return (
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-400 w-20">Value</label>
                  <select
                    value={action.params.value || ''}
                    onChange={(e) => onUpdateParams({ ...action.params, value: e.target.value })}
                    className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                  >
                    <option value="">-- Select --</option>
                    {list.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              );
            }
          }
          // Default: string
          return (
            <ParamInput
              label="Value"
              value={action.params.value}
              onChange={(e) => onUpdateParams({ ...action.params, value: e.target.value })}
            />
          );
        };

        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-20">Component</label>
              <select
                value={selectedCompId}
                onChange={handleComponentChange}
                className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
              >
                <option value="">-- Select Component --</option>
                {compDefs.map(cd => (
                  <option key={cd.id} value={cd.id}>{cd.name} ({cd.id})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 w-20">Property</label>
              {selectedComp ? (
                <select
                  value={selectedPropName}
                  onChange={handlePropertyChange}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                >
                  <option value="">-- Select Property --</option>
                  {selectedComp.properties.map(p => (
                    <option key={p.name} value={p.name}>{p.name} [{p.type}]</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="propertyName"
                  value={selectedPropName}
                  onChange={handlePropertyChange}
                  className="w-full p-1 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                />
              )}
            </div>

            {renderValueEditor()}

            <div className="text-xs text-blue-400 italic p-2 bg-black bg-opacity-30 rounded">
              Updates a component property at runtime using component overrides. Useful for toggling hasAmmo or switching projectile sprite.
            </div>
          </div>
        );
      }

      default:
        return <div className="text-xs text-gray-500">No parameters for this action.</div>;
    }
  };

  return <div className="mt-2 p-2 bg-msx-bgcolor-darker rounded">{renderParams()}</div>;
};
