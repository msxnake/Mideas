import { WorldMapGraph, ConnectionDirection } from '../types';

/**
 * Rebuilds a SCREEN 5 (bitmap-room) world map asset so the WorldView renders correctly again
 * after rooms have been deleted or edited.
 *
 * The authored CONNECTIONS are the source of truth for topology: the SCREEN 5 minimap creates
 * each rail with an explicit `fromDirection`/`toDirection`, so the surviving connections among
 * surviving rooms describe exactly how the world is laid out. Recompose therefore:
 *   1. drops nodes whose room asset no longer exists (orphans),
 *   2. drops connections that reference a dropped node (dangling rails),
 *   3. recomputes clean, non-overlapping grid positions by walking the surviving rails from the
 *      start node (disconnected clusters are stacked underneath), and
 *   4. repairs `startScreenNodeId` when it pointed at a deleted room.
 *
 * It does NOT infer connections from node coordinates — coordinates can drift (manual drags,
 * mixed gridSizes) and inferring from them is what misplaced screens. The rails are exact.
 */
const OPPOSITE_DIRECTION: Record<ConnectionDirection, ConnectionDirection> = {
  north: 'south', south: 'north', east: 'west', west: 'east',
};

const DIRECTION_OFFSET: Record<ConnectionDirection, { x: number; y: number }> = {
  north: { x: 0, y: -1 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 }, east: { x: 1, y: 0 },
};

export const recomposeScreen5WorldMap = (
  graph: WorldMapGraph,
  existingRoomIds: Set<string>,
): WorldMapGraph => {
  const validNodes = graph.nodes.filter(node => existingRoomIds.has(node.screenAssetId));
  if (validNodes.length === 0) {
    return { ...graph, nodes: [], connections: [], startScreenNodeId: null };
  }

  const validIds = new Set(validNodes.map(node => node.id));

  // Keep only rails whose BOTH endpoints survive; carry over their metadata untouched.
  const validConnections = graph.connections
    .filter(conn => validIds.has(conn.fromNodeId) && validIds.has(conn.toNodeId))
    .map(conn => ({ ...conn }));

  // Repair the start node if it pointed at a deleted room.
  const startScreenNodeId = graph.startScreenNodeId && validIds.has(graph.startScreenNodeId)
    ? graph.startScreenNodeId
    : validNodes[0].id;

  // Undirected adjacency derived from the rails (both orientations).
  const adjacency = new Map<string, { dir: ConnectionDirection; to: string }[]>();
  validNodes.forEach(node => adjacency.set(node.id, []));
  validConnections.forEach(conn => {
    adjacency.get(conn.fromNodeId)!.push({ dir: conn.fromDirection, to: conn.toNodeId });
    adjacency.get(conn.toNodeId)!.push({ dir: OPPOSITE_DIRECTION[conn.fromDirection], to: conn.fromNodeId });
  });

  const step = Math.max(1, (graph.gridSize || 20) * 12);
  const cell = new Map<string, { col: number; row: number }>();

  // BFS placement from a seed: each neighbour is offset one grid cell in its rail direction.
  // First placement wins a contested cell (consistent grids never contest).
  const placeFrom = (seedId: string, base: { col: number; row: number }) => {
    if (cell.has(seedId)) return;
    cell.set(seedId, base);
    const queue = [seedId];
    while (queue.length) {
      const current = queue.shift()!;
      const here = cell.get(current)!;
      for (const edge of adjacency.get(current) || []) {
        if (cell.has(edge.to)) continue;
        const off = DIRECTION_OFFSET[edge.dir];
        cell.set(edge.to, { col: here.col + off.x, row: here.row + off.y });
        queue.push(edge.to);
      }
    }
  };

  // Place the start's cluster first, then stack any disconnected clusters underneath it.
  placeFrom(startScreenNodeId, { col: 0, row: 0 });
  for (const node of validNodes) {
    if (cell.has(node.id)) continue;
    let maxRow = 0;
    cell.forEach(c => { maxRow = Math.max(maxRow, c.row); });
    placeFrom(node.id, { col: 0, row: maxRow + 2 });
  }

  // Normalise to non-negative coordinates and convert cells to pixel positions.
  let minCol = Infinity, minRow = Infinity;
  cell.forEach(c => { minCol = Math.min(minCol, c.col); minRow = Math.min(minRow, c.row); });

  return {
    ...graph,
    nodes: validNodes.map(node => {
      const c = cell.get(node.id);
      return {
        ...node,
        position: c
          ? { x: (c.col - minCol) * step, y: (c.row - minRow) * step }
          : { ...node.position },
      };
    }),
    connections: validConnections,
    startScreenNodeId,
  };
};
