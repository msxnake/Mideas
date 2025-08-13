




import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Snippet, ProjectAsset, TileBank } from '../../types';

interface SnippetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (snippet: Snippet) => void;
  editingSnippet: Snippet | null;
  allAssets: ProjectAsset[];
  tileBanks: TileBank[];
}

const PLACEHOLDER_TYPES = ['tile', 'bank', 'screenmap'];
const MACRO_TYPES = ['BANK_TILE_DEFINITIONS'];

export const SnippetEditorModal: React.FC<SnippetEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSnippet,
  allAssets,
  tileBanks
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State for placeholder helper
  const [selectedPlaceholderType, setSelectedPlaceholderType] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedMacro, setSelectedMacro] = useState<string>('');
  const [selectedMacroAssetId, setSelectedMacroAssetId] = useState<string>('');


  useEffect(() => {
    if (isOpen) {
      if (editingSnippet) {
        setName(editingSnippet.name);
        setCode(editingSnippet.code);
      } else {
        setName('');
        setCode('');
      }
      setErrorMessage(null);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, editingSnippet]);

  if (!isOpen) {
    return null;
  }

  const handleSaveClick = () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (trimmedName === "") {
      setErrorMessage("Snippet name cannot be empty.");
      return;
    }
    if (trimmedCode === "") {
      setErrorMessage("Snippet code cannot be empty.");
      return;
    }

    onSave({
      id: editingSnippet ? editingSnippet.id : `snippet_${Date.now()}`,
      name: trimmedName,
      code: code, // Save code with its original spacing/newlines
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Allow Tab key in textarea for code editing
    if (e.key === 'Tab' && e.currentTarget.tagName === 'TEXTAREA') {
        e.preventDefault();
        const target = e.currentTarget as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;
        target.value = value.substring(0, start) + "\t" + value.substring(end);
        target.selectionStart = target.selectionEnd = start + 1;
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (codeTextareaRef.current) {
        const textarea = codeTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;
        const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
        setCode(newValue);
        // Set cursor position after the inserted text
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
        }, 0);
    }
  };
  
  const handleInsertPlaceholder = () => {
    if (!selectedPlaceholderType || !selectedAssetId || !selectedProperty) {
      alert("Please select a type, asset, and property.");
      return;
    }
    const assetName = (selectedPlaceholderType === 'bank' 
        ? tileBanks.find(b => b.id === selectedAssetId)?.name
        : allAssets.find(a => a.id === selectedAssetId)?.name) || 'Unknown';
    
    // Use asset NAME for readability in snippet, resolver will handle name or ID.
    const placeholderText = `{{${selectedPlaceholderType}.${assetName.replace(/\s+/g, '_')}.${selectedProperty}}}`;
    insertTextAtCursor(placeholderText);
  };
  
  const handleInsertMacro = () => {
    if (!selectedMacro || !selectedMacroAssetId) {
        alert("Please select a macro and a target asset.");
        return;
    }
    const assetName = tileBanks.find(b => b.id === selectedMacroAssetId)?.name || 'Unknown';
    const macroText = `{{${selectedMacro}(${assetName.replace(/\s+/g, '_')})}}`;
    insertTextAtCursor(macroText);
  };

  const getPropertiesForType = (type: string) => {
    switch(type) {
        case 'tile': return ['name', 'char_code', 'width', 'height'];
        case 'bank': return ['name', 'vram_pattern_start', 'vram_color_start', 'charset_start', 'charset_end'];
        case 'screenmap': return ['name', 'width', 'height'];
        default: return [];
    }
  };

  const assetsForSelectedType = allAssets.filter(a => a.type === selectedPlaceholderType);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snippetEditorModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="snippetEditorModalTitle" className="text-lg text-msx-highlight mb-4">
          {editingSnippet ? 'Edit Snippet' : 'Add New Snippet'}
        </h2>

        <div className="flex-grow space-y-3 overflow-y-auto pr-1">
          <div>
            <label htmlFor="snippetName" className="block text-xs text-msx-textsecondary mb-1">
              Snippet Name:
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="snippetName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent
                          ${errorMessage && name.trim() === "" ? 'border-msx-danger' : 'border-msx-border'}`}
            />
          </div>

          <div>
            <label htmlFor="snippetCode" className="block text-xs text-msx-textsecondary mb-1">
              Snippet Code:
            </label>
            <textarea
              ref={codeTextareaRef}
              id="snippetCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full p-2 text-sm bg-msx-bgcolor border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent font-mono min-h-[150px] h-48 resize-y
                          ${errorMessage && code.trim() === "" ? 'border-msx-danger' : 'border-msx-border'}`}
              rows={8}
              spellCheck="false"
            />
          </div>
          {errorMessage && (
            <p className="text-xs text-msx-danger mt-1">{errorMessage}</p>
          )}

           {/* Placeholder Helper UI */}
            <div className="p-2 border border-dashed border-msx-border/50 rounded mt-2 space-y-2 text-xs">
                <h5 className="text-msx-cyan">Placeholder Helper</h5>
                 {/* Simple Property Placeholders */}
                <div className="flex flex-wrap items-center gap-2">
                    <select value={selectedPlaceholderType} onChange={e => { setSelectedPlaceholderType(e.target.value); setSelectedAssetId(''); setSelectedProperty(''); }} className="p-1 bg-msx-bgcolor border-msx-border rounded">
                        <option value="">Select Type...</option>
                        {PLACEHOLDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="p-1 bg-msx-bgcolor border-msx-border rounded" disabled={!selectedPlaceholderType}>
                        <option value="">Select Asset...</option>
                        {selectedPlaceholderType === 'bank' 
                            ? tileBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                            : assetsForSelectedType.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                        }
                    </select>
                     <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="p-1 bg-msx-bgcolor border-msx-border rounded" disabled={!selectedAssetId}>
                        <option value="">Select Property...</option>
                        {getPropertiesForType(selectedPlaceholderType).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Button onClick={handleInsertPlaceholder} size="sm" variant="secondary" disabled={!selectedProperty}>Insert</Button>
                </div>
                {/* Macro Placeholders */}
                 <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-msx-border/30">
                     <select value={selectedMacro} onChange={e => setSelectedMacro(e.target.value)} className="p-1 bg-msx-bgcolor border-msx-border rounded">
                        <option value="">Select Macro...</option>
                        {MACRO_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {selectedMacro === 'BANK_TILE_DEFINITIONS' && (
                        <select value={selectedMacroAssetId} onChange={e => setSelectedMacroAssetId(e.target.value)} className="p-1 bg-msx-bgcolor border-msx-border rounded">
                            <option value="">Select Bank...</option>
                            {tileBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    )}
                     <Button onClick={handleInsertMacro} size="sm" variant="secondary" disabled={!selectedMacro || !selectedMacroAssetId}>Insert Macro</Button>
                 </div>
            </div>

        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">
            Cancel
          </Button>
          <Button onClick={handleSaveClick} variant="primary" size="md">
            Save Snippet
          </Button>
        </div>
      </div>
    </div>
  );
};
