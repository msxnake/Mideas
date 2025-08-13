import React, { useState, useEffect } from 'react';
import { EntityTemplate, ComponentDefinition, EntityTemplateComponent, ComponentPropertyDefinition, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SaveIcon, PuzzlePieceIcon, CaretDownIcon, CaretRightIcon, SpriteIcon, CodeIcon } from '../icons/MsxIcons';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { AssetPickerModal } from '../modals/AssetPickerModal';

interface EntityTemplateEditorProps {
  entityTemplates: EntityTemplate[];
  onUpdateEntityTemplates: (updatedTemplates: EntityTemplate[]) => void;
  componentDefinitions: ComponentDefinition[];
  onGenerateAsm: () => void;
  allAssets: ProjectAsset[];
}

export const EntityTemplateEditor: React.FC<EntityTemplateEditorProps> = ({
  entityTemplates,
  onUpdateEntityTemplates,
  componentDefinitions,
  onGenerateAsm,
  allAssets,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EntityTemplate> | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EntityTemplate | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Record<string,boolean>>({});
  const [isAddComponentModalOpen, setIsAddComponentModalOpen] = useState(false);
  
  const [assetPickerState, setAssetPickerState] = useState<{
    isOpen: boolean;
    assetTypeToPick: ProjectAsset['type'] | null;
    onSelect: ((assetId: string) => void) | null;
    currentValue: string | null;
  }>({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });


  useEffect(() => {
    if (selectedTemplateId) {
        if (editingTemplate && editingTemplate.id === selectedTemplateId &&
            !entityTemplates.find(d => d.id === selectedTemplateId)) {
            return;
        }

        const templateFromList = entityTemplates.find(t => t.id === selectedTemplateId);
        if (templateFromList) {
            setEditingTemplate({ ...templateFromList, components: templateFromList.components.map(c => ({...c, defaultValues: {...c.defaultValues}})) });
        } else {
             if (!(editingTemplate && editingTemplate.id === selectedTemplateId)) {
                setEditingTemplate(null);
            }
        }
    } else {
        setEditingTemplate(null);
    }
     setExpandedComponents({});
  }, [selectedTemplateId, entityTemplates]);


  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
  };

  const handleAddNewTemplate = () => {
    const newId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
    const newTpl: Partial<EntityTemplate> = {
      id: newId,
      name: `NewEntityTemplate_${entityTemplates.length + 1}`,
      icon: '❓',
      description: '',
      components: [],
    };
    setEditingTemplate(newTpl);
    setSelectedTemplateId(newId);
    setExpandedComponents({});
  };

  const handleTemplateChange = (field: keyof Omit<EntityTemplate, 'components' | 'id'>, value: string) => {
    if (editingTemplate) {
      setEditingTemplate(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleComponentDefaultValueChange = (componentDefId: string, propertyName: string, value: any) => {
    if (editingTemplate && editingTemplate.components) {
      const newComponents = editingTemplate.components.map(c => {
        if (c.definitionId === componentDefId) {
          return { ...c, defaultValues: { ...c.defaultValues, [propertyName]: value } };
        }
        return c;
      });
      setEditingTemplate(prev => prev ? { ...prev, components: newComponents } : null);
    }
  };

  const handleAddComponentToTemplate = (componentDefId: string) => {
    if (editingTemplate && !editingTemplate.components?.find(c => c.definitionId === componentDefId)) {
      const componentDef = componentDefinitions.find(cd => cd.id === componentDefId);
      if (!componentDef) return;

      const newTemplateComponent: EntityTemplateComponent = {
        definitionId: componentDefId,
        defaultValues: {}, 
      };
      componentDef.properties.forEach(prop => {
        if (prop.defaultValue !== undefined) {
            newTemplateComponent.defaultValues[prop.name] = prop.defaultValue;
        }
      });

      setEditingTemplate(prev => ({
        ...prev,
        components: [...(prev?.components || []), newTemplateComponent],
      }));
    }
    setIsAddComponentModalOpen(false);
  };

  const handleRemoveComponentFromTemplate = (componentDefId: string) => {
    if (editingTemplate && editingTemplate.components) {
      setEditingTemplate(prev => ({
        ...prev,
        components: prev?.components?.filter(c => c.definitionId !== componentDefId),
      }));
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.id || !editingTemplate.name?.trim()) {
      alert("Template ID and Name are required.");
      return;
    }
    const finalTemplate = { ...editingTemplate } as EntityTemplate;
    const existingIndex = entityTemplates.findIndex(t => t.id === finalTemplate.id);

    if (existingIndex > -1) {
       if (entityTemplates.some(t => t.name.toLowerCase() === finalTemplate.name.toLowerCase() && t.id !== finalTemplate.id)) {
        alert(`An entity template with the name "${finalTemplate.name}" already exists.`);
        return;
      }
      const updated = [...entityTemplates];
      updated[existingIndex] = finalTemplate;
      onUpdateEntityTemplates(updated);
    } else {
       if (entityTemplates.some(t => t.name.toLowerCase() === finalTemplate.name.toLowerCase())) {
        alert(`An entity template with the name "${finalTemplate.name}" already exists.`);
        return;
      }
      onUpdateEntityTemplates([...entityTemplates, finalTemplate]);
    }
  };
  
  const handleDeleteTemplate = (template: EntityTemplate | null) => {
    if (template) {
        setTemplateToDelete(template);
        setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (templateToDelete) {
        onUpdateEntityTemplates(entityTemplates.filter(t => t.id !== templateToDelete.id));
        if (selectedTemplateId === templateToDelete.id) {
            setSelectedTemplateId(null);
            setEditingTemplate(null);
        }
    }
    setIsConfirmDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  const openAssetPicker = (
    propertyType: ComponentPropertyDefinition['type'],
    currentValue: string,
    onSelectCallback: (assetId: string) => void
  ) => {
    const assetTypeMap: Record<string, ProjectAsset['type']> = {
        'sprite_ref': 'sprite',
        'sound_ref': 'sound',
        'behavior_script_ref': 'behavior',
        'entity_template_ref': 'entitytemplate',
    };
    const assetType = assetTypeMap[propertyType];
    if (!assetType) return;

    setAssetPickerState({
        isOpen: true,
        assetTypeToPick: assetType,
        onSelect: onSelectCallback,
        currentValue: currentValue,
    });
  };

  const toggleComponentExpansion = (componentDefId: string) => {
    setExpandedComponents(prev => ({...prev, [componentDefId]: !prev[componentDefId]}));
  };

  const getComponentPropertyOriginalDefault = (defId: string, propName: string): string => {
    const compDef = componentDefinitions.find(cd => cd.id === defId);
    const propDef = compDef?.properties.find(p => p.name === propName);
    return String(propDef?.defaultValue ?? '');
  };


  return (
    <Panel title="Entity Template Editor" icon={<SpriteIcon className="w-5 h-5 text-msx-textprimary" />} className="flex-grow flex flex-col !p-0">
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/3 border-r border-msx-border p-2 overflow-y-auto">
          <div className="flex space-x-2 mb-2">
              <Button onClick={handleAddNewTemplate} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="flex-1">
                Add New
              </Button>
              <Button onClick={onGenerateAsm} variant="secondary" size="sm" icon={<CodeIcon />} className="flex-1" title="Generate Z80 assembly data from all templates">
                Generate ASM
              </Button>
          </div>

          {entityTemplates.length === 0 && <p className="text-xs text-msx-textsecondary italic">No templates defined.</p>}
          <ul className="space-y-1">
            {entityTemplates.map(tpl => (
              <li key={tpl.id}>
                <button
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${selectedTemplateId === tpl.id ? 'bg-msx-accent text-white' : 'bg-msx-panelbg hover:bg-msx-border text-msx-textprimary'}`}
                >
                  {tpl.icon} {tpl.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3 p-3 overflow-y-auto">
          {!editingTemplate ? (
            <p className="text-msx-textsecondary text-center mt-10">Select an entity template to edit or add a new one.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="tplName" className="block text-sm font-medium text-msx-textsecondary">Template Name:</label>
                <input type="text" id="tplName" value={editingTemplate.name || ''} onChange={e => handleTemplateChange('name', e.target.value)} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="tplIcon" className="block text-sm font-medium text-msx-textsecondary">Icon (Emoji/Char):</label>
                  <input type="text" id="tplIcon" value={editingTemplate.icon || ''} onChange={e => handleTemplateChange('icon', e.target.value)} maxLength={2} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
                </div>
              </div>
              <div>
                <label htmlFor="tplDesc" className="block text-sm font-medium text-msx-textsecondary">Description:</label>
                <textarea id="tplDesc" value={editingTemplate.description || ''} onChange={e => handleTemplateChange('description', e.target.value)} rows={2} className="w-full p-1.5 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/>
              </div>

              <Panel title="Assigned Components" icon={<PuzzlePieceIcon className="w-3 h-3"/>} className="shadow-sm">
                <Button onClick={() => setIsAddComponentModalOpen(true)} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="mb-2">Add Component</Button>
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {editingTemplate.components?.map(tc => {
                    const compDef = componentDefinitions.find(cd => cd.id === tc.definitionId);
                    if (!compDef) return <div key={tc.definitionId} className="text-xs text-red-500">Error: Component Definition "{tc.definitionId}" not found.</div>;
                    const isExpanded = !!expandedComponents[tc.definitionId];
                    return (
                      <div key={tc.definitionId} className="p-1.5 border border-msx-border/50 rounded bg-msx-bgcolor/50">
                        <div className="flex justify-between items-center">
                          <button onClick={() => toggleComponentExpansion(tc.definitionId)} className="flex items-center text-xs text-msx-cyan hover:text-msx-highlight">
                            {isExpanded ? <CaretDownIcon className="w-2.5 h-2.5 mr-1"/> : <CaretRightIcon className="w-2.5 h-2.5 mr-1"/>}
                            {compDef.name}
                          </button>
                          <Button onClick={() => handleRemoveComponentFromTemplate(tc.definitionId)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} className="!p-0.5">{null}</Button>
                        </div>
                        {isExpanded && (
                           <div className="mt-1.5 pl-2 space-y-1 border-l border-msx-border/30">
                                {compDef.properties.map(propDef => {
                                    const overrideValue = tc.defaultValues[propDef.name];
                                    const definitionDefaultValue = propDef.defaultValue;
                                    const currentValue = overrideValue !== undefined ? overrideValue : definitionDefaultValue;
                                    const isRefType = propDef.type.endsWith('_ref');

                                    return (
                                        <div key={propDef.name} className="text-xs">
                                            <label className="block text-msx-textsecondary text-[0.65rem] mb-0.5">
                                                {propDef.name} <span className="text-msx-textprimary/70">({propDef.type})</span>
                                                <span className="italic text-msx-textsecondary/70 ml-1">(Def: {getComponentPropertyOriginalDefault(compDef.id, propDef.name)})</span>
                                            </label>
                                            {isRefType ? (
                                                <div className="flex items-center space-x-1">
                                                    <span className="p-1 bg-msx-bgcolor border border-msx-border/30 rounded text-msx-textsecondary flex-grow truncate" title={currentValue || "None"}>
                                                        {allAssets.find(a => a.id === currentValue)?.name || "None"}
                                                    </span>
                                                    <Button size="sm" variant="secondary" onClick={() => openAssetPicker(propDef.type, currentValue, (assetId) => handleComponentDefaultValueChange(compDef.id, propDef.name, assetId))}>...</Button>
                                                </div>
                                            ) : propDef.type === 'boolean' ? (
                                                <input type="checkbox" checked={currentValue === true || String(currentValue).toLowerCase() === 'true'} onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.checked)} className="form-checkbox ml-1 bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                                            ) : (
                                                <input type={propDef.type === 'byte' || propDef.type === 'word' ? 'number' : 'text'} value={String(currentValue ?? '')} onChange={e => handleComponentDefaultValueChange(compDef.id, propDef.name, e.target.value)} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" placeholder={`Default for ${propDef.name}`}/>
                                            )}
                                        </div>
                                    );
                                })}
                           </div>
                        )}
                      </div>
                    );
                  })}
                  {(!editingTemplate.components || editingTemplate.components.length === 0) && <p className="text-xs text-msx-textsecondary italic">No components assigned.</p>}
                </div>
              </Panel>

              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => handleDeleteTemplate(editingTemplate as EntityTemplate)} variant="danger" disabled={!entityTemplates.find(t => t.id === editingTemplate?.id)}>
                  Delete Template
                </Button>
                <Button onClick={handleSaveTemplate} variant="primary" icon={<SaveIcon/>}>
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {assetPickerState.isOpen && (
        <AssetPickerModal
            isOpen={assetPickerState.isOpen}
            onClose={() => setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null })}
            onSelectAsset={(assetId) => {
                assetPickerState.onSelect?.(assetId);
                setAssetPickerState({ isOpen: false, assetTypeToPick: null, onSelect: null, currentValue: null });
            }}
            assetTypeToPick={assetPickerState.assetTypeToPick!}
            allAssets={allAssets}
            currentSelectedId={assetPickerState.currentValue}
        />
      )}

      {isAddComponentModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsAddComponentModalOpen(false)}>
          <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-sm animate-slideIn" onClick={e => e.stopPropagation()}>
            <h4 className="text-md text-msx-highlight mb-3">Add Component to Template</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {componentDefinitions.filter(cd => !editingTemplate.components?.find(c => c.definitionId === cd.id)).map(cd => (
                <Button key={cd.id} onClick={() => handleAddComponentToTemplate(cd.id)} variant="ghost" className="w-full justify-start text-xs">
                  {cd.name}
                </Button>
              ))}
              {componentDefinitions.filter(cd => !editingTemplate.components?.find(c => c.definitionId === cd.id)).length === 0 && (
                <p className="text-xs text-msx-textsecondary italic p-2">All available components are already added or no components defined.</p>
              )}
            </div>
            <Button onClick={() => setIsAddComponentModalOpen(false)} variant="primary" size="sm" className="mt-3 w-full">Close</Button>
          </div>
        </div>
      )}
       {isConfirmDeleteModalOpen && templateToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            title="Delete Entity Template"
            message={<>Are you sure you want to delete template "<strong>{templateToDelete.name}</strong>"? This cannot be undone and may affect existing entity instances.</>}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirmDeleteModalOpen(false)}
            confirmButtonVariant="danger"
        />
      )}
    </Panel>
  );
};
