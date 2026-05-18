import React, { useMemo } from 'react';
import { DialogueAsset, DialogueBoxCharCodes, DialogueLine, PortraitAsset, ProjectAsset, TileBank } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

interface DialogueEditorProps {
  dialogue: DialogueAsset;
  onUpdate: (data: DialogueAsset) => void;
  allAssets: ProjectAsset[];
  tileBanks: TileBank[];
  onCreateAsset?: (type: ProjectAsset['type'], options?: { select?: boolean }) => ProjectAsset | void;
}

const DEFAULT_BORDER_CHAR_CODES: DialogueBoxCharCodes = {
  topLeft: 43,
  topRight: 43,
  bottomLeft: 43,
  bottomRight: 43,
  horizontal: 45,
  vertical: 124,
};

const DEFAULT_TILE_GRAPHIC: NonNullable<DialogueAsset['box']['graphic']> = {
  enabled: false,
  side: 'left',
  width: 4,
  height: 3,
  padding: 1,
  tileIds: [],
};

const inputClassName = 'w-full p-2 text-sm text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const compactInputClassName = 'w-full p-1.5 text-xs text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const labelClassName = 'block text-xs text-msx-textsecondary mb-1';

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getUnsupportedDialogueChars(text: string): string[] {
  return Array.from(new Set(Array.from(text || '').filter(char => {
    const code = char.charCodeAt(0);
    return code < 32 || code > 126;
  })));
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
      graphic: {
        ...DEFAULT_TILE_GRAPHIC,
        ...(dialogue.box?.graphic || {}),
        tileIds: Array.isArray(dialogue.box?.graphic?.tileIds) ? dialogue.box.graphic.tileIds : [],
      },
    },
    exportOptions: {
      maxCharsPerLine: 28,
      maxLinesPerBox: 3,
      stripUnsupportedChars: true,
      charDelayFrames: 2,
      mouthToggleEveryChars: 3,
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
  const portraitAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'portrait' && asset.data) as Array<ProjectAsset & { data: PortraitAsset }>,
    [allAssets]
  );
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

  const updateGraphic = (patch: Partial<NonNullable<DialogueAsset['box']['graphic']>>) => {
    const currentGraphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
    updateBox({
      graphic: {
        ...currentGraphic,
        ...patch,
        tileIds: patch.tileIds || currentGraphic.tileIds || [],
      },
    });
  };

  const updateExportOptions = (patch: Partial<DialogueAsset['exportOptions']>) => {
    update({ exportOptions: { ...data.exportOptions, ...patch } });
  };

  const updateLine = (lineId: string, patch: Partial<DialogueLine>) => {
    update({
      lines: data.lines.map(line => line.id === lineId ? { ...line, ...patch } : line),
    });
  };

  const getLineGraphic = (line: DialogueLine): NonNullable<DialogueLine['graphic']> | undefined => {
    if (!line.graphic) return undefined;
    return {
      ...DEFAULT_TILE_GRAPHIC,
      ...line.graphic,
      tileIds: Array.isArray(line.graphic.tileIds) ? line.graphic.tileIds : [],
    };
  };

  const updateLineGraphic = (lineId: string, patch: Partial<NonNullable<DialogueLine['graphic']>>) => {
    const line = data.lines.find(candidate => candidate.id === lineId);
    const currentGraphic = {
      ...DEFAULT_TILE_GRAPHIC,
      ...(line?.graphic || {}),
      tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
    };
    updateLine(lineId, {
      graphic: {
        ...currentGraphic,
        ...patch,
        tileIds: patch.tileIds || currentGraphic.tileIds || [],
      },
    });
  };

  const updateLineGraphicSize = (lineId: string, width: number, height: number) => {
    const line = data.lines.find(candidate => candidate.id === lineId);
    const currentGraphic = {
      ...DEFAULT_TILE_GRAPHIC,
      ...(line?.graphic || {}),
      tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
    };
    const nextWidth = clampNumber(width, 1, 8);
    const nextHeight = clampNumber(height, 1, 6);
    updateLineGraphic(lineId, {
      width: nextWidth,
      height: nextHeight,
      tileIds: Array.from({ length: nextWidth * nextHeight }, (_, index) => currentGraphic.tileIds?.[index] || ''),
    });
  };

  const updateLineGraphicTile = (lineId: string, tileIndex: number, value: string) => {
    const line = data.lines.find(candidate => candidate.id === lineId);
    const currentGraphic = {
      ...DEFAULT_TILE_GRAPHIC,
      ...(line?.graphic || {}),
      tileIds: Array.isArray(line?.graphic?.tileIds) ? line.graphic.tileIds : [],
    };
    const nextTileIds = [...currentGraphic.tileIds];
    nextTileIds[tileIndex] = value;
    updateLineGraphic(lineId, { tileIds: nextTileIds });
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

  const createAndAssignFont = () => {
    const created = onCreateAsset?.('font', { select: false });
    if (created?.id) {
      updateBox({ fontAssetId: created.id });
    }
  };

  const createAndAssignTileBank = () => {
    const created = onCreateAsset?.('tilebank', { select: false });
    if (created?.id) {
      updateBox({ borderSource: 'tilebank', tileBankAssetId: created.id });
    }
  };

  const createAndAssignGraphicTileBank = () => {
    const created = onCreateAsset?.('tilebank', { select: false });
    if (created?.id) {
      updateGraphic({ enabled: true, tileBankAssetId: created.id });
    }
  };

  const createAndAssignPortrait = () => {
    const created = onCreateAsset?.('portrait', { select: false });
    if (created?.id && created.data) {
      const portrait = created.data as PortraitAsset;
      updateGraphic({
        enabled: true,
        portraitAssetId: created.id,
        tileBankAssetId: portrait.tileBankAssetId,
        width: portrait.widthChars,
        height: portrait.heightChars,
        tileIds: portrait.cells || [],
      });
    }
  };

  const applyPortraitToGraphic = (
    currentGraphic: NonNullable<DialogueAsset['box']['graphic']>,
    portraitAssetId: string
  ): Partial<NonNullable<DialogueAsset['box']['graphic']>> => {
    const portrait = portraitAssets.find(asset => asset.id === portraitAssetId)?.data;
    if (!portrait) {
      return { portraitAssetId: undefined };
    }
    return {
      enabled: true,
      portraitAssetId,
      tileBankAssetId: portrait.tileBankAssetId || currentGraphic.tileBankAssetId,
      width: portrait.widthChars,
      height: portrait.heightChars,
      tileIds: Array.isArray(portrait.cells) ? portrait.cells : [],
    };
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

  const updateGraphicTile = (tileIndex: number, value: string) => {
    const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
    const nextTileIds = [...(graphic.tileIds || [])];
    nextTileIds[tileIndex] = value;
    updateGraphic({ tileIds: nextTileIds });
  };

  const updateGraphicSize = (width: number, height: number) => {
    const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
    const nextWidth = clampNumber(width, 1, 8);
    const nextHeight = clampNumber(height, 1, 6);
    const nextCount = nextWidth * nextHeight;
    updateGraphic({
      width: nextWidth,
      height: nextHeight,
      tileIds: Array.from({ length: nextCount }, (_, index) => graphic.tileIds?.[index] || ''),
    });
  };

  const borderCodes = { ...DEFAULT_BORDER_CHAR_CODES, ...data.box.borderCharCodes };
  const graphic = { ...DEFAULT_TILE_GRAPHIC, ...(data.box.graphic || {}) };
  const selectedGraphicPortrait = portraitAssets.find(asset => asset.id === graphic.portraitAssetId)?.data;
  const updateLinePortrait = (line: DialogueLine, portraitAssetId: string) => {
    if (!portraitAssetId) {
      updateLine(line.id, { graphic: undefined });
      return;
    }
    const baseGraphic = getLineGraphic(line) || {
      ...graphic,
      enabled: true,
      tileIds: Array.isArray(graphic.tileIds) ? graphic.tileIds : [],
    };
    updateLineGraphic(line.id, applyPortraitToGraphic(baseGraphic, portraitAssetId));
  };
  const selectedBank = availableTileBanks.find(bank => bank.id === data.box.tileBankAssetId);
  const bankTileIds = selectedBank
    ? Array.from(new Set(selectedBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
    : [];
  const selectableTiles = tileAssets.filter(asset => bankTileIds.length === 0 || bankTileIds.includes(asset.id));
  const selectedGraphicBank = availableTileBanks.find(bank => bank.id === graphic.tileBankAssetId);
  const graphicBankTileIds = selectedGraphicBank
    ? Array.from(new Set(selectedGraphicBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
    : [];
  const graphicSelectableTiles = tileAssets.filter(asset => graphicBankTileIds.length === 0 || graphicBankTileIds.includes(asset.id));
  const maxBoxX = 28;
  const maxBoxY = 21;
  const maxBoxWidth = Math.max(4, 32 - data.box.x);
  const maxBoxHeight = Math.max(3, 24 - data.box.y);
  const previewLine = data.lines.find(line => line.text.trim()) || data.lines[0];
  const previewSpeaker = previewLine?.speaker?.trim();
  const previewText = `${previewSpeaker ? `${previewSpeaker}: ` : ''}${previewLine?.text || ''}`;
  const textColumnCapacity = Math.max(1, data.box.width - 2);
  const graphicReservedColumns = graphic.enabled ? Math.min(textColumnCapacity - 1, Math.max(1, graphic.width) + Math.max(0, graphic.padding)) : 0;
  const textColumnCapacityForExport = Math.max(1, textColumnCapacity - graphicReservedColumns);
  const textRowCapacity = Math.max(1, data.box.height - 2);
  const dialogueValidationIssues = [
    ...(data.exportOptions.maxCharsPerLine > textColumnCapacityForExport
      ? [`Max Chars / Line exceeds the available text width (${textColumnCapacityForExport}).`]
      : []),
    ...(data.exportOptions.maxLinesPerBox > textRowCapacity
      ? [`Max Lines / Box exceeds the box interior height (${textRowCapacity}).`]
      : []),
    ...data.lines.flatMap((line, index) => {
      const speakerPrefix = line.speaker?.trim() ? `${line.speaker.trim()}: ` : '';
      const rawLineText = `${speakerPrefix}${line.text || ''}`;
      const totalChars = rawLineText.length;
      const estimatedRows = Math.max(1, Math.ceil(totalChars / Math.max(1, data.exportOptions.maxCharsPerLine)));
      const unsupportedChars = getUnsupportedDialogueChars(rawLineText);
      return [
        ...(estimatedRows > data.exportOptions.maxLinesPerBox
        ? [`Line ${index + 1} needs about ${estimatedRows} rows with the current export limits.`]
        : []),
        ...(unsupportedChars.length > 0
          ? [`Line ${index + 1} contains non-ASCII chars (${unsupportedChars.join(' ')}). Export will ${data.exportOptions.stripUnsupportedChars ? 'normalize or replace them' : 'replace unsupported bytes with spaces'}.`]
          : []),
      ];
    }),
  ];

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
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_220px_1fr] gap-2">
                    <div>
                      <label className={labelClassName}>Speaker</label>
                      <input
                        className={inputClassName}
                        value={line.speaker || ''}
                        onChange={event => updateLine(line.id, { speaker: event.target.value })}
                        placeholder="NPC"
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Line Portrait / NPC</label>
                      <select
                        className={compactInputClassName}
                        value={line.graphic?.portraitAssetId || (line.graphic ? '__manual__' : '')}
                        onChange={event => {
                          if (event.target.value === '__manual__') return;
                          updateLinePortrait(line, event.target.value);
                        }}
                      >
                        <option value="">Global portrait</option>
                        {line.graphic && !line.graphic.portraitAssetId && (
                          <option value="__manual__">Manual line grid</option>
                        )}
                        {portraitAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                      </select>
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
                  <div className="border border-msx-border/70 bg-msx-bgcolor-dark/70 rounded p-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
                      <input
                        type="checkbox"
                        checked={Boolean(line.graphic)}
                        onChange={event => updateLine(line.id, { graphic: event.target.checked ? { ...DEFAULT_TILE_GRAPHIC, enabled: true } : undefined })}
                      />
                      Override tile graphic for this line
                    </label>
                    {getLineGraphic(line) && (() => {
                      const lineGraphic = getLineGraphic(line)!;
                      const lineGraphicBank = availableTileBanks.find(bank => bank.id === lineGraphic.tileBankAssetId);
                      const lineGraphicBankTileIds = lineGraphicBank
                        ? Array.from(new Set(lineGraphicBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
                        : [];
                      const lineGraphicSelectableTiles = tileAssets.filter(asset => lineGraphicBankTileIds.length === 0 || lineGraphicBankTileIds.includes(asset.id));
                      const selectedLineGraphicPortrait = portraitAssets.find(asset => asset.id === lineGraphic.portraitAssetId)?.data;

                      return (
                        <div className="space-y-2">
                          <div>
                            <label className={labelClassName}>Portrait Asset</label>
                            <select
                              className={compactInputClassName}
                              value={lineGraphic.portraitAssetId || ''}
                              onChange={event => {
                                const portraitAssetId = event.target.value;
                                updateLineGraphic(line.id, portraitAssetId
                                  ? applyPortraitToGraphic(lineGraphic, portraitAssetId)
                                  : { portraitAssetId: undefined });
                              }}
                            >
                              <option value="">Manual tile grid</option>
                              {portraitAssets.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={labelClassName}>Side</label>
                              <select
                                className={compactInputClassName}
                                value={lineGraphic.side}
                                onChange={event => updateLineGraphic(line.id, { side: event.target.value as NonNullable<DialogueLine['graphic']>['side'] })}
                              >
                                <option value="left">Left of text</option>
                                <option value="right">Right of text</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClassName}>Padding</label>
                              <input
                                type="number"
                                min={0}
                                max={4}
                                className={compactInputClassName}
                                value={lineGraphic.padding}
                                onChange={event => updateLineGraphic(line.id, { padding: clampNumber(Number(event.target.value), 0, 4) })}
                              />
                            </div>
                            <div>
                              <label className={labelClassName}>Width</label>
                              <input
                                type="number"
                                min={1}
                                max={8}
                                className={compactInputClassName}
                                value={lineGraphic.width}
                                disabled={Boolean(lineGraphic.portraitAssetId)}
                                onChange={event => updateLineGraphicSize(line.id, Number(event.target.value), lineGraphic.height)}
                              />
                            </div>
                            <div>
                              <label className={labelClassName}>Height</label>
                              <input
                                type="number"
                                min={1}
                                max={6}
                                className={compactInputClassName}
                                value={lineGraphic.height}
                                disabled={Boolean(lineGraphic.portraitAssetId)}
                                onChange={event => updateLineGraphicSize(line.id, lineGraphic.width, Number(event.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClassName}>TileBank</label>
                            <select
                              className={compactInputClassName}
                              value={lineGraphic.tileBankAssetId || ''}
                              onChange={event => updateLineGraphic(line.id, { tileBankAssetId: event.target.value || undefined })}
                            >
                              <option value="">Use no TileBank</option>
                              {availableTileBanks.map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                              ))}
                            </select>
                          </div>
                          {lineGraphic.portraitAssetId ? (
                            <p className="text-xs text-msx-textsecondary">
                              Using portrait "{selectedLineGraphicPortrait?.name || 'missing'}" ({lineGraphic.width} x {lineGraphic.height} chars).
                            </p>
                          ) : (
                            <div
                              className="grid gap-1"
                              style={{ gridTemplateColumns: `repeat(${Math.max(1, lineGraphic.width)}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: Math.max(1, lineGraphic.width) * Math.max(1, lineGraphic.height) }).map((_, tileIndex) => (
                                <select
                                  key={tileIndex}
                                  className={compactInputClassName}
                                  value={lineGraphic.tileIds?.[tileIndex] || ''}
                                  onChange={event => updateLineGraphicTile(line.id, tileIndex, event.target.value)}
                                  title={`Line ${index + 1} graphic tile ${tileIndex + 1}`}
                                >
                                  <option value="">Empty</option>
                                  {lineGraphicSelectableTiles.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                                  ))}
                                </select>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
                  <input
                    type="number"
                    min={0}
                    max={maxBoxX}
                    className={compactInputClassName}
                    value={data.box.x}
                    onChange={event => {
                      const nextX = clampNumber(Number(event.target.value), 0, maxBoxX);
                      updateBox({ x: nextX, width: clampNumber(data.box.width, 4, 32 - nextX) });
                    }}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Y</label>
                  <input
                    type="number"
                    min={0}
                    max={maxBoxY}
                    className={compactInputClassName}
                    value={data.box.y}
                    onChange={event => {
                      const nextY = clampNumber(Number(event.target.value), 0, maxBoxY);
                      updateBox({ y: nextY, height: clampNumber(data.box.height, 3, 24 - nextY) });
                    }}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Width</label>
                  <input type="number" min={4} max={maxBoxWidth} className={compactInputClassName} value={data.box.width} onChange={event => updateBox({ width: clampNumber(Number(event.target.value), 4, maxBoxWidth) })} />
                </div>
                <div>
                  <label className={labelClassName}>Height</label>
                  <input type="number" min={3} max={maxBoxHeight} className={compactInputClassName} value={data.box.height} onChange={event => updateBox({ height: clampNumber(Number(event.target.value), 3, maxBoxHeight) })} />
                </div>
              </div>
              <div className="relative aspect-[4/3] border border-msx-border bg-msx-bgcolor-dark overflow-hidden">
                <div
                  className="absolute border border-msx-accent bg-msx-bgcolor/95 p-1 text-[10px] leading-tight text-msx-textprimary font-mono overflow-hidden"
                  style={{
                    left: `${(data.box.x / 32) * 100}%`,
                    top: `${(data.box.y / 24) * 100}%`,
                    width: `${(data.box.width / 32) * 100}%`,
                    height: `${(data.box.height / 24) * 100}%`,
                  }}
                >
                  <div className={`flex h-full gap-1 ${graphic.side === 'right' ? 'flex-row-reverse' : ''}`}>
                    {graphic.enabled && (
                      <div
                        className="grid shrink-0 gap-px"
                        style={{
                          width: `${Math.max(1, graphic.width) * 12}px`,
                          gridTemplateColumns: `repeat(${Math.max(1, graphic.width)}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: Math.max(1, graphic.width) * Math.max(1, graphic.height) }).map((_, index) => {
                          const tileId = graphic.tileIds?.[index];
                          const tileName = tileAssets.find(asset => asset.id === tileId)?.name || '';
                          return (
                            <div
                              key={index}
                              className="aspect-square bg-msx-accent/30 border border-msx-accent/40 text-[7px] text-msx-textsecondary overflow-hidden"
                              title={tileName || 'Empty graphic tile'}
                            >
                              {tileName.slice(0, 1)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {previewText || '...'}
                    </div>
                  </div>
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
                    onClick={createAndAssignFont}
                  >
                    Create and Use Font
                  </Button>
                )}
              </div>
            </section>

            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-msx-highlight">Tile Graphic</h3>
                <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
                  <input
                    type="checkbox"
                    checked={graphic.enabled}
                    onChange={event => updateGraphic({ enabled: event.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              <div>
                <label className={labelClassName}>Portrait Asset</label>
                <select
                  className={inputClassName}
                  value={graphic.portraitAssetId || ''}
                  onChange={event => {
                    const portraitAssetId = event.target.value;
                    updateGraphic(portraitAssetId
                      ? applyPortraitToGraphic(graphic, portraitAssetId)
                      : { portraitAssetId: undefined });
                  }}
                >
                  <option value="">Manual tile grid</option>
                  {portraitAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                {portraitAssets.length === 0 && onCreateAsset && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={createAndAssignPortrait}
                  >
                    Create and Use Portrait
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClassName}>Side</label>
                  <select
                    className={compactInputClassName}
                    value={graphic.side}
                    onChange={event => updateGraphic({ side: event.target.value as NonNullable<DialogueAsset['box']['graphic']>['side'] })}
                  >
                    <option value="left">Left of text</option>
                    <option value="right">Right of text</option>
                  </select>
                </div>
                <div>
                  <label className={labelClassName}>Padding Columns</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    className={compactInputClassName}
                    value={graphic.padding}
                    onChange={event => updateGraphic({ padding: clampNumber(Number(event.target.value), 0, 4) })}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Width Tiles</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    className={compactInputClassName}
                    value={graphic.width}
                    disabled={Boolean(graphic.portraitAssetId)}
                    onChange={event => updateGraphicSize(Number(event.target.value), graphic.height)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Height Tiles</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className={compactInputClassName}
                    value={graphic.height}
                    disabled={Boolean(graphic.portraitAssetId)}
                    onChange={event => updateGraphicSize(graphic.width, Number(event.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>TileBank</label>
                <select
                  className={inputClassName}
                  value={graphic.tileBankAssetId || ''}
                  onChange={event => updateGraphic({ tileBankAssetId: event.target.value || undefined })}
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
                    onClick={createAndAssignGraphicTileBank}
                  >
                    Create and Use TileBank
                  </Button>
                )}
              </div>

              {graphic.enabled && graphic.portraitAssetId ? (
                <p className="text-xs text-msx-textsecondary">
                  Using portrait "{selectedGraphicPortrait?.name || 'missing'}" ({graphic.width} x {graphic.height} chars).
                </p>
              ) : graphic.enabled && (
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${Math.max(1, graphic.width)}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: Math.max(1, graphic.width) * Math.max(1, graphic.height) }).map((_, index) => (
                    <select
                      key={index}
                      className={compactInputClassName}
                      value={graphic.tileIds?.[index] || ''}
                      onChange={event => updateGraphicTile(index, event.target.value)}
                      title={`Graphic tile ${index + 1}`}
                    >
                      <option value="">Empty</option>
                      {graphicSelectableTiles.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
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
                        onClick={createAndAssignTileBank}
                      >
                        Create and Use TileBank
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
                  <label className={labelClassName}>Mouth Toggle Chars</label>
                  <input type="number" min={0} max={32} className={compactInputClassName} value={data.exportOptions.mouthToggleEveryChars ?? 3} onChange={event => updateExportOptions({ mouthToggleEveryChars: clampNumber(Number(event.target.value), 0, 32) })} />
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
              {dialogueValidationIssues.length > 0 && (
                <div className="border border-yellow-500/50 bg-yellow-950/40 text-yellow-100 text-xs rounded p-2">
                  <ul className="list-disc list-inside space-y-0.5">
                    {dialogueValidationIssues.map(issue => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </Panel>
  );
};
