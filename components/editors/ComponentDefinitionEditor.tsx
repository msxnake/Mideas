
import React, { useState, useEffect } from 'react';
import { ComponentDefinition, ComponentPropertyDefinition } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { PlusCircleIcon, TrashIcon, SaveIcon, PuzzlePieceIcon, LoadIcon, DocumentPlusIcon } from '../icons/MsxIcons';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { DEFAULT_COMPONENT_DEFINITIONS } from '../../data/defaults';

/**
 * Props for the ComponentDefinitionEditor component.
 */
interface ComponentDefinitionEditorProps {
  /** The current list of component definitions. */
  componentDefinitions: ComponentDefinition[];
  /** Callback to update the list of component definitions. */
  onUpdateComponentDefinitions: (updatedDefinitions: ComponentDefinition[]) => void;
}

const PROPERTY_TYPES: ComponentPropertyDefinition['type'][] = [
  'byte', 'word', 'boolean', 'string', 'color', 
  'sprite_ref', 'sound_ref', 'behavior_script_ref', 'entity_template_ref', 'statemachine_ref', 'tile_ref', 'dialogue_ref'
];

/**
 * A full-screen editor for creating, updating, and deleting component definitions.
 * These definitions act as blueprints for components in an Entity-Component-System (ECS) architecture.
 */
