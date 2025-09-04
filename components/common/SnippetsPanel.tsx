


import React from 'react';
import { Panel } from './Panel';
import { Button } from './Button';
import { CodeIcon, PlusCircleIcon, PencilIcon, TrashIcon } from '../icons/MsxIcons'; 
import { Snippet } from '../../types'; // Import Snippet type

/**
 * Props for the SnippetsPanel component.
 */
interface SnippetsPanelProps {
  /** The list of snippets to display. */
  snippets: Snippet[];
  /** Callback function when a snippet is selected to be inserted. */
  onSnippetSelect: (snippet: Snippet) => void;
  /** Callback function to open the snippet editor for a new snippet. */
  onAddSnippet: () => void;
  /** Callback function to open the snippet editor for an existing snippet. */
  onEditSnippet: (snippet: Snippet) => void;
  /** Callback function to delete a snippet. */
  onDeleteSnippet: (snippetId: string) => void;
  /** Whether the snippets panel is enabled and should be visible. */
  isEnabled: boolean;
}

/**
 * A panel that displays a list of code snippets, allowing for insertion, editing, and deletion.
 */
export const SnippetsPanel: React.FC<SnippetsPanelProps> = ({ 
  snippets, 
  onSnippetSelect, 
  onAddSnippet,
  onEditSnippet,
  onDeleteSnippet,
  isEnabled 
}) => {
  if (!isEnabled) {
    return null;
  }

  return (
    <Panel title="Code Snippets" className="w-64 flex-shrink-0 h-full flex flex-col" icon={<CodeIcon className="w-4 h-4 text-msx-textsecondary"/>}>
      <div className="space-y-1 overflow-y-auto flex-grow pr-1">
        {snippets.map(snippet => (
          <div key={snippet.id} className="flex items-center space-x-1 group">
            <Button 
              onClick={() => onSnippetSelect(snippet)} 
              variant="ghost" 
              size="sm" 
              className="flex-grow justify-start text-xs py-1.5 truncate"
              title={`Insert snippet: ${snippet.name}`}
            >
              {snippet.name}
            </Button>
            <Button 
              onClick={() => onEditSnippet(snippet)} 
              variant="ghost" 
              size="sm" 
              className="!p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" 
              icon={<PencilIcon className="w-3 h-3"/>}
              title={`Edit ${snippet.name}`}
            >
              {null}
            </Button>
            <Button 
              onClick={() => onDeleteSnippet(snippet.id)} 
              variant="ghost" 
              size="sm" 
              className="!p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-msx-danger hover:!bg-msx-danger/20"
              icon={<TrashIcon className="w-3 h-3"/>}
              title={`Delete ${snippet.name}`}
            >
              {null}
            </Button>
          </div>
        ))}
        {snippets.length === 0 && (
          <p className="text-xs text-msx-textsecondary p-2 italic">No snippets available. Click "Add Snippet" to create one.</p>
        )}
      </div>
      <div className="pt-1 border-t border-msx-border">
        <Button 
          onClick={onAddSnippet}
          variant="secondary"
          size="sm"
          icon={<PlusCircleIcon className="w-3.5 h-3.5"/>}
          className="w-full mt-1"
        >
          Add Snippet
        </Button>
      </div>
    </Panel>
  );
};