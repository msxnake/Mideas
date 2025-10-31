/**
 * Screen Coordinates System
 *
 * Sistema para convertir entre coordenadas locales de screen y coordenadas globales del mundo.
 * Usado para plataformas multi-screen que atraviesan múltiples pantallas.
 */

import { WorldMapGraph, WorldMapConnection, ConnectionDirection } from '../types';

/** Dimensiones estándar de una screen MSX en píxeles */
export const SCREEN_WIDTH_PX = 256;
export const SCREEN_HEIGHT_PX = 192;

/** Representa una coordenada local dentro de una screen */
export interface LocalCoordinate {
  screenId: string;
  x: number;  // 0-255
  y: number;  // 0-191
}

/** Representa una coordenada global en el mundo */
export interface GlobalCoordinate {
  x: number;
  y: number;
}

/** Información de posicionamiento de una screen en el mundo */
export interface ScreenWorldPosition {
  screenId: string;
  globalX: number;
  globalY: number;
}

/**
 * Construye un mapa de posiciones globales de screens a partir del WorldMapGraph.
 * Usa BFS (Breadth-First Search) para calcular posiciones relativas desde el nodo inicial.
 */
export function buildScreenWorldMap(worldMap: WorldMapGraph): Map<string, ScreenWorldPosition> {
  const screenPositions = new Map<string, ScreenWorldPosition>();

  if (!worldMap.startScreenNodeId) {
    return screenPositions;
  }

  // BFS para calcular posiciones relativas
  const queue: Array<{ nodeId: string; globalX: number; globalY: number }> = [];
  const visited = new Set<string>();

  // Iniciar desde el nodo de inicio en posición (0, 0)
  queue.push({ nodeId: worldMap.startScreenNodeId, globalX: 0, globalY: 0 });
  visited.add(worldMap.startScreenNodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Encontrar el nodo actual
    const currentNode = worldMap.nodes.find(n => n.id === current.nodeId);
    if (!currentNode) continue;

    // Guardar posición del screen actual
    screenPositions.set(currentNode.screenAssetId, {
      screenId: currentNode.screenAssetId,
      globalX: current.globalX,
      globalY: current.globalY
    });

    // Explorar conexiones desde este nodo (bidireccionales)
    const outgoingConnections = worldMap.connections.filter(c => c.fromNodeId === current.nodeId);
    const incomingConnections = worldMap.connections.filter(c => c.toNodeId === current.nodeId);

    // Procesar conexiones salientes
    for (const conn of outgoingConnections) {
      if (visited.has(conn.toNodeId)) continue;

      visited.add(conn.toNodeId);

      // Calcular nueva posición global según la dirección de la conexión
      let newGlobalX = current.globalX;
      let newGlobalY = current.globalY;

      switch (conn.fromDirection) {
        case 'east':
          newGlobalX += SCREEN_WIDTH_PX;
          break;
        case 'west':
          newGlobalX -= SCREEN_WIDTH_PX;
          break;
        case 'south':
          newGlobalY += SCREEN_HEIGHT_PX;
          break;
        case 'north':
          newGlobalY -= SCREEN_HEIGHT_PX;
          break;
      }

      queue.push({ nodeId: conn.toNodeId, globalX: newGlobalX, globalY: newGlobalY });
    }

    // Procesar conexiones entrantes (invertir dirección)
    for (const conn of incomingConnections) {
      if (visited.has(conn.fromNodeId)) continue;

      visited.add(conn.fromNodeId);

      // Calcular nueva posición global invirtiendo la dirección
      let newGlobalX = current.globalX;
      let newGlobalY = current.globalY;

      // Invertir la dirección: si desde el otro nodo se va "east" para llegar aquí,
      // entonces desde aquí se va "west" para llegar allá
      switch (conn.fromDirection) {
        case 'east':
          newGlobalX -= SCREEN_WIDTH_PX; // Invertir: east -> west
          break;
        case 'west':
          newGlobalX += SCREEN_WIDTH_PX; // Invertir: west -> east
          break;
        case 'south':
          newGlobalY -= SCREEN_HEIGHT_PX; // Invertir: south -> north
          break;
        case 'north':
          newGlobalY += SCREEN_HEIGHT_PX; // Invertir: north -> south
          break;
      }

      queue.push({ nodeId: conn.fromNodeId, globalX: newGlobalX, globalY: newGlobalY });
    }
  }

  return screenPositions;
}

/**
 * Convierte coordenadas locales a coordenadas globales.
 */
export function localToGlobal(
  local: LocalCoordinate,
  screenWorldMap: Map<string, ScreenWorldPosition>
): GlobalCoordinate | null {
  const screenPos = screenWorldMap.get(local.screenId);
  if (!screenPos) return null;

  return {
    x: screenPos.globalX + local.x,
    y: screenPos.globalY + local.y
  };
}

/**
 * Convierte coordenadas globales a coordenadas locales.
 * Retorna null si no hay screen en esa posición global.
 */
