import React, { useMemo } from 'react';
import { PortraitAsset, ProjectAsset, Tile, TileBank } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';

interface PortraitEditorProps {
  portrait: PortraitAsset;
  onUpdate: (data: PortraitAsset) => void;
  allAssets: ProjectAsset[];
  tileBanks: TileBank[];
  onCreateAsset?: (type: ProjectAsset['type'], options?: { select?: boolean }) => ProjectAsset | void;
}

const inputClassName = 'w-full p-2 text-sm text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const compactInputClassName = 'w-full p-1.5 text-xs text-msx-textprimary bg-msx-bgcolor-dark border border-msx-border rounded focus:ring-msx-accent focus:border-msx-accent';
const labelClassName = 'block text-xs text-msx-textsecondary mb-1';

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function ensurePortrait(portrait: PortraitAsset): PortraitAsset {
  const widthChars = clampNumber(portrait.widthChars || 4, 1, 8);
  const heightChars = clampNumber(portrait.heightChars || 4, 1, 8);
  const count = widthChars * heightChars;
  const cells = Array.isArray(portrait.cells)
    ? Array.from({ length: count }, (_, index) => portrait.cells[index] || '')
    : Array(count).fill('');

  return {
    ...portrait,
    widthChars,
    heightChars,
    cells,
    dedupeIdenticalTiles: portrait.dedupeIdenticalTiles !== false,
  };
}

const TilePreview: React.FC<{ tile?: Tile }> = ({ tile }) => {
  if (!tile?.data?.length) {
    return <div className="w-full aspect-square bg-msx-bgcolor-dark border border-msx-border" />;
  }

  const rows = tile.data.slice(0, 8);
  return (
    <div
      className="grid w-full aspect-square border border-msx-border bg-msx-bgcolor-dark overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, tile.width || 8)}, minmax(0, 1fr))` }}
    >
      {rows.flatMap((row, y) =>
        Array.from({ length: Math.max(1, tile.width || 8) }, (_, x) => (
          <div
            key={`${x}_${y}`}
            style={{ backgroundColor: row[x] || 'transparent' }}
          />
        ))
      )}
    </div>
  );
};

export const PortraitEditor: React.FC<PortraitEditorProps> = ({
  portrait,
  onUpdate,
  allAssets,
  tileBanks,
  onCreateAsset,
}) => {
  const data = ensurePortrait(portrait);

  const tileAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'tile' && asset.data) as Array<ProjectAsset & { data: Tile }>,
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

  const selectedBank = availableTileBanks.find(bank => bank.id === data.tileBankAssetId);
  const bankTileIds = selectedBank
    ? Array.from(new Set(selectedBank.banks.flatMap(bank => Object.keys(bank.assignedTiles || {}))))
    : [];
  const selectableTiles = tileAssets.filter(asset => bankTileIds.length === 0 || bankTileIds.includes(asset.id));
  const tileById = new Map(tileAssets.map(asset => [asset.id, asset.data]));
  const usedTileIds = Array.from(new Set(data.cells.filter(Boolean)));

  const update = (patch: Partial<PortraitAsset>) => {
    onUpdate({ ...data, ...patch });
  };

  const resize = (widthChars: number, heightChars: number) => {
    const nextWidth = clampNumber(widthChars, 1, 8);
    const nextHeight = clampNumber(heightChars, 1, 8);
    update({
      widthChars: nextWidth,
      heightChars: nextHeight,
      cells: Array.from({ length: nextWidth * nextHeight }, (_, index) => data.cells[index] || ''),
    });
  };

  const updateCell = (index: number, tileId: string) => {
    const cells = [...data.cells];
    cells[index] = tileId;
    update({ cells });
  };

  const createAndAssignTileBank = () => {
    const created = onCreateAsset?.('tilebank', { select: false });
    if (created?.id) {
      update({ tileBankAssetId: created.id });
    }
  };

  return (
    <Panel title={`Portrait Editor: ${data.name || 'Portrait'}`} className="flex-grow flex flex-col min-h-0">
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          <div className="space-y-3">
            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold text-msx-highlight">Portrait Setup</h3>
              <div>
                <label className={labelClassName}>Name</label>
                <input
                  className={inputClassName}
                  value={data.name || ''}
                  onChange={event => update({ name: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClassName}>Width Chars</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    className={compactInputClassName}
                    value={data.widthChars}
                    onChange={event => resize(Number(event.target.value), data.heightChars)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Height Chars</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    className={compactInputClassName}
                    value={data.heightChars}
                    onChange={event => resize(data.widthChars, Number(event.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={labelClassName}>TileBank</label>
                <select
                  className={inputClassName}
                  value={data.tileBankAssetId || ''}
                  onChange={event => update({ tileBankAssetId: event.target.value || undefined })}
                >
                  <option value="">No TileBank filter</option>
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
                    Create default TileBank
                  </Button>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
                <input
                  type="checkbox"
                  checked={data.dedupeIdenticalTiles}
                  onChange={event => update({ dedupeIdenticalTiles: event.target.checked })}
                />
                Reuse repeated chars when exported
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => update({ cells: Array(data.widthChars * data.heightChars).fill('') })}
                >
                  Clear
                </Button>
              </div>
              <p className="text-xs text-msx-textsecondary">
                Uses {usedTileIds.length} unique tile{usedTileIds.length === 1 ? '' : 's'} across {data.cells.length} cells.
              </p>
            </section>

            <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold text-msx-highlight">Preview</h3>
              <div
                className="grid gap-px bg-msx-border p-1"
                style={{ gridTemplateColumns: `repeat(${data.widthChars}, minmax(0, 1fr))` }}
              >
                {data.cells.map((tileId, index) => (
                  <TilePreview key={index} tile={tileById.get(tileId)} />
                ))}
              </div>
            </section>
          </div>

          <section className="border border-msx-border bg-msx-bgcolor rounded p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-msx-highlight">Tile Cells</h3>
              <span className="text-xs text-msx-textsecondary">{data.widthChars} x {data.heightChars}</span>
            </div>
            {selectableTiles.length === 0 ? (
              <p className="text-sm text-msx-textsecondary">
                No tiles are available for this portrait. Create tiles first or remove the TileBank filter.
              </p>
            ) : (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${data.widthChars}, minmax(0, 1fr))` }}
              >
                {data.cells.map((tileId, index) => (
                  <div key={index} className="space-y-1">
                    <TilePreview tile={tileById.get(tileId)} />
                    <select
                      className={compactInputClassName}
                      value={tileId}
                      onChange={event => updateCell(index, event.target.value)}
                      title={`Portrait cell ${index + 1}`}
                    >
                      <option value="">Empty</option>
                      {selectableTiles.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </Panel>
  );
};
