import { useCallback } from 'react';
import JSZip from 'jszip';
import { ProjectAsset, EditorType, Sprite, MSXFont, MSXFontColorAttributes } from '../types';
import { generateMSXProjectFiles, DEFAULT_MSX_CONFIG } from '../utils/msxMainGenerator';
import { normalizeImportedPT3Data } from '../components/utils/trackerUtils';
import { buildIntermediateGameJsonV1 } from '../utils/intermediateGameJson';
import { downloadTextFile } from '../utils/downloadUtils';

interface ImportExportHandlersProps {
  assets: ProjectAsset[];
  setAssetsWithHistory: (updater: (prevAssets: ProjectAsset[]) => ProjectAsset[]) => void;
  setSelectedAssetId: (id: string | null) => void;
  setCurrentEditor: (editor: EditorType) => void;
  setStatusBarMessage: (message: string) => void;
  currentProjectName: string | null;
  currentScreenMode: string;
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  tileBanks: any[];
  componentDefinitions: any[];
  entityTemplates: any[];
  mainMenuConfig: any;
  setIsCodeExportModalOpen: (open: boolean) => void;
}

export const useImportExportHandlers = ({
  assets,
  setAssetsWithHistory,
  setSelectedAssetId,
  setCurrentEditor,
  setStatusBarMessage,
  currentProjectName,
  currentScreenMode,
  msxFont,
  msxFontColorAttributes,
  tileBanks,
  componentDefinitions,
  entityTemplates,
  mainMenuConfig,
  setIsCodeExportModalOpen
}: ImportExportHandlersProps) => {

  const handleSpriteImported = (newSpriteData: Omit<Sprite, 'id' | 'name'>) => {
    const id = `sprite_imported_${Date.now()}`;
    const name = `Imported Sprite ${assets.filter(a => a.type === 'sprite').length + 1}`;
    const fullSpriteData: Sprite = {
      ...newSpriteData,
      id,
      name,
      currentFrameIndex: newSpriteData.frames.length > 0 ? 0 : -1,
    };
    const newAsset: ProjectAsset = { id, name, type: 'sprite', data: fullSpriteData };
    setAssetsWithHistory(prev => [...prev, newAsset]);
    setSelectedAssetId(id);
    setCurrentEditor(EditorType.Sprite);
    setStatusBarMessage(`Sprite "${name}" imported successfully.`);
  };

  const handleImportTrack = (trackData: any, fileName: string) => {
    try {
      const normalizedSongData = normalizeImportedPT3Data(trackData, fileName);
      const id = `track_imported_${Date.now()}`;
      const name = normalizedSongData.name || `Imported Track ${assets.filter(a => a.type === 'track').length + 1}`;

      const newAsset: ProjectAsset = {
        id,
        name,
        type: 'track',
        data: {
          ...normalizedSongData,
          id,
          name,
        },
      };

      setAssetsWithHistory(prev => [...prev, newAsset]);
      setSelectedAssetId(id);
      setCurrentEditor(EditorType.Track);
      setStatusBarMessage(`Track "${name}" imported successfully.`);
    } catch (error) {
      console.error('Error importing track:', error);
      setStatusBarMessage('Error importing track. Please check the file format.');
    }
  };

  const handleExportAllCodeFiles = async () => {
    setStatusBarMessage("Exporting complete MSX project (code, binary assets & main.asm)...");
    const codeAssets = assets.filter(a => a.type === 'code' || a.type === 'behavior');
    const tileAssetsAll = assets.filter(a => a.type === 'tile');
    const spriteAssetsAll = assets.filter(a => a.type === 'sprite');
    const screenMapAsset = assets.find(a => a.type === 'screenmap');

    if (codeAssets.length === 0 && tileAssetsAll.length === 0 && spriteAssetsAll.length === 0 && !screenMapAsset && Object.keys(msxFont).length === 0) {
      setStatusBarMessage("No files or font data to export.");
      return;
    }

    let projectName = currentProjectName || "MSX_Project";
    const zipFilename = `${projectName}.zip`;

    try {
      const zip = new JSZip();
      const projectFolderInZip = zip.folder(projectName);

      if (!projectFolderInZip) {
        setStatusBarMessage("Error creating project folder in ZIP.");
        return;
      }

      // Export code assets
      codeAssets.forEach(asset => {
        const filename = asset.name.endsWith('.asm') ? asset.name : `${asset.name}.asm`;
        projectFolderInZip.file(filename, asset.data as string);
      });

      // Generate MSX project files
      const msxConfig = {
        ...DEFAULT_MSX_CONFIG,
        projectName,
        assets: assets,
        tileBanks,
        componentDefinitions,
        entityTemplates,
        mainMenuConfig,
        msxFont
      };

      const msxProjectFiles = generateMSXProjectFiles(msxConfig);

      // Add generated MSX files to ZIP
      Object.entries(msxProjectFiles).forEach(([filename, content]) => {
        projectFolderInZip.file(filename, content);
      });

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      setStatusBarMessage(`Project exported as "${zipFilename}".`);
    } catch (error) {
      console.error('Error exporting project:', error);
      setStatusBarMessage('Error exporting project files.');
    }
  };

  const handleShowMapFile = useCallback(() => {
    setIsCodeExportModalOpen(true);
  }, [setIsCodeExportModalOpen]);

  const handleGenerateTemplatesAsm = useCallback(() => {
    try {
      // This would be implemented to generate ASM templates
      setStatusBarMessage("Templates ASM generation feature needs implementation.");
    } catch (error) {
      console.error('Error generating templates ASM:', error);
      setStatusBarMessage('Error generating templates ASM.');
    }
  }, [setStatusBarMessage]);

  const handleExportIntermediateGameJson = useCallback(() => {
    try {
      const projectName = currentProjectName || 'Mideas_Project';
      const exportMode = window.prompt(
        'Export mode: compact-pretty | compact-min | full-pretty | full-min',
        'compact-pretty'
      );
      if (!exportMode) return;
      const normalized = exportMode.trim().toLowerCase();
      const includeHumanEntities = normalized.startsWith('full-');
      const minified = normalized.endsWith('-min');
      const indent: number | undefined = minified ? undefined : 2;

      const intermediate = buildIntermediateGameJsonV1({
        assets,
        currentProjectName,
        currentScreenMode,
        tileBanks,
        componentDefinitions,
        entityTemplates,
        msxFont,
        msxFontColorAttributes,
        includeHumanEntities,
      });

      const suffix = normalized.includes('full-') ? '_full' : '_compact';
      const suffix2 = minified ? '_min' : '';
      const filename = `${projectName}_game_structure${suffix}${suffix2}.json`;
      const content = JSON.stringify(intermediate, null, indent as any);
      downloadTextFile(filename, content, 'application/json');
      setStatusBarMessage(`Game structure exported as "${filename}".`);
    } catch (error) {
      console.error('Error exporting intermediate game JSON:', error);
      setStatusBarMessage('Error exporting game structure JSON.');
    }
  }, [
    assets,
    currentProjectName,
    currentScreenMode,
    tileBanks,
    componentDefinitions,
    entityTemplates,
    mainMenuConfig,
    msxFont,
    msxFontColorAttributes,
    setStatusBarMessage
  ]);

  return {
    handleSpriteImported,
    handleImportTrack,
    handleExportAllCodeFiles,
    handleShowMapFile,
    handleGenerateTemplatesAsm,
    handleExportIntermediateGameJson
  };
};
