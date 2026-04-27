import React, { useMemo } from 'react';
import { DialogueAsset, DialogueBoxCharCodes, DialogueLine, ProjectAsset, TileBank } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

interface DialogueEditorProps {
  dialogue: DialogueAsset;
  onUpdate: (data: DialogueAsset) => void;
  allAssets: ProjectAsset[];
  tileBanks: TileBank[];
  onCreateAsset?: (type: ProjectAsset['type']) => void;
}

const DEFAULT_BORDER_CHAR_CODES: DialogueBoxCharCodes = {
  topLeft: 43,
  topRight: 43,
  bottomLeft: 43,
  bottomRight: 43,
  horizontal: 45,
  vertical: 124,
};

const inputClassName = 'w-full p-2 text-sm text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const compactInputClassName = 'w-full p-1.5 text-xs text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const labelClassName = 'block text-xs text-msx-textsecondary mb-1';

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function ensureDialogue(dialogue: DialogueAsset): DialogueAsset {
  return {
    ...dialogue,
    lines: Array.isArray(dialogue.lines) && dialogue.lines.length > 0
      ? dialogue.lines
      : [{ id: `line_${Date.now()}`, speaker: '', text: '', waitForInput: true }],
    box: {
      x: 0,
      y: 20,
      width: 32,
      height: 4,
      borderSource: 'generated',
      ...dialogue.box,
      borderCharCodes: {
        ...DEFAULT_BORDER_CHAR_CODES,
        ...(dialogue.box?.borderCharCodes || {}),
      },
      borderTiles: {
        ...(dialogue.box?.borderTiles || {}),
      },
    },
    exportOptions: {
      maxCharsPerLine: 28,
      maxLinesPerBox: 3,
      stripUnsupportedChars: true,
      charDelayFrames: 2,
      ...dialogue.exportOptions,
    },
  };
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  dialogue,
  onUpdate,
  allAssets,
  tileBanks,
  onCreateAsset,
}) => {
  const data = ensureDialogue(dialogue);
  const fontAssets = useMemo(() => allAssets.filter(asset => asset.type === 'font'), [allAssets]);
  const tileAssets = useMemo(() => allAssets.filter(asset => asset.type === 'tile'), [allAssets]);
  const availableTileBanks = useMemo(() => {
    const tileBankAssets = allAssets
      .filter(asset => asset.type === 'tilebank' && asset.data)
      .map(asset => asset.data as TileBank);
    const byId = new Map<string, TileBank>();
    [...tileBanks, ...tileBankAssets].forEach(bank => {
      if (bank?.id) byId.set(bank.id, bank);
    });
    return Array.from(byId.values());
  }, [allAssets, tileBanks]);

  const update = (patch: Partial<DialogueAsset>) => {
    onUpdate({ ...data, ...patch });
  };

  const updateBox = (patch: Partial<DialogueAsset['box']>) => {
    update({ box: { ...data.box, ...patch } });
  };

  const updateExportOptions = (patch: Partial<DialogueAsset['exportOptions']>) => {
    update({ exportOptions: { ...data.exportOptions, ...patch } });
  };

  const updateLine = (lineId: string, patch: Partial<DialogueLine>) => {
    update({
      lines: data.lines.map(line => line.id === lineId ? { ...line, ...patch } : line),
    });
  };

  const addLine = () => {
    update({
      lines: [
        ...data.lines,
        { id: `line_${Date.now()}`, speaker: '', text: '', waitForInput: true },
      ],
    });
  };

  const removeLine = (lineId: string) => {
    if (data.lines.length <= 1) return;
    update({ lines: data.lines.filter(line => line.id !== lineId) });
  };

  const updateBorderCharCode = (field: keyof DialogueBoxCharCodes, value: number) => {
    updateBox({
      borderCharCodes: {
        ...DEFAULT_BORDER_CHAR_CODES,
        ...data.box.borderCharCodes,
        [field]: clampNumber(value, 0, 255),
      },
    });
  };

  const updateBorderTile = (field: keyof NonNullable<DialogueAsset['box']['borderTiles']>, value: string) => {
    updateBox({
      borderTiles: {
        ...(data.box.borderTiles || {}),
        [field]: value || undefined,
      },
    });
  };

  const borderCodes = { ...DEFAULT_BORDER_CHAR_CODES, ...data.box.borderCharCodes };
  const selectedBank = availableTileBanks.find(bank => bank.id === data.box.tileBankAssetId);
  const bankTileIds = selectedBank
    ? Array.from(new Set(selectedBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
    : [];
  const selectableTiles = tileAssets.filter(asset => bankTileIds.length === 0 || bankTileIds.includes(asset.id));

  return (
    <Panel title={`Dialogue Editor: ${data.name || 'Dialogue'}`} className="flex-grow flex flex-col min-h-0">
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-msx-highlight">Lines</h3>
              <Button size="sm" onClick={addLine} icon={<PlusCircleIcon className="w-4 h-4" />}>Add Line</Button>
            </div>
            <div className="space-y-2">
              {data.lines.map((line, index) => (
                <div key={line.id} className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-msx-textsecondary">Line {index + 1}</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeLine(line.id)}
                      disabled={data.lines.length <= 1}
                      icon={<TrashIcon className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
                    <div>
                      <label className={labelClassName}>Speaker</label>
                      <input
                        className={inputClassName}
                        value={line.speaker || ''}
                        onChange={event => updateLine(line.id, { speaker: event.target.value })}
                        placeholder="NPC"
                      />
                    </div>
                    <label className="flex items-end gap-2 text-xs text-msx-textsecondary pb-2">
                      <input
                        type="checkbox"
                        checked={line.waitForInput ?? true}
                        onChange={event => updateLine(line.id, { waitForInput: event.target.checked })}
                      />
                      Wait for SPC on this line
                    </label>
                  </div>
                  <div>
                    <label className={labelClassName}>Text</label>
                    <textarea
                      className={`${inputClassName} min-h-[88px] resize-y`}
                      value={line.text}
                      onChange={event => updateLine(line.id, { text: event.target.value })}
                      placeholder="Write dialogue text..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold text-msx-highlight">Text Box</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClassName}>X</label>
                  <input type="number" min={0} max={31} className={compactInputClassName} value={data.box.x} onChange={event => updateBox({ x: clampNumber(Number(event.target.value), 0, 31) })} />
                </div>
                <div>
                  <label className={labelClassName}>Y</label>
                  <input type="number" min={0} max={23} className={compactInputClassName} value={data.box.y} onChange={event => updateBox({ y: clampNumber(Number(event.target.value), 0, 23) })} />
                </div>
                <div>
                  <label className={labelClassName}>Width</label>
                  <input type="number" min={4} max={32} className={compactInputClassName} value={data.box.width} onChange={event => updateBox({ width: clampNumber(Number(event.target.value), 4, 32) })} />
                </div>
                <div>
                  <label className={labelClassName}>Height</label>
                  <input type="number" min={3} max={24} className={compactInputClassName} value={data.box.height} onChange={event => updateBox({ height: clampNumber(Number(event.target.value), 3, 24) })} />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Font</label>
                <select
                  className={inputClassName}
                  value={data.box.fontAssetId || ''}
                  onChange={event => updateBox({ fontAssetId: event.target.value || undefined })}
                >
                  <option value="">Default project font</option>
                  {fontAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                {fontAssets.length === 0 && onCreateAsset && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => onCreateAsset('font')}
                  >
                    Create Font
                  </Button>
                )}
              </div>
            </section>

            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold text-msx-highlight">Border</h3>
              <div>
                <label className={labelClassName}>Source</label>
                <select
                  className={inputClassName}
                  value={data.box.borderSource}
                  onChange={event => updateBox({ borderSource: event.target.value as DialogueAsset['box']['borderSource'] })}
                >
                  <option value="generated">Generated simple line chars</option>
                  <option value="tilebank">TileBank tiles</option>
                </select>
              </div>

              {data.box.borderSource === 'generated' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ['topLeft', 'Top Left'],
                    ['topRight', 'Top Right'],
                    ['bottomLeft', 'Bottom Left'],
                    ['bottomRight', 'Bottom Right'],
                    ['horizontal', 'Horizontal'],
                    ['vertical', 'Vertical'],
                  ] as const).map(([field, label]) => (
                    <div key={field}>
                      <label className={labelClassName}>{label}</label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        className={compactInputClassName}
                        value={borderCodes[field]}
                        onChange={event => updateBorderCharCode(field, Number(event.target.value))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className={labelClassName}>TileBank</label>
                    <select
                      className={inputClassName}
                      value={data.box.tileBankAssetId || ''}
                      onChange={event => updateBox({ tileBankAssetId: event.target.value || undefined })}
                    >
                      <option value="">Select TileBank</option>
                      {availableTileBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                      ))}
                    </select>
                    {availableTileBanks.length === 0 && onCreateAsset && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => onCreateAsset('tilebank')}
                      >
                        Create TileBank
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      ['topLeftTileId', 'Top Left'],
                      ['topRightTileId', 'Top Right'],
                      ['bottomLeftTileId', 'Bottom Left'],
                      ['bottomRightTileId', 'Bottom Right'],
                      ['horizontalTileId', 'Horizontal'],
                      ['verticalTileId', 'Vertical'],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <label className={labelClassName}>{label}</label>
                        <select
                          className={compactInputClassName}
                          value={data.box.borderTiles?.[field] || ''}
                          onChange={event => updateBorderTile(field, event.target.value)}
                        >
                          <option value="">Omitted</option>
                          {selectableTiles.map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold text-msx-highlight">Playback / Export Metadata</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClassName}>Char Delay Frames</label>
                  <input type="number" min={0} max={255} className={compactInputClassName} value={data.exportOptions.charDelayFrames} onChange={event => updateExportOptions({ charDelayFrames: clampNumber(Number(event.target.value), 0, 255) })} />
                </div>
                <div>
                  <label className={labelClassName}>Max Chars / Line</label>
                  <input type="number" min={4} max={64} className={compactInputClassName} value={data.exportOptions.maxCharsPerLine} onChange={event => updateExportOptions({ maxCharsPerLine: clampNumber(Number(event.target.value), 4, 64) })} />
                </div>
                <div>
                  <label className={labelClassName}>Max Lines / Box</label>
                  <input type="number" min={1} max={8} className={compactInputClassName} value={data.exportOptions.maxLinesPerBox} onChange={event => updateExportOptions({ maxLinesPerBox: clampNumber(Number(event.target.value), 1, 8) })} />
                </div>
                <label className="flex items-end gap-2 text-xs text-msx-textsecondary pb-2">
                  <input
                    type="checkbox"
                    checked={data.exportOptions.stripUnsupportedChars}
                    onChange={event => updateExportOptions({ stripUnsupportedChars: event.target.checked })}
                  />
                  Strip unsupported chars
                </label>
              </div>
            </section>
          </div>
        </section>
      </div>
    </Panel>
  );
};
