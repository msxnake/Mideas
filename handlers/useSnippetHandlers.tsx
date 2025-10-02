import { useCallback } from 'react';
import { Snippet, ProjectAsset, TileBank } from '../types';
import { resolveSnippetPlaceholders } from '../components/utils/snippetResolver';

interface SnippetHandlersProps {
  userSnippets: Snippet[];
  setUserSnippets: (updater: (prevSnippets: Snippet[]) => Snippet[]) => void;
  setIsSnippetEditorModalOpen: (open: boolean) => void;
  setEditingSnippet: (snippet: Snippet | null) => void;
  setStatusBarMessage: (message: string) => void;
  setConfirmModalProps: (props: any) => void;
  setIsConfirmModalOpen: (open: boolean) => void;
  setSnippetToInsert: (snippet: { code: string; timestamp: number }) => void;
  assets: ProjectAsset[];
  tileBanks: TileBank[];
}

const SNIPPETS_STORAGE_KEY = 'msxIdeUserSnippets_v1';

export const useSnippetHandlers = ({
  userSnippets,
  setUserSnippets,
  setIsSnippetEditorModalOpen,
  setEditingSnippet,
  setStatusBarMessage,
  setConfirmModalProps,
  setIsConfirmModalOpen,
  setSnippetToInsert,
  assets,
  tileBanks
}: SnippetHandlersProps) => {

  const handleOpenSnippetEditor = (snippet: Snippet | null) => {
    setEditingSnippet(snippet);
    setIsSnippetEditorModalOpen(true);
  };

  const handleSaveSnippet = (snippetToSave: Snippet) => {
    setUserSnippets(prevSnippets => {
      const existingIndex = prevSnippets.findIndex(s => s.id === snippetToSave.id);
      let updatedSnippets: Snippet[];

      if (existingIndex > -1) {
        updatedSnippets = [...prevSnippets];
        updatedSnippets[existingIndex] = snippetToSave;
      } else {
        updatedSnippets = [...prevSnippets, snippetToSave];
      }

      // Save to localStorage
      try {
        localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(updatedSnippets));
      } catch (e) {
        console.error('Failed to save snippets to localStorage:', e);
      }

      return updatedSnippets;
    });

    setIsSnippetEditorModalOpen(false);
    setEditingSnippet(null);
    setStatusBarMessage(`Snippet "${snippetToSave.name}" saved.`);
  };

  const handleDeleteSnippet = (snippetId: string) => {
    const snippetToDelete = userSnippets.find(s => s.id === snippetId);
    if (snippetToDelete) {
      setConfirmModalProps({
        title: "Delete Snippet",
        message: `Are you sure you want to delete snippet "${snippetToDelete.name}"? This cannot be undone.`,
        onConfirm: () => {
          setUserSnippets(prevSnippets => {
            const updatedSnippets = prevSnippets.filter(s => s.id !== snippetId);

            // Save to localStorage
            try {
              localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(updatedSnippets));
            } catch (e) {
              console.error('Failed to save snippets to localStorage:', e);
            }

            return updatedSnippets;
          });
          setStatusBarMessage(`Snippet "${snippetToDelete.name}" deleted.`);
          setIsConfirmModalOpen(false);
        },
        confirmText: "Delete",
        confirmButtonVariant: 'danger'
      });
      setIsConfirmModalOpen(true);
    }
  };

  const handleSnippetSelected = useCallback((snippet: Snippet) => {
    const resolvedCode = resolveSnippetPlaceholders(snippet.code, {
      assets,
      tileBanks,
    });
    setSnippetToInsert({ code: resolvedCode, timestamp: Date.now() });
  }, [assets, tileBanks, setSnippetToInsert]);

  return {
    handleOpenSnippetEditor,
    handleSaveSnippet,
    handleDeleteSnippet,
    handleSnippetSelected
  };
};