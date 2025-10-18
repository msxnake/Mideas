/**
 * GameFlow Validator and Log Generator
 * Validates GameFlow structure and generates control logs
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { GameFlowGraph, GameFlowNode, ProjectAsset } from '../types';

/**
 * Validation result types
 */
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

export interface GameFlowLogData {
  projectName: string;
  timestamp: string;
  hash: string;
  status: ValidationStatus;
  logContent: string;
}

/**
 * Calculate hash of GameFlow structure to detect changes
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

  return crypto.createHash('md5')
    .update(JSON.stringify(hashData))
    .digest('hex');
}

/**
 * Validate GameFlow structure
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
      c => c.from?.nodeId === startNode.id
    );

    if (startConnections.length === 0) {
      issues.push({
        type: 'ERROR',
        message: 'Start node has no outgoing connections',
        nodeId: startNode.id
      });
    }
  }

  // Step 3: Check for invalid connections (pointing to non-existent nodes)
  const nodeIds = new Set(gameFlow.nodes.map(n => n.id));

  gameFlow.connections.forEach(conn => {
    const fromId = conn.from?.nodeId;
    const toId = conn.to?.nodeId;

    if (fromId && !nodeIds.has(fromId)) {
      issues.push({
        type: 'ERROR',
        message: `Connection references non-existent source node: ${fromId}`,
        nodeId: fromId
      });
    }

    if (toId && !nodeIds.has(toId)) {
      issues.push({
        type: 'ERROR',
        message: `Connection references non-existent destination node: ${toId}`,
        nodeId: toId
      });
    }

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
  });

  // Step 3b: Check for orphaned nodes (no incoming or outgoing connections)
  const connectedNodeIds = new Set<string>();
  gameFlow.connections.forEach(conn => {
    const fromId = conn.from?.nodeId;
    const toId = conn.to?.nodeId;
    if (fromId) connectedNodeIds.add(fromId);
    if (toId) connectedNodeIds.add(toId);
  });

  const orphanedNodes = gameFlow.nodes.filter(
    n => !connectedNodeIds.has(n.id) && n.type !== 'Start'
  );

  if (orphanedNodes.length > 0) {
    orphanedNodes.forEach(node => {
      issues.push({
        type: 'WARNING',
        message: `Orphaned node (no connections): ${node.type}`,
        nodeId: node.id
      });
    });
  }

  // Step 3b: Check for nodes with unconnected outputs (excluding End/Restart nodes)
  const terminalNodeTypes = ['End', 'Restart'];

  gameFlow.nodes.forEach(node => {
    // Skip terminal nodes - they shouldn't have outgoing connections
    if (terminalNodeTypes.includes(node.type)) {
      return;
    }

    // Check if node has outgoing connections
    const hasOutgoingConnections = gameFlow.connections.some(
      c => c.from?.nodeId === node.id
    );

    // For SubMenu nodes, check if all options have connections
    if (node.type === 'SubMenu') {
      const options = (node as any).options || [];

      options.forEach((option: any) => {
        const hasOptionConnection = gameFlow.connections.some(
          c => c.from?.nodeId === node.id && c.from?.sourceId === option.id
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
        c => c.from?.nodeId === node.id && (c.from?.sourceId === 'then' || !c.from?.sourceId)
      );
      const hasElseConnection = gameFlow.connections.some(
        c => c.from?.nodeId === node.id && c.from?.sourceId === 'else'
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
    } else {
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

  // Step 5: Check End/Restart nodes have incoming connections
  const endNodes = gameFlow.nodes.filter(n => n.type === 'End' || n.type === 'Restart');
  endNodes.forEach(node => {
    const hasIncoming = gameFlow.connections.some(
      c => c.to?.nodeId === node.id
    );

    if (!hasIncoming) {
      issues.push({
        type: 'WARNING',
        message: `${node.type} node has no incoming connections`,
        nodeId: node.id
      });
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
 * Generate GameFlow log content
 */
