import React from 'react';
import type { ProjectAsset } from '../../../types';
import type { SkillParameterDef } from '../../../utils/msxGenerator/skills/types';

const inputClass = 'w-full rounded border border-slate-600 bg-[#111821] px-2 py-1 text-xs text-slate-200 focus:border-sky-600 focus:outline-none';
const selectClass = inputClass;

/**
 * Dedicated parameters dialog for the destroy_tile (dig) skill.
 *
 * Renders the declarative numeric/boolean parameters (digKey, hitsPerTile, …)
 * exactly like the generic SkillParametersDialog, then adds two sprite-asset
 * selectors that the generic dialog cannot express:
 *
 *   1. Debris sprite   -> written to player.render.debrisSpriteAssetId
 *                         (consumed by resolveBitmapDebrisSprite).
 *   2. Digging sprite  -> written to player.render.stateSprites['digging']
 *                         (consumed by resolveBitmapRoomStateAnimations, which
 *                         maps the 'digging' animation state to its own frame
 *                         bank and asserts it while the pick is swinging).
 *
 * Both are optional: leaving them blank keeps the existing fallbacks (a sprite
 * named /debris|viruta/i or the built-in chip; the Player Animations table row
 * for the digging state).
 */
interface DestroyTileDialogProps {
  parameters: SkillParameterDef[];
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  spriteAssets: ProjectAsset[];
  debrisSpriteAssetId: string | undefined;
  diggingSpriteAssetId: string | undefined;
  onDebrisChange: (spriteAssetId: string | undefined) => void;
  onDiggingChange: (spriteAssetId: string | undefined) => void;
  onClose: () => void;
}

export const DestroyTileDialog: React.FC<DestroyTileDialogProps> = ({
  parameters,
  values,
  onPatch,
  spriteAssets,
  debrisSpriteAssetId,
  diggingSpriteAssetId,
  onDebrisChange,
  onDiggingChange,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Destroy Tile parameters"
  >
    <div className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#151a23] shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛏️</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Destroy Tile (dig)</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-yellow-400">UTILITY</span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="text-[10px] text-slate-400">Pick at the wall ahead to dissolve destructible tiles</span>
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
        {/* Numeric / boolean skill parameters (single source of truth: destroy_tile.json). */}
        <div className="grid grid-cols-2 gap-3">
          {parameters.map((param: SkillParameterDef) => {
            const raw = values[param.key];
            const fallback = param.default;
            if (param.type === 'boolean') {
              const checked = raw === undefined ? Boolean(fallback) : Boolean(raw);
              return (
                <label
                  key={param.key}
                  className="col-span-2 flex items-start gap-3 rounded border border-slate-700 bg-[#111821] px-3 py-2.5 text-xs text-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={event => onPatch(param.key, event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-500"
                  />
                  <span className="space-y-0.5">
                    <span className="block font-medium">{param.label}</span>
                    {param.help && <span className="block text-[10px] leading-relaxed text-slate-400">{param.help}</span>}
                  </span>
                </label>
              );
            }
            const numValue = Number(raw);
            const safeValue = Number.isFinite(numValue) ? numValue : Number(fallback) || 0;
            return (
              <div key={param.key} className="space-y-1.5 text-xs text-slate-200">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">{param.label}</span>
                  <span className="min-w-[40px] rounded bg-slate-800 px-1.5 py-0.5 text-center text-[10px] text-sky-400">
                    {safeValue}
                  </span>
                </label>
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  step={param.step ?? 1}
                  className={inputClass}
                  value={safeValue}
                  onChange={event => {
                    let next = Number(event.target.value);
                    if (!Number.isFinite(next)) next = Number(fallback) || 0;
                    if (typeof param.min === 'number') next = Math.max(param.min, next);
                    if (typeof param.max === 'number') next = Math.min(param.max, next);
                    onPatch(param.key, next);
                  }}
                />
                {param.help && <p className="text-[10px] leading-relaxed text-slate-400">{param.help}</p>}
              </div>
            );
          })}
        </div>

        {/* Graphics: sprite-asset selectors that the generic dialog cannot render. */}
        <div className="space-y-3 rounded border border-slate-700 bg-[#111821] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">Graphics</p>
          <div className="space-y-1.5 text-xs text-slate-200">
            <label className="block text-slate-300">Debris sprite (virutas)</label>
            <select
              className={selectClass}
              value={debrisSpriteAssetId || ''}
              onChange={event => onDebrisChange(event.target.value || undefined)}
            >
              <option value="">(fallback: /debris|viruta/ sprite or built-in chip)</option>
              {spriteAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Hardware sprite spawned as chips when a tile is hit. Its first frame is used.
            </p>
          </div>
          <div className="space-y-1.5 text-xs text-slate-200">
            <label className="block text-slate-300">Digging animation sprite</label>
            <select
              className={selectClass}
              value={diggingSpriteAssetId || ''}
              onChange={event => onDiggingChange(event.target.value || undefined)}
            >
              <option value="">(fallback: Player Animations row for 'digging')</option>
              {spriteAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Sprite played while the pick is swinging. Overrides the Player Animations table
              for the 'digging' state. Rendered on the same cell grid as the base sprite.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-700 px-4 py-2">
        <p className="text-[10px] text-slate-500">Changes apply immediately · Skill ID: destroy_tile</p>
      </div>
    </div>
  </div>
);

export default DestroyTileDialog;
