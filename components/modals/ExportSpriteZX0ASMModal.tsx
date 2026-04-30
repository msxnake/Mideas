import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { DataFormat, Sprite } from '../../types';
import { getSpriteDrawableLayerIndexes, getSpriteLayerByteBlocks, SpriteLayerByteBlock } from '../utils/spriteUtils';

interface ExportSpriteZX0ASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  spriteToExport: Sprite;
  dataOutputFormat: DataFormat;
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

interface CompressionBlockResult extends SpriteLayerByteBlock {
  label: string;
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

const getSafeSpriteName = (spriteName: string) => spriteName.replace(/[^a-zA-Z0-9_]/g, '_');
const getSafeAsmLabel = (spriteName: string) => getSafeSpriteName(spriteName).toUpperCase();

const formatBytesAsAsm = (bytes: number[], dataFormat: DataFormat) => {
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

const buildCompressedAsm = (
  sprite: Sprite,
  dataFormat: DataFormat,
  blockResults: CompressionBlockResult[],
  layerIndexes: number[]
) => {
  const safeLabel = getSafeAsmLabel(sprite.name);
  const layerSummary = layerIndexes
    .map(index => `C${index}=${sprite.spritePalette[index]}`)
    .join(', ');
  const offsetSummary = layerIndexes
    .map(index => `C${index}=${sprite.msx1LayerOffsets?.[index]?.offsetY ?? 0}`)
    .join(', ');

  const totalOriginal = blockResults.reduce((sum, block) => sum + block.result.originalSize, 0);
  const totalCompressed = blockResults.reduce((sum, block) => sum + block.result.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalRatio = totalOriginal > 0 ? (1 - totalCompressed / totalOriginal) * 100 : 0;

  let asm = `; ZX0 compressed MSX1 sprite layer data for ${sprite.name}\n`;
  asm += `; Source: ${sprite.size.width}x${sprite.size.height}, frames=${sprite.frames.length}, layers=${layerIndexes.length}\n`;
  asm += `; Layer order (front to back): ${layerSummary || 'none'}\n`;
  if (sprite.msx1LayerOffsets && Object.keys(sprite.msx1LayerOffsets).length > 0) {
    asm += `; Layer Y offsets: ${offsetSummary}\n`;
  }
  asm += `; Blocks: ${blockResults.length} frame/layer stream(s), compressed independently.\n`;
  asm += `; Total raw bytes: ${totalOriginal}\n`;
  asm += `; Total ZX0 bytes: ${totalCompressed}\n`;
  asm += `; Total saved bytes: ${totalSaved}\n`;
  asm += `; Total compression ratio: ${totalRatio.toFixed(2)}%\n`;
  asm += `${safeLabel}_SPRITE_WIDTH       EQU ${sprite.size.width}\n`;
  asm += `${safeLabel}_SPRITE_HEIGHT      EQU ${sprite.size.height}\n`;
  asm += `${safeLabel}_SPRITE_FRAMES      EQU ${sprite.frames.length}\n`;
  asm += `${safeLabel}_SPRITE_LAYERS      EQU ${layerIndexes.length}\n`;
  asm += `${safeLabel}_SPRITE_TOTAL_RAW_SIZE EQU ${totalOriginal}\n`;
  asm += `${safeLabel}_SPRITE_TOTAL_ZX0_SIZE EQU ${totalCompressed}\n\n`;

  asm += `${safeLabel}_SPRITE_ZX0_LAYER_PTRS:\n`;
  for (const block of blockResults) {
    asm += `    DW ${block.label}\n`;
  }
  asm += `\n${safeLabel}_SPRITE_ZX0_LAYER_RAW_SIZES:\n`;
  for (const block of blockResults) {
    asm += `    DW ${block.result.originalSize} ; F${block.frameIndex} LAYER${block.layerIndex}\n`;
  }
  asm += `\n${safeLabel}_SPRITE_ZX0_LAYER_SIZES:\n`;
  for (const block of blockResults) {
    asm += `    DW ${block.result.compressedSize} ; F${block.frameIndex} LAYER${block.layerIndex}\n`;
  }
  asm += '\n';

  for (const block of blockResults) {
    asm += `; Frame ${block.frameIndex}, Layer ${block.layerIndex}, Color ${block.layerColor}: ${block.result.originalSize} -> ${block.result.compressedSize} bytes (${block.result.ratio.toFixed(2)}%)\n`;
    asm += `${block.label}: ; Brush Color Index ${block.layerIndex} (Actual Color: ${block.layerColor})\n`;
    asm += formatBytesAsAsm(block.result.compressedBytes, dataFormat);
    asm += '\n';
  }

  return asm.trimEnd();
};

export const ExportSpriteZX0ASMModal: React.FC<ExportSpriteZX0ASMModalProps> = ({
  isOpen,
  onClose,
  spriteToExport,
  dataOutputFormat,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockResults, setBlockResults] = useState<CompressionBlockResult[]>([]);

  const layerBlocks = useMemo(() => getSpriteLayerByteBlocks(spriteToExport), [spriteToExport]);
  const layerIndexes = useMemo(() => getSpriteDrawableLayerIndexes(spriteToExport), [spriteToExport]);
  const asmCode = blockResults.length === layerBlocks.length
    ? buildCompressedAsm(spriteToExport, dataOutputFormat, blockResults, layerIndexes)
    : '';
  const totalOriginal = layerBlocks.reduce((sum, block) => sum + block.bytes.length, 0);
  const totalCompressed = blockResults.reduce((sum, block) => sum + block.result.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalRatio = totalOriginal > 0 && blockResults.length > 0 ? (1 - totalCompressed / totalOriginal) * 100 : 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const runCompression = async () => {
      setIsCompressing(true);
      setError(null);
      setBlockResults([]);

      try {
        const safeLabel = getSafeAsmLabel(spriteToExport.name);
        const nextResults: CompressionBlockResult[] = [];

        for (const block of layerBlocks) {
          const response = await fetch(`${getBackendBaseUrl()}/compress-binary-zx0`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bytes: block.bytes }),
          });
          const payload = await response.json();

          if (!response.ok || !payload.success) {
            throw new Error(payload.details || payload.message || `ZX0 sprite compression failed for frame ${block.frameIndex}, layer ${block.layerIndex}.`);
          }

          nextResults.push({
            ...block,
            label: `${safeLabel}_F${block.frameIndex}_LAYER${block.layerIndex}_ZX0`,
            result: payload,
          });
        }

        setBlockResults(nextResults);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setIsCompressing(false);
      }
    };

    runCompression();
  }, [isOpen, layerBlocks, spriteToExport.name]);

  if (!isOpen || !spriteToExport) {
    return null;
  }

  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;
  const safeSpriteName = getSafeSpriteName(spriteToExport.name);

  const handleCopyToClipboard = () => {
    if (!asmCode) return;
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('ZX0 sprite ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy ZX0 sprite ASM code: ', err));
  };

  const handleDownloadASM = () => {
    if (!asmCode) return;
    const blob = new Blob([asmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeSpriteName}_sprite_zx0.asm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZX0 = () => {
    if (blockResults.length === 0) return;
    const bytes = blockResults.flatMap(block => block.result.compressedBytes);
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeSpriteName}_sprite_layers.zx0bin`;
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
      aria-labelledby="exportSpriteZx0AsmModalTitle"
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl animate-slideIn font-sans flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportSpriteZx0AsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">
          Export ZX0 Sprite ASM: {spriteToExport.name}
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

        <div className="mb-3 rounded border border-msx-border bg-msx-bgcolor/40 p-2 text-xs text-msx-textsecondary">
          {spriteToExport.frames.length} frame(s) x {layerIndexes.length} layer(s), {spriteToExport.size.width}x{spriteToExport.size.height}px. Each frame/layer is compressed independently.
        </div>

        <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2">
          {layerBlocks.map(block => {
            const compressed = blockResults.find(item => item.frameIndex === block.frameIndex && item.layerIndex === block.layerIndex);
            return (
              <div key={`sprite-zx0-${block.frameIndex}-${block.layerIndex}`} className="rounded border border-msx-border bg-msx-bgcolor/40 p-2">
                <div className="text-msx-textprimary">Frame {block.frameIndex}, Layer {block.layerIndex}</div>
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
            Compressing sprite data with ZX0...
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
              ZX0 sprite ASM output will appear here.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} disabled={!asmCode} variant="secondary" size="md" className="w-full sm:w-auto">Copy ASM</Button>
          <Button onClick={handleDownloadASM} disabled={!asmCode} variant="primary" size="md" className="w-full sm:w-auto">Download .ASM</Button>
          <Button onClick={handleDownloadZX0} disabled={blockResults.length === 0} variant="primary" size="md" className="w-full sm:w-auto">Download .ZX0BIN</Button>
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};