export function generateGameFlowLog(
  gameFlow: GameFlowGraph,
  allAssets: ProjectAsset[],
  projectName: string
): string {
  const validation = validateGameFlow(gameFlow, allAssets);
  const timestamp = new Date().toLocaleString();

  let log = `GameFlow Validation Log
Project: ${projectName}
Generated: ${timestamp}
Version: 1.0
================================================================================

`;

  // Step 1: Check for Main
  log += `Step 1: Checking for Main GameFlow\n`;
  if (gameFlow.name === 'Main' || gameFlow.name === 'main') {
    log += `Found "Main"\n\n`;
  } else {
    log += `[WARNING] GameFlow name is "${gameFlow.name}", expected "Main"\n\n`;
  }

  // Step 2: Validate structure
  log += `Step 2: Validating Main GameFlow Structure\n`;

  const startNode = gameFlow.nodes.find(n => n.type === 'Start');
  log += `  - Start Node: ${startNode ? startNode.id : 'NOT FOUND'} ${startNode ? '[OK]' : '[ERROR]'}\n`;
  log += `  - Total Nodes: ${gameFlow.nodes.length}\n`;
  log += `  - Total Connections: ${gameFlow.connections.length}\n`;

  const orphanedCount = validation.issues.filter(i => i.message.includes('Orphaned node (no connections)')).length;
  const unconnectedOutputCount = validation.issues.filter(i => i.message.includes('no outgoing connection')).length;
  const invalidConnectionCount = validation.issues.filter(i =>
    i.message.includes('non-existent') || i.message.includes('no destination node defined')
  ).length;

  log += `  - Orphaned Nodes: ${orphanedCount} ${orphanedCount > 0 ? '[WARNING]' : '[OK]'}\n`;
  log += `  - Nodes with Unconnected Outputs: ${unconnectedOutputCount} ${unconnectedOutputCount > 0 ? '[WARNING]' : '[OK]'}\n`;
  log += `  - Invalid/Incomplete Connections: ${invalidConnectionCount} ${invalidConnectionCount > 0 ? '[ERROR]' : '[OK]'}\n\n`;

  // Step 3: Analyze graph
  log += `Step 3: Analyzing GameFlow Graph\n`;
  gameFlow.nodes.forEach((node, i) => {
    let nodeInfo = `  - Node ${i + 1}: ${node.type} (${node.id})`;

    if (node.type === 'WorldLink') {
      const worldAssetId = (node as any).worldAssetId;
      nodeInfo += ` -> World: ${worldAssetId || 'UNDEFINED'}`;
    } else if (node.type === 'SubMenu') {
      const title = (node as any).title;
      nodeInfo += ` -> Title: ${title || 'Untitled'}`;
    } else if (node.type === 'Text') {
      const title = (node as any).title;
      nodeInfo += ` -> Title: ${title || 'Untitled'}`;
    }

    log += nodeInfo + '\n';
  });
  log += '\n';

  // Step 4: Validate connections
  log += `Step 4: Validating Connections\n`;
  gameFlow.connections.forEach((conn, i) => {
    const fromNodeId = conn.from?.nodeId;
    const toNodeId = conn.to?.nodeId;

    const fromNode = gameFlow.nodes.find(n => n.id === fromNodeId);
    const toNode = gameFlow.nodes.find(n => n.id === toNodeId);

    const fromType = fromNode?.type || 'UNKNOWN';
    const toType = toNode?.type || 'UNKNOWN';

    log += `  - Connection ${i + 1}: ${fromType} → ${toType} [OK]\n`;
  });
  log += '\n';

  // Step 5: Check referenced assets
  log += `Step 5: Checking Referenced Assets\n`;
  const worldLinks = gameFlow.nodes.filter(n => n.type === 'WorldLink');

  if (worldLinks.length === 0) {
    log += `  - No WorldLink nodes found\n`;
  } else {
    worldLinks.forEach(node => {
      const worldAssetId = (node as any).worldAssetId;
      if (worldAssetId) {
        const worldExists = allAssets.some(a => a.id === worldAssetId);
        const worldAsset = allAssets.find(a => a.id === worldAssetId);
        log += `  - WorldMap ${worldAssetId} (${worldAsset?.name || 'Unknown'}): ${worldExists ? '[FOUND]' : '[MISSING]'}\n`;
      }
    });
  }
  log += '\n';

  // Step 6: Detect issues
  log += `Step 6: Detecting Issues\n`;

  if (validation.issues.length === 0) {
    log += `  [OK] No issues detected\n`;
  } else {
    const errors = validation.issues.filter(i => i.type === 'ERROR');
    const warnings = validation.issues.filter(i => i.type === 'WARNING');

    if (warnings.length > 0) {
      log += `  [WARNING] Found ${warnings.length} warning(s):\n`;
      warnings.forEach(issue => {
        log += `    - ${issue.message}\n`;
      });
    }

    if (errors.length > 0) {
      log += `  [ERROR] Found ${errors.length} error(s):\n`;
      errors.forEach(issue => {
        log += `    - ${issue.message}\n`;
      });
    }
  }

  log += `\n================================================================================\n`;
  log += `Validation Result: [${validation.status}]\n`;
  log += `Hash: ${validation.hash}\n`;
  log += `================================================================================\n`;

  return log;
}

