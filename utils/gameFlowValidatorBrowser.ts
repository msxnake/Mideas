/**
 * GameFlow Validator (Browser Version)
 * Compatible con navegador - sin dependencias de Node.js
 */

import { GameFlowGraph, ProjectAsset } from '../types';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'WARNING';

export interface ValidationIssue {
  type: 'ERROR' | 'WARNING';
  message: string;
  nodeId?: string;
  assetId?: string;
}

export interface GameFlowValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];
  hash: string;
  timestamp: string;
}

/**
 * Simple hash function para navegador (sin crypto)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Calculate hash of GameFlow structure
 */
function calculateGameFlowHash(gameFlow: GameFlowGraph): string {
  const hashData = {
    name: gameFlow.name,
    nodes: gameFlow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      worldAssetId: (n as any).worldAssetId,
      title: (n as any).title
    })),
    connections: gameFlow.connections.map(c => ({
      from: c.from,
      to: c.to
    })),
    startNodeId: gameFlow.startNodeId
  };

  return simpleHash(JSON.stringify(hashData));
}

/**
 * Validate GameFlow structure (browser version)
 */
export function validateGameFlow(
  gameFlow: GameFlowGraph,
  allAssets: ProjectAsset[]
): GameFlowValidationResult {
  const issues: ValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  // Step 1: Check for Start node
  const startNodes = gameFlow.nodes.filter(n => n.type === 'Start');

  if (startNodes.length === 0) {
    issues.push({
      type: 'ERROR',
      message: 'No Start node found in GameFlow'
    });
  } else if (startNodes.length > 1) {
    issues.push({
      type: 'WARNING',
      message: `Multiple Start nodes found (${startNodes.length}). Only one should exist.`
    });
  }

  const startNode = startNodes[0];

  // Step 2: Check Start node has outgoing connections
  if (startNode) {
    const startConnections = gameFlow.connections.filter(
      c => (c.from as any)?.nodeId === startNode.id || c.from === startNode.id
    );

    if (startConnections.length === 0) {
      issues.push({
        type: 'ERROR',
        message: 'Start node has no outgoing connections',
        nodeId: startNode.id
      });
    }
  }

  // Step 3: Check for invalid/incomplete connections
  const nodeIds = new Set(gameFlow.nodes.map(n => n.id));

  gameFlow.connections.forEach(conn => {
    const fromId = (conn.from as any)?.nodeId || conn.from;
    const toId = (conn.to as any)?.nodeId || conn.to;

    // Check for connections with missing to/from
    if (!fromId) {
      issues.push({
        type: 'ERROR',
        message: `Open Connections! Connection has no source node defined`
      });
    }

    if (!toId) {
      issues.push({
        type: 'ERROR',
        message: `Open Connections! Incomplete connection from node ${fromId || 'unknown'} - no destination defined`
      });
    }

    // Check for connections pointing to non-existent nodes
    if (fromId && !nodeIds.has(fromId as string)) {
      issues.push({
        type: 'ERROR',
        message: `Connection references non-existent source node: ${fromId}`,
        nodeId: fromId as string
      });
    }

    if (toId && !nodeIds.has(toId as string)) {
      issues.push({
        type: 'ERROR',
        message: `Connection references non-existent destination node: ${toId}`,
        nodeId: toId as string
      });
    }
  });

  // Step 3b: Check for orphaned nodes
  const connectedNodeIds = new Set<string>();
  gameFlow.connections.forEach(conn => {
    const fromId = (conn.from as any)?.nodeId || conn.from;
    const toId = (conn.to as any)?.nodeId || conn.to;
    if (fromId) connectedNodeIds.add(fromId as string);
    if (toId) connectedNodeIds.add(toId as string);
  });

  const orphanedNodes = gameFlow.nodes.filter(
    n => !connectedNodeIds.has(n.id) && n.type !== 'Start'
  );

  if (orphanedNodes.length > 0) {
    orphanedNodes.forEach(node => {
      issues.push({
        type: 'WARNING',
        message: `Orphaned node: ${node.type}`,
        nodeId: node.id
      });
    });
  }

  // Step 3c: Check for nodes with unconnected outputs
  const terminalNodeTypes = ['End', 'Restart'];

  gameFlow.nodes.forEach(node => {
    // Skip terminal nodes
    if (terminalNodeTypes.includes(node.type)) {
      return;
    }

    // Check if node has outgoing connections
    const hasOutgoingConnections = gameFlow.connections.some(
      c => ((c.from as any)?.nodeId || c.from) === node.id
    );

    // For SubMenu nodes, check if all options have connections
    if (node.type === 'SubMenu') {
      const options = (node as any).options || [];

      options.forEach((option: any) => {
        const hasOptionConnection = gameFlow.connections.some(
          c => ((c.from as any)?.nodeId || c.from) === node.id &&
               (c.from as any)?.sourceId === option.id
        );

        if (!hasOptionConnection) {
          issues.push({
            type: 'ERROR',
            message: `Open Connections! SubMenu option "${option.text}" has no outgoing connection`,
            nodeId: node.id
          });
        }
      });
    } else if (node.type === 'IfThenElse') {
      // For IfThenElse nodes, check for THEN and ELSE connections
      const hasThenConnection = gameFlow.connections.some(
        c => ((c.from as any)?.nodeId || c.from) === node.id &&
             ((c.from as any)?.sourceId === 'then' || !(c.from as any)?.sourceId)
      );
      const hasElseConnection = gameFlow.connections.some(
        c => ((c.from as any)?.nodeId || c.from) === node.id &&
             (c.from as any)?.sourceId === 'else'
      );

      if (!hasThenConnection) {
        issues.push({
          type: 'ERROR',
          message: 'Open Connections! IfThenElse node has no THEN connection',
          nodeId: node.id
        });
      }

      if (!hasElseConnection) {
        issues.push({
          type: 'ERROR',
          message: 'Open Connections! IfThenElse node has no ELSE connection',
          nodeId: node.id
        });
      }
    } else if (node.type !== 'Waypoint') {
      // For other non-terminal nodes, check for at least one outgoing connection
      if (!hasOutgoingConnections) {
        issues.push({
          type: 'ERROR',
          message: `Open Connections! ${node.type} node has no outgoing connection`,
          nodeId: node.id
        });
      }
    }
  });

  // Step 4: Validate asset references
  gameFlow.nodes.forEach(node => {
    if (node.type === 'WorldLink') {
      const worldAssetId = (node as any).worldAssetId;
      if (worldAssetId) {
        const worldExists = allAssets.some(a => a.id === worldAssetId);
        if (!worldExists) {
          issues.push({
            type: 'ERROR',
            message: `WorldLink references missing asset: ${worldAssetId}`,
            nodeId: node.id,
            assetId: worldAssetId
          });
        }
      } else {
        issues.push({
          type: 'ERROR',
          message: 'WorldLink node has no worldAssetId defined',
          nodeId: node.id
        });
      }
    }

    if (node.type === 'SubMenu') {
      const options = (node as any).options;
      if (!options || options.length === 0) {
        issues.push({
          type: 'WARNING',
          message: 'SubMenu has no options',
          nodeId: node.id
        });
      }
    }

    if (node.type === 'Text') {
      const title = (node as any).title;
      const message = (node as any).message;
      if ((!title || title.trim() === '') && (!message || message.trim() === '')) {
        issues.push({
          type: 'WARNING',
          message: 'Text node has no content',
          nodeId: node.id
        });
      }
    }
  });

  // Determine status
  const hasErrors = issues.some(i => i.type === 'ERROR');
  const hasWarnings = issues.some(i => i.type === 'WARNING');

  const status: ValidationStatus = hasErrors ? 'FAILED' : hasWarnings ? 'WARNING' : 'PASSED';

  const hash = calculateGameFlowHash(gameFlow);

  return {
    status,
    issues,
    hash,
    timestamp
  };
}

/**
 * Validate and return result (browser version - no file saving)
 */
export function validateGameFlowBrowser(
  gameFlow: GameFlowGraph,
  allAssets: ProjectAsset[]
): GameFlowValidationResult {
  console.log('🔄 Validating GameFlow in browser...');

  const result = validateGameFlow(gameFlow, allAssets);

  console.log(`✅ Validation complete: ${result.status}`);
  if (result.issues.length > 0) {
    console.log(`⚠️  Issues found: ${result.issues.length}`);
    result.issues.forEach(issue => {
      console.log(`   ${issue.type}: ${issue.message}`);
    });
  }

  return result;
}
