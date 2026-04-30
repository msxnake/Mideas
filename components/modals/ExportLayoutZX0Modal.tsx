import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { LayoutASMExportData } from '../../types';

interface ExportLayoutZX0ModalProps extends LayoutASMExportData {
  isOpen: boolean;
  onClose: () => void;
}

interface CompressionSourceBlock {
  id: string;
  title: string;
  label: string;
  bytes: number[];
}

interface Zx0BinaryCompressionResult {
  success: boolean;
  method: 'ZX0';
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  ratio: number;
  compressedBytes: number[];
  message?: string;
  details?: string;
}

interface CompressionBlockResult extends CompressionSourceBlock {
  result: Zx0BinaryCompressionResult;
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;
const ASM_BYTES_PER_LINE = 16;

const getBackendBaseUrl = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const configuredBaseUrl = env.VITE_BACKEND_URL?.trim() || env.VITE_API_BASE_URL?.trim();
  return (configuredBaseUrl || 'http://localhost:3001').replace(/\/+$/, '');
};

const getSafeMapName = (mapName: string) => mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();

const formatBytesAsAsm = (bytes: number[], dataFormat: LayoutASMExportData['dataFormat']) => {
  const formatByte = (value: number) => (
    dataFormat === 'hex'
      ? `#${value.toString(16).padStart(2, '0').toUpperCase()}`
      : value.toString(10)
  );

  let asm = '';
  for (let i = 0; i < bytes.length; i += ASM_BYTES_PER_LINE) {
    asm += `    DB ${bytes.slice(i, i + ASM_BYTES_PER_LINE).map(formatByte).join(',')}\n`;
  }
  return asm;
};

const buildSourceBlocks = (props: ExportLayoutZX0ModalProps): CompressionSourceBlock[] => {
  const safeMapName = getSafeMapName(props.mapName);

  if ((props.exportMode === 'blocks2x2' || props.exportMode === 'blocks4x4') && props.blockData) {
    return [
      {
        id: 'catalog',
        title: 'Block catalog',
        label: `SCREEN_${safeMapName}_BLOCK_CATALOG_ZX0`,
        bytes: props.blockData.catalogBytes,
      },
      {
        id: 'map',
        title: 'Block map',
        label: `SCREEN_${safeMapName}_BLOCK_MAP_ZX0`,
        bytes: props.blockData.mapIndices,
      },
    ];
  }

  return [
    {
      id: 'layout',
      title: 'Raw layout',
      label: `SCREEN_${safeMapName}_LAYOUT_ZX0`,
      bytes: props.mapIndices,
    },
  ];
};

