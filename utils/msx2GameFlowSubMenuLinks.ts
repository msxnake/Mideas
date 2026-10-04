import type { Msx2GameFlowConnection, Msx2GameFlowNode } from '../types';

/**
 * A SubMenu routes each option through its own connection (`from.sourceId` = option id). A connection
 * with no sourceId, or with one that is not an option of the menu, leads nowhere at runtime: the option
 * it was meant for is reported as "needs an outgoing connection" and the ROM keeps the player on the menu.
 *
 * Such links come from older editor builds (adding a node while a SubMenu was selected replaced every
 * option link with one source-less link). `repairSubMenuConnections` gives each of them to the first
 * option of that menu that has no connection yet, which is the option the author was wiring.
 */
export function repairSubMenuConnections(
  nodes: Msx2GameFlowNode[],
  connections: Msx2GameFlowConnection[],
): { connections: Msx2GameFlowConnection[]; repaired: number } {
  let repaired = 0;
  let next = connections;
  for (const node of nodes) {
    if (node.type !== 'SubMenu') continue;
    const optionIds = (node.options || []).map(option => option.id);
    const known = new Set(optionIds);
    const taken = new Set(
      next.filter(c => c.from.nodeId === node.id && c.from.sourceId && known.has(c.from.sourceId)).map(c => c.from.sourceId as string),
    );
    next = next.map(connection => {
      if (connection.from.nodeId !== node.id) return connection;
      if (connection.from.sourceId && known.has(connection.from.sourceId)) return connection;
      const free = optionIds.find(id => !taken.has(id));
      if (!free) return connection; // nothing left to give it to: leave it for the validator to report
      taken.add(free);
      repaired++;
      return { ...connection, from: { ...connection.from, sourceId: free } };
    });
  }
  return { connections: repaired > 0 ? next : connections, repaired };
}

/** First option of the SubMenu with no outgoing connection (where a new link should go), or undefined. */
export function firstFreeSubMenuOption(
  node: Extract<Msx2GameFlowNode, { type: 'SubMenu' }>,
  connections: Msx2GameFlowConnection[],
): string | undefined {
  return (node.options || []).find(option => !connections.some(c => c.from.nodeId === node.id && c.from.sourceId === option.id))?.id;
}
