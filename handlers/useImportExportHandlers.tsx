import { useCallback, type ChangeEvent } from 'react';
import JSZip from 'jszip';
import { ProjectAsset, EditorType, Sprite, MSXFont, MSXFontColorAttributes } from '../types';
import { normalizeImportedPT3Data } from '../components/utils/trackerUtils';
import { buildIntermediateGameJsonV1 } from '../utils/intermediateGameJson';
import { downloadBlobFile, downloadTextFile } from '../utils/downloadUtils';
import { buildGameSketch } from '../utils/gameSketch/buildGameSketch';
import { getProjectTargetFromScreenMode } from '../utils/projectTarget';
import { createUniqueAssetId, createUniqueAssetName, parseBossExportPackage, remapBossPackageForImport } from '../utils/bossPackageUtils';

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

  const handleImportBossPackageFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const packageData = parseBossExportPackage(String(loadEvent.target?.result || ''));
        const usedIds = new Set(assets.map(asset => asset.id));
        const bossId = createUniqueAssetId('boss_imported', usedIds);
        const bossName = createUniqueAssetName(packageData.boss.name || file.name.replace(/\.json$/i, ''), assets, 'boss');
        const { boss, assetsToCreate } = remapBossPackageForImport(packageData, assets, {
          bossId,
          bossName,
          existingTileBankIds: new Set(tileBanks.map(tileBank => tileBank.id)),
          reservedAssetIds: new Set([bossId]),
        });

        const bossAsset: ProjectAsset = {
          id: bossId,
          name: bossName,
          type: 'boss',
          data: boss,
        };

        setAssetsWithHistory(prev => [...prev, ...assetsToCreate, bossAsset]);
        setSelectedAssetId(bossId);
        setCurrentEditor(EditorType.Boss);
        setStatusBarMessage(`Boss "${bossName}" imported with ${assetsToCreate.length} dependency asset(s).`);
      } catch (error) {
        console.error('Error importing Boss package:', error);
        setStatusBarMessage('Error importing Boss package. Please check the file format.');
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setStatusBarMessage('Error reading Boss package file.');
      event.target.value = '';
    };
    reader.readAsText(file);
  }, [assets, setAssetsWithHistory, setSelectedAssetId, setCurrentEditor, setStatusBarMessage, tileBanks]);

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

  /**
   * Files > Export Sketch IA: engine-neutral ZIP (JSON + PNG + rules + audio)
   * that an AI can use to rebuild the MSX1 game in Godot, HTML5, MSX2...
   */
  const handleExportGameSketch = useCallback(async () => {
    if (getProjectTargetFromScreenMode(currentScreenMode) !== 'MSX1') {
      setStatusBarMessage('Sketch IA export is only available for MSX1 (SCREEN 2) projects.');
      return;
    }
    const answer = window.prompt(
      'Sketch IA - graphics scale and upscale method.\n' +
      'Format: <scale 1-8> <smooth|nearest>\n' +
      '  1         = original pixels only\n' +
      '  3 smooth  = original + x3 with Scale2x/Scale3x pixel-art filter\n' +
      '  2 nearest = original + x2 with plain big pixels',
      '2 smooth'
    );
    if (answer === null) return;
    const [scaleText, methodText] = answer.trim().toLowerCase().split(/\s+/);
    const scale = Math.max(1, Math.min(8, parseInt(scaleText || '1', 10) || 1));
    const scaleMethod = methodText === 'nearest' ? 'nearest' : 'smooth';

    try {
      setStatusBarMessage('Building Sketch IA...');
      const result = buildGameSketch({
        assets,
        currentProjectName,
        currentScreenMode,
        componentDefinitions,
        entityTemplates,
        msxFont,
        msxFontColorAttributes,
        options: { scale, scaleMethod },
      });
      const zip = new JSZip();
      const root = zip.folder(result.rootFolder)!;
      for (const file of result.files) root.file(file.path, file.content);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const filename = `${result.rootFolder}.zip`;
      downloadBlobFile(filename, blob);
      setStatusBarMessage(
        `Sketch IA exported as "${filename}" (${result.files.length} files${result.warnings.length ? `, ${result.warnings.length} warnings` : ''}).`
      );
    } catch (error) {
      console.error('Error exporting Sketch IA:', error);
      setStatusBarMessage('Error exporting Sketch IA.');
    }
  }, [
    assets,
    currentProjectName,
    currentScreenMode,
    componentDefinitions,
    entityTemplates,
    msxFont,
    msxFontColorAttributes,
    setStatusBarMessage
  ]);

  return {
    handleSpriteImported,
    handleExportGameSketch,
    handleImportTrack,
    handleImportBossPackageFile,
    handleExportAllCodeFiles,
    handleShowMapFile,
    handleGenerateTemplatesAsm,
    handleExportIntermediateGameJson
  };
};
