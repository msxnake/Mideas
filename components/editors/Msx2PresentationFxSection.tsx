import React, { useMemo } from 'react';
import type {
  Msx2GameFlowConnection,
  Msx2GameFlowNode,
  Msx2GameFlowScreen5PresentationNode,
  ProjectAsset,
} from '../../types';
import { presentationFxNodeIssues, transitionAssetsForPresentation } from '../../utils/msx2TransitionEditorUtils';

/**
 * "Entry effect" section of a Screen5Presentation node in the SCREEN 5 GameFlow editor: picks the
 * `msx2transition` asset (`fxAssetId`) that animates the picture when the game boots, and shows its
 * summary and every validation message (missing asset, effect made on another picture, a palette
 * fade-in before the node, compile errors, backend that cannot play it).
 */

interface Props {
  node: Msx2GameFlowScreen5PresentationNode;
  nodes: Msx2GameFlowNode[];
  connections: Msx2GameFlowConnection[];
  allAssets: ProjectAsset[];
  /** True when the flow compiles through the SCREEN 5 bitmap-room backend (the only one that plays the effect). */
  bitmapBackend: boolean;
  onChange: (fxAssetId: string | undefined) => void;
}

export const Msx2PresentationFxSection: React.FC<Props> = ({ node, nodes, connections, allAssets, bitmapBackend, onChange }) => {
  const options = useMemo(
    () => transitionAssetsForPresentation(allAssets, node.presentationAssetId, node.fxAssetId),
    [allAssets, node.presentationAssetId, node.fxAssetId],
  );
  const anyTransition = useMemo(() => allAssets.some(a => a.type === 'msx2transition'), [allAssets]);
  const issues = useMemo(
    () => presentationFxNodeIssues(node, nodes, connections, allAssets, bitmapBackend, true),
    [node, nodes, connections, allAssets, bitmapBackend],
  );
  const known = node.fxAssetId ? options.some(o => o.asset.id === node.fxAssetId) : true;
  const summary = issues.summary;

  return (
    <div className="space-y-1.5 border-t border-msx-border pt-2">
      <h3 className="text-sm font-semibold">Efecto de entrada</h3>
      <label className="block text-xs">
        Transición (asset MSX2 Entry Transition)
        <select
          value={node.fxAssetId || ''}
          onChange={event => onChange(event.target.value || undefined)}
          className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
        >
          <option value="">(sin efecto: la imagen aparece de golpe)</option>
          {!known && node.fxAssetId && <option value={node.fxAssetId}>{node.fxAssetId} (no existe)</option>}
          {options.map(({ asset, matches }) => (
            <option key={asset.id} value={asset.id}>{asset.name}{matches ? '' : ' (otra imagen)'}</option>
          ))}
        </select>
      </label>
      {!anyTransition && (
        <p className="text-[10px] text-msx-textsecondary">
          No hay efectos todavía: crea uno con New Asset &gt; MSX2 Entry Transition, elige esta imagen y diseña las capas.
        </p>
      )}
      {anyTransition && options.length === 0 && (
        <p className="text-[10px] text-msx-textsecondary">Ningún efecto está hecho sobre la imagen de este nodo.</p>
      )}
      {summary && (
        <p className="text-[10px] text-msx-textsecondary">
          «{summary.assetName}»: {summary.layers} capa(s), {summary.steps} paso(s),{' '}
          {summary.totalTicks !== undefined
            ? `${(summary.totalTicks / 60).toFixed(2)} s reales de animación (${summary.totalTicks} ticks a 60 Hz; ${(summary.durationFrames / 60).toFixed(2)} s de diseño)`
            : `${(summary.durationFrames / 60).toFixed(2)} s de animación`}
          {summary.blockBytes !== undefined ? ` · bloque de ${summary.blockBytes} bytes en la ROM` : ''}.
        </p>
      )}
      {issues.errors.length > 0 && (
        <ul className="text-[10px] text-red-300 list-disc pl-4">
          {issues.errors.slice(0, 6).map((message, index) => <li key={index}>{message}</li>)}
          {issues.errors.length > 6 && <li>...y {issues.errors.length - 6} más (míralos en el editor de la transición).</li>}
        </ul>
      )}
      {issues.warnings.length > 0 && (
        <ul className="text-[10px] text-amber-300 list-disc pl-4">
          {issues.warnings.slice(0, 6).map((message, index) => <li key={index}>{message}</li>)}
          {issues.warnings.length > 6 && <li>...y {issues.warnings.length - 6} más.</li>}
        </ul>
      )}
      <p className="text-[10px] text-msx-textsecondary">
        El efecto solo se ejecuta en el arranque del juego y solo con el backend bitmap-room. El walker de GameFlow (menús, textos, transiciones) y el backend estricto exportan la imagen estática.
      </p>
    </div>
  );
};
