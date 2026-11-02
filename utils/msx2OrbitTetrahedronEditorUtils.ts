import type {
  Msx2GameFlowScreen5PresentationNode,
  Msx2OrbitTetrahedronConfig,
  Msx2Screen5PresentationConfig,
  Msx2Sprite,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../types';
import {
  buildBitmapIntroTetrahedron,
  describeOrbitSprite,
  type BitmapIntroTetrahedron,
} from './msxGenerator/generators/msx2/msx2BitmapIntroTetrahedron';
import { compileBitmapFxForPresentation } from './msxGenerator/generators/msx2/msx2BitmapTransitionFxGenerator';
import { buildScreen5BitmapBytes, buildScreen5PaletteBytes } from './msxGenerator/generators/msx2/screen5PresentationData';

/**
 * Editor side of the orbiting tetrahedron (Screen5Presentation node, SCREEN 5 bitmap-room backend). The numbers it
 * shows are the ones the export produces: the picture and palette that are on screen when the animation runs are built
 * exactly as the generator builds them (the presentation asset, or the picture derived by the entry effect), and the
 * figure is made by the same `buildBitmapIntroTetrahedron`.
 */

export interface OrbitSpriteCandidate {
  asset: ProjectAsset;
  ok: boolean;
  /** Why the sprite cannot be a dot. */
  reason?: string;
  /** Pixels across the drawn ball. */
  diameter?: number;
}

/** Every `msx2sprite` asset of the project, with whether it can be one of the dots (16x16, palette slots 1, 2, 3). */
export function orbitSpriteCandidates(assets: ProjectAsset[]): OrbitSpriteCandidate[] {
  return assets
    .filter(asset => asset.type === 'msx2sprite' && asset.data)
    .map(asset => ({ asset, ...describeOrbitSprite(asset.data as unknown as Msx2Sprite) }));
}

/** A config that uses every sprite that can be a dot, so enabling the figure shows something at once. */
export function defaultOrbitTetrahedronConfig(assets: ProjectAsset[]): Msx2OrbitTetrahedronConfig {
  return {
    enabled: true,
    spriteAssetIds: orbitSpriteCandidates(assets)
      .filter(candidate => candidate.ok)
      .sort((a, b) => (b.diameter ?? 0) - (a.diameter ?? 0))
      .map(candidate => candidate.asset.id),
  };
}

export interface OrbitNodeBuild {
  errors: string[];
  warnings: string[];
  /** The figure; undefined when the node has none enabled or it cannot be built. */
  result?: BitmapIntroTetrahedron;
  /** The palette and picture on screen when the animation runs (after the entry effect, if any). */
  paletteBytes?: number[];
  bitmapBytes?: number[];
  /** Bytes of ROM the figure takes (tables, patterns and colours). */
  romBytes?: number;
}

/** The generator's message without the scene prefix and the repeated subject: the panel already says what it is about. */
const stripPrefix = (message: string) => {
  const text = message.replace(/^Error: /, '').replace(/^MSX2 bitmap-room intro scene "[^"]*": /, '').replace(/^the orbiting tetrahedron /, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Builds the figure of a Screen5Presentation node the way the export does and collects what is wrong with it.
 * Nothing is thrown: every problem comes back as a message.
 */
export function orbitTetrahedronForNode(
  node: Msx2GameFlowScreen5PresentationNode,
  assets: ProjectAsset[],
  bitmapBackend: boolean,
): OrbitNodeBuild {
  const out: OrbitNodeBuild = { errors: [], warnings: [] };
  const config = node.orbitTetrahedron;
  if (!config?.enabled) return out;

  if (!bitmapBackend) {
    out.warnings.push('Solo el backend bitmap-room ejecuta la figura: en el walker y en el backend estricto la presentación se exporta como imagen estática.');
  }
  const presentationAsset = node.presentationAssetId
    ? assets.find(asset => asset.id === node.presentationAssetId && asset.type === 'msx2presentation')
    : undefined;
  if (!presentationAsset) {
    out.errors.push(node.presentationAssetId ? 'La presentación del nodo no existe.' : 'El nodo no tiene presentación: elige una imagen antes de activar la figura.');
    return out;
  }
  // Same shape as analyzeProject() gives the generator.
  const presentation = {
    ...(presentationAsset.data as unknown as Msx2Screen5PresentationConfig),
    id: (presentationAsset.data as any)?.id || presentationAsset.id,
    name: (presentationAsset.data as any)?.name || presentationAsset.name,
  } as Msx2Screen5PresentationConfig & { id?: string; name?: string; palette?: Screen5PaletteSlot[] };
  let paletteBytes = buildScreen5PaletteBytes(presentation.palette || ((presentation as any).data?.palette as Screen5PaletteSlot[] | undefined));
  let bitmapBytes = buildScreen5BitmapBytes(presentation);

  if (node.fxAssetId) {
    // The effect leaves its own derived picture and palette on screen, and the dots are made against those.
    try {
      const compiled = compileBitmapFxForPresentation({
        analysis: { assets } as any,
        nodeId: node.id,
        fxAssetId: node.fxAssetId,
        presentation,
      });
      paletteBytes = compiled.paletteBytes;
      bitmapBytes = compiled.bitmapBytes;
    } catch (error) {
      out.errors.push(`El efecto de entrada no se puede compilar, así que la figura no se puede comprobar: ${stripPrefix((error as Error).message).split('\n')[0]}`);
      return out;
    }
  }

  const analysis = { msx2Sprites: assets.filter(asset => asset.type === 'msx2sprite' && asset.data).map(asset => asset.data as unknown as Msx2Sprite) } as any;
  try {
    const result = buildBitmapIntroTetrahedron(String(presentation.name || node.id), config, analysis, { paletteBytes, bitmapBytes });
    out.result = result;
    out.paletteBytes = paletteBytes;
    out.bitmapBytes = bitmapBytes;
    out.romBytes = result.frameBlocks.reduce((sum, block) => sum + block.length, 0) + result.patternBytes.length + result.colorBytes.length;
  } catch (error) {
    out.errors.push(stripPrefix((error as Error).message));
  }
  return out;
}

/** What the generator and the flow check need from a node: only the blocking messages. */
export function orbitTetrahedronNodeErrors(node: Msx2GameFlowScreen5PresentationNode, assets: ProjectAsset[]): string[] {
  return orbitTetrahedronForNode(node, assets, true).errors;
}

/** Palette entry of a 16 x 2 byte VDP palette as a CSS colour. */
export function paletteEntryCss(paletteBytes: number[], slot: number): string {
  const first = paletteBytes[slot * 2] || 0;
  const second = paletteBytes[slot * 2 + 1] || 0;
  const level = (value: number) => Math.round(((value & 7) * 255) / 7);
  return `rgb(${level(first >> 4)}, ${level(second)}, ${level(first)})`;
}
