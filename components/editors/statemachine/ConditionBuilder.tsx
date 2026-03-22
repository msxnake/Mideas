import React, { useMemo } from 'react';
import { Condition, ConditionType, ConditionTypes } from '../../../statemachine.types';
import { ProjectAsset, EntityTemplate } from '../../../types';
import { Button } from '../../common/Button';
import { getAllGlobalVariables } from '../../../utils/globalVariablesUtils';

interface ConditionBuilderProps {
  onUpdate: (condition: Condition | null) => void;
  condition: Condition | null;
  level?: number;
  allAssets?: ProjectAsset[];
  entityTemplates?: EntityTemplate[];
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ onUpdate, condition, level = 0, allAssets = [] }) => {

  // Get all variables (default + custom + entity properties)
  const allVariables = useMemo(() => {
    const globalVars = getAllGlobalVariables(allAssets);

    // Add entity-specific variables at the beginning
    const entityVariables = [
      {
        name: 'x',
        asmName: 'entity_x',
        constantPrefix: 'X_',
        type: 'byte' as const,
        description: 'Entity X position (pixels)',
        category: 'entity' as const,
        values: []
      },
      {
        name: 'y',
        asmName: 'entity_y',
        constantPrefix: 'Y_',
        type: 'byte' as const,
        description: 'Entity Y position (pixels)',
        category: 'entity' as const,
        values: []
      },
      {
        name: 'vx',
        asmName: 'entity_vx',
        constantPrefix: 'VX_',
        type: 'byte' as const,
        description: 'Entity X velocity',
        category: 'entity' as const,
        values: []
      },
      {
        name: 'vy',
        asmName: 'entity_vy',
        constantPrefix: 'VY_',
        type: 'byte' as const,
        description: 'Entity Y velocity',
        category: 'entity' as const,
        values: []
      },
      {
        name: 'isOnGround',
        asmName: 'entity_on_ground',
        constantPrefix: 'ONGROUND_',
        type: 'boolean' as const,
        description: 'Entity ground contact flag (true when touching floor)',
        category: 'entity' as const,
        values: []
      }
    ];

    return [...entityVariables, ...globalVars];
  }, [allAssets]);

  // Handle null condition gracefully: offer to create a default condition
  if (!condition) {
    const createDefault = () => onUpdate({ type: ConditionTypes.KEY_PRESSED, params: { key: '' } });
    return (
      <div className="p-2 rounded border border-msx-border space-y-2">
        <div className="text-xs text-msx-textsecondary">No condition defined.</div>
        <div>
          <button className="px-2 py-1 text-xs bg-msx-primary rounded" onClick={createDefault}>+ Add Condition</button>
        </div>
      </div>
    );
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ConditionType;
    const newCondition: Condition = { type: newType };

    if (newType === 'AND' || newType === 'OR' || newType === 'XOR') {
      newCondition.conditions = [{ type: ConditionTypes.KEY_PRESSED, params: { key: '' } }];
    } else if (newType === 'NOT') {
      newCondition.conditions = [{ type: ConditionTypes.KEY_PRESSED, params: { key: '' } }];
    } else if (newType === ConditionTypes.TIME_OUT) {
      newCondition.params = { duration: 60 };
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
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Key (e.g. ArrowRight, right, space, fire)"
              value={condition.params?.key || ''}
              onChange={(e) => handleParamChange('key', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            />
            <div className="text-xs text-msx-textsecondary">
              You can type aliases manually: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `space`, `fire`.
            </div>
          </div>
        );
      case ConditionTypes.TIME_OUT:
        return (
          <div className="space-y-2">
            <div className="text-xs text-msx-textsecondary">
              Triggers when the current state timer reaches the specified number of frames.
            </div>
            <div className="text-xs text-yellow-400 italic">
              Resets automatically every time the entity changes state.
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-msx-textsecondary w-20">Duration</label>
              <input
                type="number"
                min="1"
                value={condition.params?.duration ?? 60}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const duration = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 1;
                  handleParamChange('duration', duration);
                }}
                className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
              />
            </div>
            <div className="text-xs text-yellow-400 italic">
              Uses frames, not milliseconds. 50 = 1s at 50 Hz, 100 = 2s.
            </div>
            {/* condition.params?.collisionType === 'item' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-msx-primary rounded"
                    onClick={() => onUpdate({ ...condition })}
                    title="Re-scan project assets for item options"
                  >Refresh options</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-msx-textsecondary w-28">itemType</label>
                  {itemTypeOptions.length > 0 ? (
                    <select
                      value={condition.params?.itemType || ''}
                      onChange={(e) => handleParamChange('itemType', e.target.value)}
                      className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                    >
                      <option value="">-- Any --</option>
                      {itemTypeOptions.map(it => (<option key={it} value={it}>{it}</option>))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Filter by itemType (optional)"
                      value={condition.params?.itemType || ''}
                      onChange={(e) => handleParamChange('itemType', e.target.value)}
                      className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-msx-textsecondary">Use filters to restrict which item triggers the transition.</div>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-msx-primary rounded"
                    onClick={() => setRefreshTick(t => t + 1)}
                    title="Re-scan project assets for item options"
                  >Refresh options</button>
                </div>
              </div>
            */}
          </div>
        );
      case ConditionTypes.CAN_MOVE_DIRECTION:
        return (
          <select
            value={condition.params?.direction || 'up'}
            onChange={(e) => handleParamChange('direction', e.target.value)}
            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        );
      case ConditionTypes.HAS_COLLISION:
        return (
          <div className="space-y-2">
            <select
              value={condition.params?.collisionType || 'any'}
              onChange={(e) => handleParamChange('collisionType', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="any">Any collision</option>
              <option value="entity">Entity collision</option>
              <option value="enemy">Enemy collision</option>
              <option value="item">Item collision</option>
              <option value="wall">Wall collision</option>
            </select>
            <div className="text-xs text-msx-textsecondary">
              ROM ASM: `entity` usa colision entidad-entidad, `enemy` usa layer 2 y `item` usa layer 16.
            </div>
          </div>
        );
      case ConditionTypes.PATH_CLEAR:
        return (
          <select
            value={condition.params?.direction || ''}
            onChange={(e) => handleParamChange('direction', e.target.value)}
            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
          >
            <option value="">Auto (from velocity)</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        );
      case ConditionTypes.KEY_AND_MOVEMENT:
        return (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={condition.params?.key || 'right'}
              onChange={(e) => handleParamChange('key', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="space">Space (Fire)</option>
            </select>
            <select
              value={condition.params?.direction || ''}
              onChange={(e) => handleParamChange('direction', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="">Auto direction</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        );
      case ConditionTypes.ON_WALL_COLLISION:
        return (
          <div className="space-y-2">
            <select
              value={condition.params?.direction || 'any'}
              onChange={(e) => handleParamChange('direction', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="any">Any direction</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <div className="text-xs text-msx-textsecondary">
              Triggers when entity collides with a wall
            </div>
          </div>
        );
      case ConditionTypes.ANIMATION_COMPLETE:
        return (
          <div className="space-y-2">
            <div className="text-xs text-msx-textsecondary">
              🎬 Triggers when a non-looping animation finishes playing all frames
            </div>
            <div className="text-xs text-yellow-400 italic">
              ℹ️ Make sure the sprite has "Loop Animation" disabled in the Sprite Editor
            </div>
          </div>
        );
      case ConditionTypes.VARIABLE_COMPARE: {
        const selectedVarName = condition.params?.variable || (allVariables[0]?.name || 'x');
        const selectedVar = allVariables.find(v => v.name === selectedVarName);
        const isBoolean = selectedVar?.type === 'boolean';

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-msx-textsecondary">Variable</label>
                <select
                  value={selectedVarName}
                  onChange={(e) => handleParamChange('variable', e.target.value)}
                  className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                >
                  {allVariables.map((variable) => (
                    <option key={variable.name} value={variable.name}>
                      {`${variable.category} → ${variable.name}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-msx-textsecondary">Operator</label>
                <select
                  value={condition.params?.operator || (isBoolean ? '==' : '==')}
                  onChange={(e) => handleParamChange('operator', e.target.value)}
                  className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                >
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                  {!isBoolean && <option value=">">&gt;</option>}
                  {!isBoolean && <option value="<">&lt;</option>}
                  {!isBoolean && <option value=">=">&gt;=</option>}
                  {!isBoolean && <option value="<=">&lt;=</option>}
                </select>
              </div>
              <div>
                <label className="text-xs text-msx-textsecondary">Value</label>
                {isBoolean ? (
                  <select
                    value={String(condition.params?.value ?? 'false')}
                    onChange={(e) => handleParamChange('value', e.target.value === 'true')}
                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    value={condition.params?.value ?? 0}
                    onChange={(e) => handleParamChange('value', parseInt(e.target.value) || 0)}
                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                  />
                )}
              </div>
            </div>
            {selectedVar && (
              <div className="text-xs text-msx-textsecondary">
                📊 Type: {selectedVar.type} | Category: {selectedVar.category}
              </div>
            )}
            <div className="text-xs text-yellow-400 italic">
              💡 Example: Use "x &gt; 240" to detect when entity reaches right edge of screen
            </div>
          </div>
        );
      }
      // Note: Variable comparisons now use TransitionGuard instead
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
                allAssets={allAssets}
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

