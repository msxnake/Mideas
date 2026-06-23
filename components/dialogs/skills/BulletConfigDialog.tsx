import React, { useMemo, useState } from 'react';
import { Msx2PlayerWeaponDefinition, ProjectAsset } from '../../../types';

type WeaponPatch = Partial<Msx2PlayerWeaponDefinition>;

interface BulletConfigDialogProps {
  weapon: Msx2PlayerWeaponDefinition;
  spriteAssets: ProjectAsset[];
  onPatch: (patch: WeaponPatch) => void;
  onClose: () => void;
}

/**
 * Popup dialog for configuring the bullet visual of a player weapon.
 * Lets the user choose between two modes via a segmented switch:
 *   - 'sprite': hardware-sprite asset (dropdown of msx2sprite assets)
 *   - 'char':   single 8x8 name-table char (numeric code 0-255)
 *
 * Visual config is declarative. The existing ASM runtime consumes
 * `weapon.projectileAssetId` (sprite mode); char-mode ASM is pending.
 * On save, the dialog mirrors `bulletVisual.spriteAssetId` into
 * `projectileAssetId` so the current ASM keeps working.
 */
export const BulletConfigDialog: React.FC<BulletConfigDialogProps> = ({ weapon, spriteAssets, onPatch, onClose }) => {
  // Resolve initial state: prefer bulletVisual, fall back to legacy projectileAssetId.
  const legacySpriteId = weapon.projectileAssetId;
  const initialKind: 'sprite' | 'char' = weapon.bulletVisual?.kind ?? (legacySpriteId ? 'sprite' : 'sprite');
  const initialSpriteId = weapon.bulletVisual?.spriteAssetId ?? legacySpriteId ?? '';
  const initialCharCode = weapon.bulletVisual?.charCode ?? 0;

  const [kind, setKind] = useState<'sprite' | 'char'>(initialKind);
  const [spriteAssetId, setSpriteAssetId] = useState<string>(initialSpriteId);
  const [charCode, setCharCode] = useState<number>(initialCharCode);

  const resolvedSprite = useMemo(
    () => spriteAssets.find(asset => asset.id === spriteAssetId),
    [spriteAssets, spriteAssetId],
  );

  const apply = () => {
    const patch: WeaponPatch = {
      bulletVisual: {
        kind,
        ...(kind === 'sprite' ? { spriteAssetId: spriteAssetId || undefined } : {}),
        ...(kind === 'char' ? { charCode: Math.max(0, Math.min(255, Math.trunc(charCode) || 0)) } : {}),
      },
    };
    // Mirror into projectileAssetId for backward-compat with current ASM consumer.
    if (kind === 'sprite') {
      patch.projectileAssetId = spriteAssetId || undefined;
    } else {
      // Char-mode: keep projectileAssetId untouched (do not clobber legacy config).
    }
    onPatch(patch);
    onClose();
  };

  const clearVisual = () => {
    onPatch({ bulletVisual: undefined, projectileAssetId: undefined });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Bullet visual configuration"
    >
      <div className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#151a23] shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Bullet Visual</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-sky-400">PROJECTILE</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-400">weapon: {weapon.name}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 space-y-4">
          {/* Mode switch (segmented control) */}
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-300">Mode</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded border px-3 py-2 text-xs ${kind === 'sprite' ? 'border-sky-500 bg-sky-900/40 text-sky-200' : 'border-slate-700 bg-[#111821] text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setKind('sprite')}
              >
                Sprite (hardware)
              </button>
              <button
                type="button"
                className={`rounded border px-3 py-2 text-xs ${kind === 'char' ? 'border-sky-500 bg-sky-900/40 text-sky-200' : 'border-slate-700 bg-[#111821] text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setKind('char')}
              >
                Char (8x8 tile)
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
              {kind === 'sprite'
                ? 'Bullet renders as a hardware sprite (V9938 SAT). Use for moving projectiles that need per-frame animation/mirror.'
                : 'Bullet renders as a single background name-table char (8x8 tile). Cheaper; typical of Galaga/1942-style shooters.'}
            </p>
          </div>

          {/* Sprite mode */}
          {kind === 'sprite' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Sprite asset</div>
              <select
                className="w-full rounded border border-slate-700 bg-[#111821] px-2 py-1.5 text-xs text-slate-100"
                value={spriteAssetId}
                onChange={event => setSpriteAssetId(event.target.value)}
              >
                <option value="">None (no visible bullet)</option>
                {spriteAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              {resolvedSprite && (
                <div className="rounded border border-slate-700 bg-[#111821] p-2 text-[10px] text-slate-400">
                  Linked: <span className="text-slate-200">{resolvedSprite.name}</span> (id: {resolvedSprite.id})
                </div>
              )}
              {spriteAssetId && !resolvedSprite && (
                <div className="rounded border border-amber-700 bg-amber-900/30 p-2 text-[10px] text-amber-300">
                  Sprite id "{spriteAssetId}" not found in project assets.
                </div>
              )}
            </div>
          )}

          {/* Char mode */}
          {kind === 'char' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Char code</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={255}
                  step={1}
                  className="w-24 rounded border border-slate-700 bg-[#111821] px-2 py-1.5 text-xs text-slate-100"
                  value={charCode}
                  onChange={event => setCharCode(Math.max(0, Math.min(255, Number(event.target.value) || 0)))}
                />
                <span className="text-[10px] text-slate-400">
                  = 0x{charCode.toString(16).toUpperCase().padStart(2, '0')} · tile index in the name table
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                The bullet will be drawn by repeating this char along its trajectory. Char 0 is usually the backdrop; pick the char index that contains your bullet glyph (e.g. in the tileset).
              </p>
            </div>
          )}

          {/* Live summary */}
          <div className="rounded border border-slate-700 bg-[#0e1218] p-2.5 text-[10px] text-slate-400">
            <div className="font-bold uppercase tracking-wide text-slate-300 mb-1">Current</div>
            {weapon.bulletVisual ? (
              <div>
                Mode: <span className="text-slate-200">{weapon.bulletVisual.kind}</span>
                {weapon.bulletVisual.kind === 'sprite' && (
                  <> · sprite: <span className="text-slate-200">{weapon.bulletVisual.spriteAssetId || '(none)'}</span></>
                )}
                {weapon.bulletVisual.kind === 'char' && (
                  <> · charCode: <span className="text-slate-200">{weapon.bulletVisual.charCode ?? 0}</span></>
                )}
              </div>
            ) : weapon.projectileAssetId ? (
              <div>Legacy: <span className="text-slate-200">projectileAssetId = {weapon.projectileAssetId}</span> (no bulletVisual set)</div>
            ) : (
              <div className="text-slate-500">No bullet visual configured.</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-700 px-4 py-2">
          <div className="text-[10px] text-slate-500">
            Declarative · ASM runtime consumes <code className="text-slate-400">projectileAssetId</code> today; char-mode runtime pending.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-red-800 bg-red-900/30 px-3 py-1.5 text-[11px] text-red-300 hover:bg-red-900/60"
              onClick={clearVisual}
              title="Remove bullet visual config"
            >
              Clear
            </button>
            <button
              type="button"
              className="rounded border border-sky-600 bg-sky-700 px-3 py-1.5 text-[11px] text-white hover:bg-sky-600"
              onClick={apply}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulletConfigDialog;