export function globalToLocal(
  global: GlobalCoordinate,
  screenWorldMap: Map<string, ScreenWorldPosition>
): LocalCoordinate | null {
  // Buscar qué screen contiene estas coordenadas globales
  for (const [screenId, screenPos] of screenWorldMap.entries()) {
    const localX = global.x - screenPos.globalX;
    const localY = global.y - screenPos.globalY;

    // Verificar si las coordenadas están dentro de los límites del screen
    if (localX >= 0 && localX < SCREEN_WIDTH_PX &&
        localY >= 0 && localY < SCREEN_HEIGHT_PX) {
      return {
        screenId,
        x: localX,
        y: localY
      };
    }
  }

  return null;
}

/**
 * Calcula qué screens atraviesa una línea entre dos waypoints locales.
 * Retorna array de screenIds en orden.
 */
export function getScreensInPath(
  waypoint1: LocalCoordinate,
  waypoint2: LocalCoordinate,
  screenWorldMap: Map<string, ScreenWorldPosition>
): string[] {
  // Convertir a coordenadas globales
  const global1 = localToGlobal(waypoint1, screenWorldMap);
  const global2 = localToGlobal(waypoint2, screenWorldMap);

  if (!global1 || !global2) return [];

  const screensInPath = new Set<string>();

  // Usar algoritmo de línea de Bresenham en espacio de screens
  const dx = Math.abs(global2.x - global1.x);
  const dy = Math.abs(global2.y - global1.y);
  const steps = Math.max(dx, dy);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = global1.x + (global2.x - global1.x) * t;
    const y = global1.y + (global2.y - global1.y) * t;

    const local = globalToLocal({ x, y }, screenWorldMap);
    if (local) {
      screensInPath.add(local.screenId);
    }
  }

  return Array.from(screensInPath);
}

/**
 * Obtiene los screenIds adyacentes a un screen dado.
 * Incluye el screen actual.
 */
export function getAdjacentScreens(
  screenId: string,
  worldMap: WorldMapGraph,
  includeCurrentScreen: boolean = true
): string[] {
  const adjacentScreens = new Set<string>();

  if (includeCurrentScreen) {
    adjacentScreens.add(screenId);
  }

  // Encontrar el nodo correspondiente al screen
  const node = worldMap.nodes.find(n => n.screenAssetId === screenId);
  if (!node) return Array.from(adjacentScreens);

  // Encontrar todas las conexiones desde este nodo
  const connectionsFrom = worldMap.connections.filter(c => c.fromNodeId === node.id);
  const connectionsTo = worldMap.connections.filter(c => c.toNodeId === node.id);

  // Añadir screens conectados
  for (const conn of connectionsFrom) {
    const toNode = worldMap.nodes.find(n => n.id === conn.toNodeId);
    if (toNode) {
      adjacentScreens.add(toNode.screenAssetId);
    }
  }

  for (const conn of connectionsTo) {
    const fromNode = worldMap.nodes.find(n => n.id === conn.fromNodeId);
    if (fromNode) {
      adjacentScreens.add(fromNode.screenAssetId);
    }
  }

  return Array.from(adjacentScreens);
}

/**
 * Verifica si un screen está adyacente a otro screen.
 */
export function areScreensAdjacent(
  screenId1: string,
  screenId2: string,
  worldMap: WorldMapGraph
): boolean {
  const adjacentScreens = getAdjacentScreens(screenId1, worldMap, false);
  return adjacentScreens.includes(screenId2);
}

/**
 * Obtiene la distancia en píxeles entre dos waypoints considerando múltiples screens.
 */
export function getDistanceBetweenWaypoints(
  waypoint1: LocalCoordinate,
  waypoint2: LocalCoordinate,
  screenWorldMap: Map<string, ScreenWorldPosition>
): number {
  const global1 = localToGlobal(waypoint1, screenWorldMap);
  const global2 = localToGlobal(waypoint2, screenWorldMap);

  if (!global1 || !global2) return 0;

  const dx = global2.x - global1.x;
  const dy = global2.y - global1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normaliza una coordenada global para que se mantenga dentro del rango
 * de screens válidos en el WorldMap.
 */
export function clampGlobalToWorldBounds(
  global: GlobalCoordinate,
  screenWorldMap: Map<string, ScreenWorldPosition>
): GlobalCoordinate {
  if (screenWorldMap.size === 0) return global;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const screenPos of screenWorldMap.values()) {
    minX = Math.min(minX, screenPos.globalX);
    maxX = Math.max(maxX, screenPos.globalX + SCREEN_WIDTH_PX);
    minY = Math.min(minY, screenPos.globalY);
    maxY = Math.max(maxY, screenPos.globalY + SCREEN_HEIGHT_PX);
  }

  return {
    x: Math.max(minX, Math.min(maxX - 1, global.x)),
    y: Math.max(minY, Math.min(maxY - 1, global.y))
  };
}