const buildCompressedAsm = (
  props: ExportLayoutZX0ModalProps,
  blockResults: CompressionBlockResult[]
) => {
  const safeMapName = getSafeMapName(props.mapName);
  const isBlockExport = (props.exportMode === 'blocks2x2' || props.exportMode === 'blocks4x4') && props.blockData;
  const totalOriginal = blockResults.reduce((sum, block) => sum + block.result.originalSize, 0);
  const totalCompressed = blockResults.reduce((sum, block) => sum + block.result.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalRatio = totalOriginal > 0 ? (1 - totalCompressed / totalOriginal) * 100 : 0;

  let asm = `; ZX0 compressed screen layout data for ${props.mapName}\n`;
  asm += `; Source layout: ${props.mapWidth}x${props.mapHeight}, mode=${props.exportMode || 'raw'}\n`;
  asm += `; Total original bytes: ${totalOriginal}\n`;
  asm += `; Total ZX0 bytes: ${totalCompressed}\n`;
  asm += `; Total saved bytes: ${totalSaved}\n`;
  asm += `; Total compression ratio: ${totalRatio.toFixed(2)}%\n`;

  if (isBlockExport && props.blockData) {
    asm += `; Block layout: ${props.blockData.blockWidth}x${props.blockData.blockHeight}\n`;
    asm += `; The catalog and the block index map are compressed independently.\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_LAYOUT_PRESENT      EQU 1\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_LAYOUT_MODE         EQU ${props.blockData.blockWidth}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_CATALOG_COUNT       EQU ${props.blockData.catalogEntryCount}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_MAP_WIDTH           EQU ${props.blockData.mapWidth}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_MAP_HEIGHT          EQU ${props.blockData.mapHeight}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_CATALOG_RAW_SIZE    EQU ${props.blockData.catalogLengthBytes}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_MAP_RAW_SIZE        EQU ${props.blockData.mapLengthBytes}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_CATALOG_ZX0_SIZE    EQU ${blockResults.find(block => block.id === 'catalog')?.result.compressedSize ?? 0}\n`;
    asm += `SCREEN_${safeMapName}_BLOCK_MAP_ZX0_SIZE        EQU ${blockResults.find(block => block.id === 'map')?.result.compressedSize ?? 0}\n\n`;
  } else {
    asm += `; Decompress with dzx0_standard into the same destination buffer used by the raw layout.\n`;
    asm += `SCREEN_${safeMapName}_LAYOUT_RAW_SIZE           EQU ${props.mapIndices.length}\n`;
    asm += `SCREEN_${safeMapName}_LAYOUT_ZX0_SIZE           EQU ${blockResults[0]?.result.compressedSize ?? 0}\n\n`;
  }

  for (const block of blockResults) {
    asm += `; ${block.title}: ${block.result.originalSize} -> ${block.result.compressedSize} bytes (${block.result.ratio.toFixed(2)}%)\n`;
    asm += `${block.label}:\n`;
    asm += formatBytesAsAsm(block.result.compressedBytes, props.dataFormat);
    asm += '\n';
  }

  return asm.trimEnd();
};

export const ExportLayoutZX0Modal: React.FC<ExportLayoutZX0ModalProps> = (props) => {
  const { isOpen, onClose, mapName } = props;
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockResults, setBlockResults] = useState<CompressionBlockResult[]>([]);

  const sourceBlocks = useMemo(() => buildSourceBlocks(props), [
    props.mapName,
    props.mapWidth,
    props.mapHeight,
    props.mapIndices,
    props.exportMode,
    props.blockData,
  ]);

  const totalOriginal = sourceBlocks.reduce((sum, block) => sum + block.bytes.length, 0);
  const totalCompressed = blockResults.reduce((sum, block) => sum + block.result.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalRatio = totalOriginal > 0 && blockResults.length > 0 ? (1 - totalCompressed / totalOriginal) * 100 : 0;
  const asmCode = blockResults.length === sourceBlocks.length ? buildCompressedAsm(props, blockResults) : '';
  const isBlockExport = sourceBlocks.length > 1;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const runCompression = async () => {
      setIsCompressing(true);
      setError(null);
      setBlockResults([]);

      try {
        const nextResults: CompressionBlockResult[] = [];

        for (const block of sourceBlocks) {
          const response = await fetch(`${getBackendBaseUrl()}/compress-binary-zx0`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bytes: block.bytes }),
          });
          const payload = await response.json();

          if (!response.ok || !payload.success) {
            throw new Error(payload.details || payload.message || `ZX0 compression failed for ${block.title}.`);
          }

          nextResults.push({ ...block, result: payload });
        }

        setBlockResults(nextResults);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setIsCompressing(false);
      }
    };

    runCompression();
  }, [isOpen, sourceBlocks]);

  if (!isOpen) {
    return null;
  }

  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');

  const handleCopyToClipboard = () => {
    if (!asmCode) return;
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('ZX0 ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy ZX0 ASM code: ', err));
  };

  const handleDownloadASM = () => {
    if (!asmCode) return;
    const blob = new Blob([asmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeMapName}_layout_zx0.asm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBIN = () => {
    if (blockResults.length === 0) return;
    const bytes = blockResults.flatMap(block => block.result.compressedBytes);
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isBlockExport ? `${safeMapName}_layout_blocks.zx0bin` : `${safeMapName}_layout.zx0`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exportLayoutZx0ModalTitle"
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl animate-slideIn font-sans flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportLayoutZx0ModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">
          Export ZX0 Layout: {mapName}
        </h2>

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
            <div className="text-msx-textsecondary">Source</div>
            <div className="text-msx-textprimary">{totalOriginal} B</div>
          </div>
          <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
            <div className="text-msx-textsecondary">ZX0</div>
            <div className="text-msx-textprimary">{blockResults.length ? `${totalCompressed} B` : '-'}</div>
          </div>
          <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
            <div className="text-msx-textsecondary">Saved</div>
            <div className={blockResults.length && totalSaved >= 0 ? 'text-msx-highlight' : 'text-msx-warning'}>
              {blockResults.length ? `${totalSaved} B` : '-'}
            </div>
          </div>
          <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
            <div className="text-msx-textsecondary">Ratio</div>
            <div className={blockResults.length && totalRatio >= 0 ? 'text-msx-highlight' : 'text-msx-warning'}>
              {blockResults.length ? `${totalRatio.toFixed(2)}%` : '-'}
            </div>
          </div>
        </div>

        <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2">
          {sourceBlocks.map(block => {
            const compressed = blockResults.find(item => item.id === block.id);
            return (
              <div key={block.id} className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
                <div className="text-msx-textprimary">{block.title}</div>
                <div className="mt-1 text-msx-textsecondary">
                  {block.bytes.length} B raw
                  {compressed ? ` -> ${compressed.result.compressedSize} B ZX0 (${compressed.result.ratio.toFixed(2)}%)` : ' -> pending'}
                </div>
              </div>
            );
          })}
        </div>

        {isCompressing && (
          <div className="mb-3 rounded border border-msx-border bg-msx-bgcolor/40 p-3 text-xs text-msx-textsecondary">
            Compressing {isBlockExport ? 'catalog and block map' : 'layout'} with ZX0...
          </div>
        )}

        {error && (
          <div className="mb-3 rounded border border-msx-danger bg-msx-danger/20 p-3 text-xs text-white">
            {error}
          </div>
        )}

        <div className="flex-grow overflow-auto mb-3 sm:mb-4">
          {asmCode ? (
            <Z80SyntaxHighlighter
              code={asmCode}
              editorFontSize={MODAL_DEFAULT_FONT_SIZE}
              editorLineHeight={editorLineHeight}
            />
          ) : (
            <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-4 text-sm text-msx-textsecondary">
              ZX0 output will appear here.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} disabled={!asmCode} variant="secondary" size="md" className="w-full sm:w-auto">Copy ASM</Button>
          <Button onClick={handleDownloadASM} disabled={!asmCode} variant="primary" size="md" className="w-full sm:w-auto">Download .ASM</Button>
          <Button onClick={handleDownloadBIN} disabled={!asmCode} variant="primary" size="md" className="w-full sm:w-auto">{isBlockExport ? 'Download .ZX0BIN' : 'Download .ZX0'}</Button>
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};