/**
 * Save GameFlow log to file
 */
export function saveGameFlowLog(logContent: string, projectName: string): void {
  const logsDir = path.join(process.cwd(), 'logs');

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFilePath = path.join(logsDir, `${projectName}_gameflow.log`);
  fs.writeFileSync(logFilePath, logContent, 'utf-8');

  console.log(`✅ GameFlow log saved: ${logFilePath}`);
}

/**
 * Load GameFlow log from file
 */
export function loadGameFlowLog(projectName: string): GameFlowLogData | null {
  const logsDir = path.join(process.cwd(), 'logs');
  const logFilePath = path.join(logsDir, `${projectName}_gameflow.log`);

  if (!fs.existsSync(logFilePath)) {
    return null;
  }

  try {
    const logContent = fs.readFileSync(logFilePath, 'utf-8');

    // Parse log to extract metadata
    const hashMatch = logContent.match(/Hash: ([a-f0-9]+)/);
    const statusMatch = logContent.match(/Validation Result: \[(\w+)\]/);
    const timestampMatch = logContent.match(/Generated: (.+)/);

    if (!hashMatch || !statusMatch) {
      console.warn('⚠️  Log file exists but could not parse metadata');
      return null;
    }

    return {
      projectName,
      timestamp: timestampMatch ? timestampMatch[1] : 'Unknown',
      hash: hashMatch[1],
      status: statusMatch[1] as ValidationStatus,
      logContent
    };
  } catch (error) {
    console.error('❌ Error reading log file:', error);
    return null;
  }
}

/**
 * Check if GameFlow log is up to date
 */
export function isGameFlowLogUpToDate(
  gameFlow: GameFlowGraph,
  projectName: string
): boolean {
  const existingLog = loadGameFlowLog(projectName);

  if (!existingLog) {
    return false; // No log exists
  }

  const currentHash = calculateGameFlowHash(gameFlow);

  return existingLog.hash === currentHash;
}

/**
 * Validate and generate log if needed
 * Returns true if validation passed, false otherwise
 */
export function validateAndGenerateLog(
  gameFlow: GameFlowGraph,
  allAssets: ProjectAsset[],
  projectName: string,
  forceRegenerate: boolean = false
): GameFlowValidationResult {
  // Check if log is up to date
  if (!forceRegenerate && isGameFlowLogUpToDate(gameFlow, projectName)) {
    console.log('✅ GameFlow log is up to date');
    const existingLog = loadGameFlowLog(projectName);

    // Return cached result
    return {
      status: existingLog!.status,
      issues: [], // We don't store issues in log file, but status is enough
      hash: existingLog!.hash,
      timestamp: existingLog!.timestamp
    };
  }

  // Generate new log
  console.log('🔄 Generating new GameFlow log...');
  const logContent = generateGameFlowLog(gameFlow, allAssets, projectName);
  saveGameFlowLog(logContent, projectName);

  return validateGameFlow(gameFlow, allAssets);
}
