import React, { useState } from 'react';
import { Condition, ConditionType, ConditionTypes } from '../../../statemachine.types';
import { ProjectAsset, EntityTemplate, ScreenMap, EntityInstance, ComponentDefinition } from '../../../types';
import { Button } from '../../common/Button';

interface ConditionBuilderProps {
  onUpdate: (condition: Condition | null) => void;
  condition: Condition | null;
  level?: number;
  allAssets?: ProjectAsset[];
  entityTemplates?: EntityTemplate[];
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ onUpdate, condition, level = 0, allAssets = [], entityTemplates = [] }) => {
  // Local refresh flag to force re-scan of assets for dropdowns
  const [refreshTick, setRefreshTick] = useState(0);
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
      case ConditionTypes.TIME_OUT:
        return (
          <div className="space-y-2">
            <div className="text-xs text-msx-textsecondary">
              Triggers when game time reaches 0 (GameTime {'<'} 1)
            </div>
            <div className="text-xs text-yellow-400 italic">
              ℹ️ Requires GameTime variable to be tracked in your game logic
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
        // Build dropdown options for collectibles (no memo to avoid stale caches)
        // First, identify all collectible component definitions by checking for 'itemType' property
        const componentDefinitions = (allAssets || [])
          .filter(a => a.type === 'componentdefinition')
          .map(a => a.data as ComponentDefinition);

        // Find all component definition IDs that have an 'itemType' property (these are collectible components)
        const collectibleComponentIds = new Set<string>();
        componentDefinitions.forEach(compDef => {
          if (compDef?.properties?.some(prop => prop.name === 'itemType')) {
            collectibleComponentIds.add(compDef.id);
          }
        });

        // Merge templates from assets and from explicit entityTemplates prop
        const templateMapById = new Map<string, EntityTemplate>();
        // From allAssets (if some templates are registered as assets)
        (allAssets || []).forEach(a => {
          if (a.type === 'entitytemplate' && a.data) {
            const t = a.data as EntityTemplate;
            // Check if template has ANY collectible component (not just comp_collectible)
            if (t?.components?.some(c => collectibleComponentIds.has(c.definitionId))) templateMapById.set(t.id, t);
          }
        });
        // From prop entityTemplates (global project templates)
        (entityTemplates || []).forEach(t => {
          // Check if template has ANY collectible component (not just comp_collectible)
          if (t?.components?.some(c => collectibleComponentIds.has(c.definitionId))) templateMapById.set(t.id, t);
        });
        const collectibleTemplates: EntityTemplate[] = Array.from(templateMapById.values());

        const itemTypeSet = new Set<string>();
        // From collectible templates defaultValues
        collectibleTemplates.forEach(t => {
          // Find ANY collectible component (not just comp_collectible)
          const comp = t.components?.find(c => collectibleComponentIds.has(c.definitionId));
          const it = (comp?.defaultValues as any)?.itemType;
          if (it) itemTypeSet.add(String(it));
        });
        // From screenmap instances overrides
        (allAssets || []).filter(a => a.type === 'screenmap').forEach(a => {
          const sm = a.data as ScreenMap;
          sm?.layers?.entities?.forEach((inst: EntityInstance) => {
            // Check overrides for ANY collectible component
            collectibleComponentIds.forEach(compId => {
              const over = inst?.componentOverrides?.[compId] as any;
              const it = over?.itemType;
              if (it) itemTypeSet.add(String(it));
            });
          });
        });
        const itemTypeOptions = Array.from(itemTypeSet.values()).sort();

        const templateMap = new Map<string, { id: string; name: string }>();
        collectibleTemplates.forEach(t => { templateMap.set(t.id, { id: t.id, name: t.name }); });
        // From screenmaps instances (resolve to template asset when possible)
        (allAssets || []).filter(a => a.type === 'screenmap').forEach(a => {
          const sm = a.data as ScreenMap;
          sm?.layers?.entities?.forEach((inst: EntityInstance) => {
            const tplId = inst?.entityTemplateId;
            if (tplId && !templateMap.has(tplId)) {
              const tplAsset = (allAssets || []).find(ax => ax.type === 'entitytemplate' && ax.id === tplId);
              if (tplAsset) {
                const t = tplAsset.data as EntityTemplate;
                templateMap.set(t.id, { id: t.id, name: t.name });
              }
            }
          });
        });
        const templateOptions = Array.from(templateMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        return (
          <div className="space-y-2">
            <select
              value={condition.params?.collisionType || 'any'}
              onChange={(e) => handleParamChange('collisionType', e.target.value)}
              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
            >
              <option value="any">Any collision</option>
              <option value="enemy">Enemy collision</option>
              <option value="item">Item collision</option>
              <option value="wall">Wall collision</option>
            </select>
            <div className="text-xs text-msx-textsecondary">
              {condition.params?.collisionType === 'enemy' && '💥 Triggers when colliding with enemies (entities with comp_damage or comp_ai_behavior)'}
              {condition.params?.collisionType === 'item' && '✨ Triggers when colliding with collectibles (entities with collectible components)'}
              {condition.params?.collisionType === 'wall' && '🧱 Triggers when colliding with solid walls'}
              {(!condition.params?.collisionType || condition.params?.collisionType === 'any') && 'Triggers on any type of collision'}
            </div>
            {condition.params?.collisionType === 'item' && (
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
                {/* Removed templateId/templateName filters intentionally */}
                <div className="text-xs text-msx-textsecondary">Use filters to restrict which item triggers the transition.</div>
              </div>
            )}
          </div>
        );
      case ConditionTypes.PATH_CLEAR:
        return (
          <input
            type="text"
            placeholder="Collision layer or type (optional)"
            value={condition.params?.layer || ''}
            onChange={(e) => handleParamChange('layer', e.target.value)}
            className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
          />
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
