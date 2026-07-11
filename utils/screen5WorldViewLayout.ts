import type { WorldMapGraph } from '../types';

export interface Screen5MatrixLayoutScreen<TScreen> {
  key: string;
  screenMap: TScreen;
  left: number;
  top: number;
  width: number;
  height: number;
  title: string;
}

export interface Screen5MatrixLayoutResult<TScreen> {
  nodes: Screen5MatrixLayoutScreen<TScreen>[];
  worldBounds: { minX: number; minY: number; width: number; height: number };
}

interface Screen5MatrixLayoutOptions<TScreen> {
  graph: WorldMapGraph;
  screens: TScreen[];
  getScreenId: (screen: TScreen) => string | undefined;
  getScreenName: (screen: TScreen) => string | undefined;
  getScreenSize: (screen: TScreen) => { width: number; height: number };
}

const emptyBounds = { minX: 0, minY: 0, width: 0, height: 0 };

/**
 * Experimental SCREEN 5 WorldView layout.
 *
 * The SCREEN 5 minimap authors rooms as an orthogonal matrix: each WorldMap node
 * position is a cell coordinate scaled by the minimap step. This layout uses
 * those authored positions directly instead of walking connection rails, so
 * loops and diagonal rooms survive even when connections are incomplete.
 */
export function buildScreen5MatrixWorldViewLayout<TScreen>(
  options: Screen5MatrixLayoutOptions<TScreen>,
): Screen5MatrixLayoutResult<TScreen> {
  const { graph, screens, getScreenId, getScreenName, getScreenSize } = options;
  if (!graph.nodes.length) return { nodes: [], worldBounds: emptyBounds };

  const screenById = new Map<string, TScreen>();
  screens.forEach(screen => {
    const id = getScreenId(screen);
    if (id) screenById.set(id, screen);
  });

  const step = Math.max(1, (graph.gridSize || 20) * 12);
  const placed = graph.nodes
    .map(node => {
      const screen = screenById.get(node.screenAssetId);
      if (!screen) return null;
      const size = getScreenSize(screen);
      return {
        node,
        screen,
        col: Math.round(node.position.x / step),
        row: Math.round(node.position.y / step),
        width: size.width,
        height: size.height,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  if (!placed.length) return { nodes: [], worldBounds: emptyBounds };

  const minCol = Math.min(...placed.map(item => item.col));
  const minRow = Math.min(...placed.map(item => item.row));
  const maxScreenWidth = Math.max(...placed.map(item => item.width));
  const maxScreenHeight = Math.max(...placed.map(item => item.height));
  const cellWidth = Math.max(1, maxScreenWidth);
  const cellHeight = Math.max(1, maxScreenHeight);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodes = placed.map(item => {
    const left = (item.col - minCol) * cellWidth;
    const top = (item.row - minRow) * cellHeight;
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + item.width);
    maxY = Math.max(maxY, top + item.height);
    const name = getScreenName(item.screen) || item.node.name || item.node.screenAssetId;
    return {
      key: item.node.id,
      screenMap: item.screen,
      left,
      top,
      width: item.width,
      height: item.height,
      title: `SCREEN 5 matrix: ${name} cell (${item.col}, ${item.row})`,
    };
  });

  const padding = 50;
  return {
    nodes,
    worldBounds: {
      minX: minX - padding,
      minY: minY - padding,
      width: (maxX - minX) + 2 * padding,
      height: (maxY - minY) + 2 * padding,
    },
  };
}
