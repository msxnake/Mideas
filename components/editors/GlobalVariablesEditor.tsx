import React, { useState, useEffect } from 'react';
import { GlobalVariablesAsset } from '../../types';
import { MideasGlobalVariable, MIDEAS_GLOBAL_VARIABLES } from '../../constants';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SaveIcon } from '../icons/MsxIcons';
import { ConfirmationModal } from '../modals/ConfirmationModal';

interface GlobalVariablesEditorProps {
  currentAsset: { id: string; name: string; type: string; data: GlobalVariablesAsset };
  onUpdateAsset: (updatedData: Partial<GlobalVariablesAsset>) => void;
}

const VARIABLE_CATEGORIES = ['objective', 'score', 'player', 'inventory', 'progress', 'time', 'difficulty', 'special'] as const;
const VARIABLE_TYPES = ['boolean', 'byte', 'word', 'string'] as const;

const TYPE_LABELS: Record<string, string> = {
  'boolean': 'Boolean (1 bit)',
  'byte': 'Byte (8 bits, 0-255)',
  'word': 'Word (16 bits, 0-65535)',
  'string': 'String (text)'
};

export const GlobalVariablesEditor: React.FC<GlobalVariablesEditorProps> = ({
  currentAsset,
  onUpdateAsset,
}) => {
  const globalVarsAsset = currentAsset.data as GlobalVariablesAsset;

  // Ensure customVariables is always an array
  if (!globalVarsAsset.customVariables) {
    globalVarsAsset.customVariables = [];
  }

  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [editingVariable, setEditingVariable] = useState<Partial<MideasGlobalVariable> | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<MideasGlobalVariable | null>(null);
  const [isDefaultsModalOpen, setIsDefaultsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedVariableId) {
      if (editingVariable && editingVariable.name === selectedVariableId &&
          !globalVarsAsset.customVariables.find(v => v.name === selectedVariableId)) {
        return;
      }
      const varFromList = globalVarsAsset.customVariables.find(v => v.name === selectedVariableId);
      if (varFromList) {
        setEditingVariable({ ...varFromList, values: varFromList.values.map(v => ({...v})) });
      } else {
        setEditingVariable(null);
      }
    } else {
      setEditingVariable(null);
    }
  }, [selectedVariableId, globalVarsAsset.customVariables]);

  const handleSelectVariable = (name: string) => {
    setSelectedVariableId(name);
  };

  const handleAddNewVariable = () => {
    const newVar: Partial<MideasGlobalVariable> = {
      name: 'NewVariable',
      asmName: 'global_var_new_variable',
      constantPrefix: 'NEW_VAR_',
      type: 'byte',
      description: '',
      category: 'special',
      values: [],
    };
    setEditingVariable(newVar);
    setSelectedVariableId('NewVariable');
  };

  const handleAddFromDefaults = (defaultVar: MideasGlobalVariable) => {
    // Check if variable with same name already exists
    const exists = globalVarsAsset.customVariables.some(v => v.name === defaultVar.name);
    if (exists) {
      alert(`Variable "${defaultVar.name}" already exists in custom variables.`);
      return;
    }

    // Deep copy the default variable
    const newVar: MideasGlobalVariable = {
      ...defaultVar,
      values: defaultVar.values.map(v => ({ ...v }))
    };

    // Add to custom variables
    const updatedVariables = [...globalVarsAsset.customVariables, newVar];
    onUpdateAsset({ customVariables: updatedVariables });

    // Select the newly added variable
    setSelectedVariableId(newVar.name);
    setEditingVariable({ ...newVar, values: newVar.values.map(v => ({...v})) });
    setIsDefaultsModalOpen(false);
  };

  const handleVariableChange = (field: keyof MideasGlobalVariable, value: string) => {
    if (editingVariable) {
      const updates: Partial<MideasGlobalVariable> = { [field]: value };

      // Auto-update asmName when name changes
      if (field === 'name') {
        const asmName = `global_var_${value.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
        updates.asmName = asmName;
        updates.constantPrefix = `${value.toUpperCase()}_`;
      }

      setEditingVariable(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddValue = () => {
    if (editingVariable && editingVariable.values) {
      const newValue = {
        label: 'NewValue',
        value: editingVariable.values.length,
        asmConstant: `${editingVariable.constantPrefix || ''}NEW_VALUE`,
      };
      setEditingVariable(prev => prev ? {
        ...prev,
        values: [...(prev.values || []), newValue]
      } : null);
    } else if (editingVariable) {
      const newValue = {
        label: 'NewValue',
        value: 0,
        asmConstant: `${editingVariable.constantPrefix || ''}NEW_VALUE`,
      };
      setEditingVariable(prev => prev ? { ...prev, values: [newValue] } : null);
    }
  };

  const handleValueChange = (index: number, field: 'label' | 'value' | 'asmConstant', value: string | number) => {
    if (editingVariable && editingVariable.values) {
      const newValues = [...editingVariable.values];
      (newValues[index] as any)[field] = value;

      // Auto-update asmConstant when label changes
      if (field === 'label' && typeof value === 'string') {
        newValues[index].asmConstant = `${editingVariable.constantPrefix || ''}${value.toUpperCase().replace(/\s+/g, '_')}`;
      }

      setEditingVariable(prev => prev ? { ...prev, values: newValues } : null);
    }
  };

  const handleRemoveValue = (index: number) => {
    if (editingVariable && editingVariable.values) {
      const newValues = editingVariable.values.filter((_, i) => i !== index);
      setEditingVariable(prev => prev ? { ...prev, values: newValues } : null);
    }
  };

  const handleSaveVariable = () => {
    if (!editingVariable || !editingVariable.name) {
      alert('Variable must have a name');
      return;
    }

    // Ensure all required fields are present
    const variableToSave: MideasGlobalVariable = {
      name: editingVariable.name,
      asmName: editingVariable.asmName || `global_var_${editingVariable.name.toLowerCase()}`,
      constantPrefix: editingVariable.constantPrefix || `${editingVariable.name.toUpperCase()}_`,
      type: editingVariable.type || 'byte',
      description: editingVariable.description || '',
      values: editingVariable.values || [],
      category: editingVariable.category || 'special'
    };

    console.log('[GlobalVariablesEditor] Saving variable:', variableToSave);
    console.log('[GlobalVariablesEditor] Current customVariables:', globalVarsAsset.customVariables);

    const existingIndex = globalVarsAsset.customVariables.findIndex(v => v.name === selectedVariableId);

    let updatedVariables;
    if (existingIndex >= 0) {
      // Update existing variable
      console.log('[GlobalVariablesEditor] Updating existing variable at index:', existingIndex);
      updatedVariables = [...globalVarsAsset.customVariables];
      updatedVariables[existingIndex] = variableToSave;
    } else {
      // Add new variable
      console.log('[GlobalVariablesEditor] Adding new variable');
      updatedVariables = [...globalVarsAsset.customVariables, variableToSave];
    }

    console.log('[GlobalVariablesEditor] Updated variables list:', updatedVariables);
    console.log('[GlobalVariablesEditor] Calling onUpdateAsset with:', { customVariables: updatedVariables });

    onUpdateAsset({ customVariables: updatedVariables });
    setSelectedVariableId(variableToSave.name);
  };

  const handleDeleteVariable = (variable: MideasGlobalVariable) => {
    setVariableToDelete(variable);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (variableToDelete) {
      const updatedVariables = globalVarsAsset.customVariables.filter(v => v.name !== variableToDelete.name);
      onUpdateAsset({ customVariables: updatedVariables });

      if (selectedVariableId === variableToDelete.name) {
        setSelectedVariableId(null);
        setEditingVariable(null);
      }
    }
    setIsConfirmDeleteModalOpen(false);
    setVariableToDelete(null);
  };

  return (
    <Panel title={`Global Variables: ${currentAsset.name}`} className="flex-grow flex flex-col h-full overflow-hidden">
      <div className="flex flex-grow h-full overflow-hidden">
        {/* Left Panel: Variables List */}
        <div className="w-1/3 border-r border-msx-border p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="mb-4 space-y-2">
            <Button onClick={() => setIsDefaultsModalOpen(true)} variant="secondary" size="sm" className="w-full">
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Add Var From Defaults
            </Button>
            <Button onClick={handleAddNewVariable} variant="primary" size="sm" className="w-full">
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Add New Variable
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Custom Variables ({globalVarsAsset.customVariables.length})</h3>
            {globalVarsAsset.customVariables.map((variable) => (
              <div
                key={variable.name}
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  selectedVariableId === variable.name ? 'bg-msx-accent text-white' : 'bg-msx-bgcolor-dark hover:bg-msx-bgcolor'
                }`}
                onClick={() => handleSelectVariable(variable.name)}
              >
                <div className="flex-1">
                  <div className="font-bold text-sm">{variable.name}</div>
                  <div className="text-xs opacity-75">{variable.category} | {TYPE_LABELS[variable.type] || variable.type}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVariable(variable);
                  }}
                  className="text-red-500 hover:text-red-300 p-1"
                  title="Delete Variable"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Variable Editor */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {editingVariable ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {selectedVariableId && globalVarsAsset.customVariables.find(v => v.name === selectedVariableId)
                    ? 'Edit Variable'
                    : 'New Variable'}
                </h3>
                <Button onClick={handleSaveVariable} variant="primary" size="sm">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Variable
                </Button>
              </div>

              {/* Basic Info */}
              <div className="space-y-3 p-4 bg-msx-bgcolor-darker rounded">
                <h4 className="font-bold text-sm text-gray-400">Basic Information</h4>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Variable Name</label>
                  <input
                    type="text"
                    value={editingVariable.name || ''}
                    onChange={(e) => handleVariableChange('name', e.target.value)}
                    className="w-full p-2 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                    placeholder="e.g., PlayerPower"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">ASM Variable Name (auto-generated)</label>
                  <input
                    type="text"
                    value={editingVariable.asmName || ''}
                    readOnly
                    className="w-full p-2 text-sm bg-gray-700 border border-msx-border rounded opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Constant Prefix</label>
                  <input
                    type="text"
                    value={editingVariable.constantPrefix || ''}
                    onChange={(e) => handleVariableChange('constantPrefix', e.target.value)}
                    className="w-full p-2 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                    placeholder="e.g., POWER_"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingVariable.description || ''}
                    onChange={(e) => handleVariableChange('description', e.target.value)}
                    className="w-full p-2 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                    placeholder="What does this variable represent?"
                  />
                </div>

                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                    <select
                      value={editingVariable.type || 'byte'}
                      onChange={(e) => handleVariableChange('type', e.target.value)}
                      className="w-full p-2 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                    >
                      {VARIABLE_TYPES.map(type => (
                        <option key={type} value={type}>{TYPE_LABELS[type] || type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                    <select
                      value={editingVariable.category || 'special'}
                      onChange={(e) => handleVariableChange('category', e.target.value)}
                      className="w-full p-2 text-sm bg-msx-bgcolor-dark border border-msx-border rounded"
                    >
                      {VARIABLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="space-y-3 p-4 bg-msx-bgcolor-darker rounded">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-400">Possible Values</h4>
                  <Button onClick={handleAddValue} variant="primary" size="sm">
                    <PlusCircleIcon className="w-3 h-3 mr-1" />
                    Add Value
                  </Button>
                </div>

                {editingVariable.values && editingVariable.values.length > 0 ? (
                  <div className="space-y-2">
                    {editingVariable.values.map((val, idx) => (
                      <div key={idx} className="flex space-x-2 items-center p-2 bg-msx-bgcolor-dark rounded">
                        <input
                          type="text"
                          value={val.label}
                          onChange={(e) => handleValueChange(idx, 'label', e.target.value)}
                          className="flex-1 p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
                          placeholder="Label"
                        />
                        <input
                          type="number"
                          value={val.value}
                          onChange={(e) => handleValueChange(idx, 'value', parseInt(e.target.value) || 0)}
                          className="w-20 p-1 text-sm bg-msx-bgcolor border border-msx-border rounded"
                          placeholder="Value"
                        />
                        <input
                          type="text"
                          value={val.asmConstant || ''}
                          readOnly
                          className="flex-1 p-1 text-sm bg-gray-700 border border-msx-border rounded opacity-75"
                          placeholder="ASM Constant"
                        />
                        <button
                          onClick={() => handleRemoveValue(idx)}
                          className="text-red-500 hover:text-red-300 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No values defined yet. Click "Add Value" to start.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a variable or create a new one to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        title="Delete Variable"
        message={`Are you sure you want to delete the variable "${variableToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsConfirmDeleteModalOpen(false);
          setVariableToDelete(null);
        }}
      />

      {/* Defaults Selection Modal */}
      {isDefaultsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-msx-bgcolor-darker border-2 border-msx-border rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-msx-border bg-msx-bgcolor-dark">
              <h2 className="text-xl font-bold text-msx-textcolor">Select Default Variable</h2>
              <p className="text-sm text-msx-textsecondary mt-1">
                Choose a variable from MIDEAS defaults to add to your custom variables
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MIDEAS_GLOBAL_VARIABLES.map((defaultVar) => {
                  const alreadyExists = globalVarsAsset.customVariables.some(v => v.name === defaultVar.name);

                  return (
                    <div
                      key={defaultVar.name}
                      className={`p-3 border rounded ${
                        alreadyExists
                          ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                          : 'border-msx-border bg-msx-bgcolor hover:bg-msx-bgcolor-dark cursor-pointer hover:border-msx-accent'
                      }`}
                      onClick={() => !alreadyExists && handleAddFromDefaults(defaultVar)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-msx-textcolor">{defaultVar.name}</h3>
                          <span className="text-xs text-msx-textsecondary">
                            {defaultVar.category} | {TYPE_LABELS[defaultVar.type] || defaultVar.type}
                          </span>
                        </div>
                        {alreadyExists && (
                          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                            Already Added
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-msx-textsecondary mb-2">{defaultVar.description}</p>

                      {defaultVar.values.length > 0 && (
                        <div className="text-xs text-msx-textsecondary">
                          <span className="font-semibold">Values:</span>{' '}
                          {defaultVar.values.slice(0, 3).map(v => v.label).join(', ')}
                          {defaultVar.values.length > 3 && ` (+${defaultVar.values.length - 3} more)`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-msx-border bg-msx-bgcolor-dark flex justify-end">
              <Button onClick={() => setIsDefaultsModalOpen(false)} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};