export const ComponentDefinitionEditor: React.FC<ComponentDefinitionEditorProps> = ({
  componentDefinitions,
  onUpdateComponentDefinitions,
}) => {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [editingDefinition, setEditingDefinition] = useState<Partial<ComponentDefinition> | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<ComponentDefinition | null>(null);
  const [importFileInput, setImportFileInput] = useState<HTMLInputElement | null>(null);
  const [isConfirmLoadDefaultsModalOpen, setIsConfirmLoadDefaultsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedDefinitionId) {
        // If editingDefinition already exists and matches the selected ID,
        // AND this ID is not yet in the main componentDefinitions list (implying it's a new, unsaved definition),
        // then we should not overwrite editingDefinition with null from the list.
        if (editingDefinition && editingDefinition.id === selectedDefinitionId && 
            !componentDefinitions.find(d => d.id === selectedDefinitionId)) {
            // This means we are currently editing a *new* definition that hasn't been saved to the main list yet.
            // Keep the current editingDefinition.
            return; 
        }

        const defFromList = componentDefinitions.find(d => d.id === selectedDefinitionId);
        if (defFromList) {
            // If switching to an existing definition, or if an existing definition was updated in the main list.
            setEditingDefinition({ ...defFromList, properties: defFromList.properties.map(p => ({...p})) });
        } else {
            // If selectedDefinitionId does not correspond to any existing definition in the list
            // (e.g., after a delete, or if the ID is somehow invalid but not matching the current new unsaved one),
            // clear the form.
            setEditingDefinition(null);
        }
    } else {
        setEditingDefinition(null); // No selection, clear form.
    }
  }, [selectedDefinitionId, componentDefinitions]); // Note: `editingDefinition` is intentionally not in deps here to avoid loops with its own updates. The logic relies on `selectedDefinitionId` and the `componentDefinitions` prop.


  const handleSelectDefinition = (id: string) => {
    setSelectedDefinitionId(id);
  };

  const handleAddNewDefinition = () => {
    const newId = `comp_def_${Date.now()}`;
    const newDef: Partial<ComponentDefinition> = {
      id: newId,
      name: 'NewComponent',
      description: '',
      properties: [],
    };
    // Set editingDefinition directly *before* setSelectedDefinitionId,
    // so the useEffect has a chance to see the new editingDefinition if it needs to compare.
    // Or, rely on the useEffect's new logic to handle the "new unsaved" case correctly.
    setEditingDefinition(newDef); 
    setSelectedDefinitionId(newId);
  };

  const handleDefinitionChange = (field: keyof ComponentDefinition, value: string) => {
    if (editingDefinition) {
      setEditingDefinition(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handlePropertyChange = (index: number, field: keyof ComponentPropertyDefinition, value: string) => {
    if (editingDefinition && editingDefinition.properties) {
      const newProperties = [...editingDefinition.properties];
      (newProperties[index] as any)[field] = value;
      setEditingDefinition(prev => prev ? { ...prev, properties: newProperties } : null);
    }
  };

  const handleAddProperty = () => {
    if (editingDefinition) {
      const newProperty: ComponentPropertyDefinition = {
        name: `newProperty${(editingDefinition.properties?.length || 0) + 1}`,
        type: 'byte',
        defaultValue: '0',
        description: '',
      };
      setEditingDefinition(prev => ({
        ...prev,
        properties: [...(prev?.properties || []), newProperty],
      }));
    }
  };

  const handleRemoveProperty = (index: number) => {
    if (editingDefinition && editingDefinition.properties) {
      const newProperties = editingDefinition.properties.filter((_, i) => i !== index);
      setEditingDefinition(prev => prev ? { ...prev, properties: newProperties } : null);
    }
  };

  const handleSaveDefinition = () => {
    if (!editingDefinition || !editingDefinition.id || !editingDefinition.name?.trim()) {
      alert("Component ID and Name are required.");
      return;
    }
    // Ensure property names are valid (e.g., no spaces, starts with letter) - basic check
    if (editingDefinition.properties?.some(p => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.name))) {
        alert("Property names must be valid identifiers (letters, numbers, underscores, start with letter/underscore).");
        return;
    }

    const finalDefinition = { ...editingDefinition } as ComponentDefinition;
    const existingIndex = componentDefinitions.findIndex(d => d.id === finalDefinition.id);

    if (existingIndex > -1) {
      // Check for name conflict if renaming
      if (componentDefinitions.some(d => d.name.toLowerCase() === finalDefinition.name.toLowerCase() && d.id !== finalDefinition.id)) {
        alert(`A component definition with the name "${finalDefinition.name}" already exists.`);
        return;
      }
      const updated = [...componentDefinitions];
      updated[existingIndex] = finalDefinition;
      onUpdateComponentDefinitions(updated);
    } else {
      // Check for name conflict if adding new
       if (componentDefinitions.some(d => d.name.toLowerCase() === finalDefinition.name.toLowerCase())) {
        alert(`A component definition with the name "${finalDefinition.name}" already exists.`);
        return;
      }
      onUpdateComponentDefinitions([...componentDefinitions, finalDefinition]);
    }
  };

  const handleDeleteDefinition = (definition: ComponentDefinition | null) => {
    if (definition) {
        setDefinitionToDelete(definition);
        setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (definitionToDelete) {
        onUpdateComponentDefinitions(componentDefinitions.filter(d => d.id !== definitionToDelete.id));
        if (selectedDefinitionId === definitionToDelete.id) {
            setSelectedDefinitionId(null);
            setEditingDefinition(null);
        }
    }
    setIsConfirmDeleteModalOpen(false);
    setDefinitionToDelete(null);
  };

  const handleExportComponents = () => {
    const exportData = {
      type: 'component_definitions',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: componentDefinitions
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component_definitions_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportComponents = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importData = JSON.parse(event.target?.result as string);
            
            if (importData.type !== 'component_definitions' || !Array.isArray(importData.data)) {
              alert('Invalid component definitions file format.');
              return;
            }

            // Validate the imported data structure
            const isValidComponentDef = (def: any): def is ComponentDefinition => {
              return def && 
                     typeof def.id === 'string' && 
                     typeof def.name === 'string' && 
                     Array.isArray(def.properties) &&
                     def.properties.every((prop: any) => 
                       prop && typeof prop.name === 'string' && typeof prop.type === 'string'
                     );
            };

            const validDefinitions = importData.data.filter(isValidComponentDef);
            
            if (validDefinitions.length === 0) {
              alert('No valid component definitions found in the file.');
              return;
            }

            // Merge with existing definitions, handling ID conflicts
            const existingIds = new Set(componentDefinitions.map(d => d.id));
            const mergedDefinitions = [...componentDefinitions];
            
            validDefinitions.forEach((importedDef: ComponentDefinition) => {
              if (existingIds.has(importedDef.id)) {
                // Create new ID for conflicting definitions
                const newId = `${importedDef.id}_imported_${Date.now()}`;
                mergedDefinitions.push({ ...importedDef, id: newId });
              } else {
                mergedDefinitions.push(importedDef);
              }
            });

            onUpdateComponentDefinitions(mergedDefinitions);
            alert(`Successfully imported ${validDefinitions.length} component definition(s).`);
          } catch (error) {
            alert('Error reading component definitions file. Please ensure it\'s a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleLoadDefaults = () => {
    setIsConfirmLoadDefaultsModalOpen(true);
  };

  const handleConfirmLoadDefaults = () => {
    // Clear current selection and editing state
    setSelectedDefinitionId(null);
    setEditingDefinition(null);
    
    // Load default components
    onUpdateComponentDefinitions([...DEFAULT_COMPONENT_DEFINITIONS]);
    
    setIsConfirmLoadDefaultsModalOpen(false);
  };

  return (
    <Panel title="Component Definition Editor" icon={<PuzzlePieceIcon className="w-5 h-5 text-msx-textprimary" />} className="flex-grow flex flex-col !p-0">
      <div className="max-h-[800px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a5568 #2d3748' }}>
        <div className="flex flex-grow overflow-hidden" style={{ userSelect: 'none' }}>
          {/* Left Panel: List of Component Definitions */}
          <div className="w-1/3 border-r border-msx-border p-2 overflow-y-auto">
          <Button onClick={handleAddNewDefinition} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="w-full mb-2">
            Add New Component
          </Button>
          <div className="flex space-x-1 mb-2">
            <Button onClick={handleExportComponents} variant="ghost" size="sm" icon={<SaveIcon />} className="flex-1" title="Export all component definitions">
              Export
            </Button>
            <Button onClick={handleImportComponents} variant="ghost" size="sm" icon={<LoadIcon />} className="flex-1" title="Import component definitions">
              Import
            </Button>
          </div>
          <Button onClick={handleLoadDefaults} variant="secondary" size="sm" icon={<DocumentPlusIcon />} className="w-full mb-2" title="Load default component definitions">
            Default components
          </Button>
          {componentDefinitions.length === 0 && <p className="text-xs text-msx-textsecondary italic">No components defined.</p>}
          <ul className="space-y-1">
            {componentDefinitions.map(def => (
              <li key={def.id}>
                <button
                  onClick={() => handleSelectDefinition(def.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${selectedDefinitionId === def.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg hover:bg-msx-border text-msx-textprimary'}`}
                >
                  {def.name} <span className="text-msx-textsecondary text-[0.65rem]">({def.id})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

          {/* Right Panel: Editor for Selected/New Definition */}
          <div className="w-2/3 p-3">
          {!editingDefinition ? (
            <p className="text-msx-textsecondary text-center mt-10">Select a component definition to edit or add a new one.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="compDefName" className="block text-sm font-medium text-msx-textsecondary">Component Name:</label>
                <input
                  type="text"
                  id="compDefName"
                  value={editingDefinition.name || ''}
                  onChange={e => handleDefinitionChange('name', e.target.value)}
                  className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </div>
              <div>
                <label htmlFor="compDefDesc" className="block text-sm font-medium text-msx-textsecondary">Description:</label>
                <textarea
                  id="compDefDesc"
                  value={editingDefinition.description || ''}
                  onChange={e => handleDefinitionChange('description', e.target.value)}
                  rows={2}
                  className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </div>

              <Panel title="Properties" icon={<PuzzlePieceIcon className="w-3 h-3"/>} className="shadow-sm">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingDefinition.properties?.map((prop, index) => (
                    <div key={index} className="p-2 border border-msx-border/50 rounded bg-msx-bgcolor/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-msx-highlight">Property {index + 1}</span>
                        <Tooltip text="Remove this property"><Button onClick={() => handleRemoveProperty(index)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />} className="!p-0.5">{null}</Button></Tooltip>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-msx-textsecondary mb-0.5">Name:</label>
                          <input type="text" value={prop.name} onChange={e => handlePropertyChange(index, 'name', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                        </div>
                        <div>
                          <label className="block text-msx-textsecondary mb-0.5">Type:</label>
                          <select value={prop.type} onChange={e => handlePropertyChange(index, 'type', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                            {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-msx-textsecondary mb-0.5">Default Value{editingDefinition?.id === 'comp_shoot' && prop.name === 'aimMode' ? ' (select)' : ' (as string)'}:</label>
                          {editingDefinition?.id === 'comp_shoot' && prop.name === 'aimMode' ? (
                            <select
                              value={String(prop.defaultValue ?? 'facing')}
                              onChange={e => handlePropertyChange(index, 'defaultValue', e.target.value)}
                              className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"
                            >
                              <option value="facing">facing (izq/dcha según mirror)</option>
                              <option value="4dir">4dir (flechas/WASD)</option>
                            </select>
                          ) : (
                            <input type="text" value={String(prop.defaultValue ?? '')} onChange={e => handlePropertyChange(index, 'defaultValue', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-msx-textsecondary mb-0.5">Description:</label>
                          <input type="text" value={prop.description || ''} onChange={e => handlePropertyChange(index, 'description', e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddProperty} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="mt-2">Add Property</Button>
              </Panel>

              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => handleDeleteDefinition(editingDefinition as ComponentDefinition)} variant="danger" disabled={!componentDefinitions.find(d => d.id === editingDefinition?.id)}>
                  Delete Component
                </Button>
                <Button onClick={handleSaveDefinition} variant="primary" icon={<SaveIcon/>}>
                  Save Component
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
       {isConfirmDeleteModalOpen && definitionToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            title="Delete Component Definition"
            message={<>Are you sure you want to delete component "<strong>{definitionToDelete.name}</strong>"? This cannot be undone and may affect Entity Templates using it.</>}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmDeleteModalOpen(false)}
            confirmButtonVariant="danger"
        />
      )}
      
      <ConfirmationModal
        isOpen={isConfirmLoadDefaultsModalOpen}
        title="Load Default Components"
        message={
          <>
            <p>Are you sure you want to load the default components?</p>
            <p className="text-msx-warning mt-2"><strong>Your current components will be erased</strong> and replaced with the preset default components.</p>
          </>
        }
        onConfirm={handleConfirmLoadDefaults}
        onCancel={() => setIsConfirmLoadDefaultsModalOpen(false)}
        confirmText="Load Defaults"
        confirmButtonVariant="danger"
      />
    </Panel>
  );
};
