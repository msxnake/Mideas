#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createLiveBridge } from './live-bridge.js';
import {
  getAppState,
  getAsset,
  getConfiguration,
  getProject,
  listComponents,
  listEntities,
  listScreens,
  listWorlds,
  validateControlledAction,
} from './mideas-service.js';

const token = String(process.env.MIDEAS_MCP_TOKEN || '').trim();
const host = String(process.env.MIDEAS_MCP_HOST || '127.0.0.1').trim();
const port = parsePort(process.env.MIDEAS_MCP_PORT || '3333');
const allowedOrigins = String(process.env.MIDEAS_MCP_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const bridge = await createLiveBridge({ token, host, port, allowedOrigins });
const server = new McpServer(
  { name: 'mideas', version: '0.2.0' },
  {
    instructions: [
      'This server reads the live Mideas React state through a loopback-only authenticated bridge.',
      'Use get_app_state first and require connected=true before querying the project.',
      'Only execute_action can change UI state, and it accepts a fixed allowlist of actions.',
      'There is no filesystem tool and no command execution tool.',
    ].join(' '),
  },
);

server.tool(
  'get_app_state',
  'Return bridge connectivity and the current high-level Mideas UI state.',
  {},
  async () => asToolResult(getAppState(bridge)),
);

server.tool(
  'get_project',
  'Return the current live project. Asset payloads are omitted by default to keep responses bounded.',
  { includeAssetData: z.boolean().default(false) },
  async ({ includeAssetData }) => asToolResult(getProject(bridge, includeAssetData)),
);

server.tool(
  'get_asset',
  'Return one live project asset by exact id.',
  { assetId: z.string().min(1).max(200) },
  async ({ assetId }) => asToolResult(getAsset(bridge, assetId)),
);

server.tool('list_worlds', 'List world maps and their screen links.', {}, async () => asToolResult(listWorlds(bridge)));
server.tool('list_screens', 'List SCREEN 2/4/5 room assets and entity totals.', {}, async () => asToolResult(listScreens(bridge)));
server.tool('list_entities', 'List entity templates and placed instances across screens.', {}, async () => asToolResult(listEntities(bridge)));
server.tool('list_components', 'List ECS component definitions and template usage.', {}, async () => asToolResult(listComponents(bridge)));
server.tool('get_configuration', 'Read project and IDE configuration exposed by Mideas.', {}, async () => asToolResult(getConfiguration(bridge)));

server.tool(
  'execute_action',
  'Queue one controlled UI action. Allowed actions: focus_asset, open_configuration, set_status_message.',
  {
    type: z.enum(['focus_asset', 'open_configuration', 'set_status_message']),
    assetId: z.string().min(1).max(200).optional(),
    message: z.string().min(1).max(200).optional(),
    waitMs: z.number().int().min(0).max(5_000).default(3_000),
  },
  async ({ type, assetId, message, waitMs }) => {
    const action = type === 'focus_asset'
      ? { type, assetId }
      : type === 'set_status_message'
        ? { type, message }
        : { type };
    validateControlledAction(bridge, action);
    const queued = bridge.queueAction(action);
    const result = await bridge.waitForAction(queued.id, waitMs);
    return asToolResult({ action: queued, result });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Mideas MCP running on stdio; live bridge: ${bridge.address}`);

let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await Promise.allSettled([server.close(), bridge.close()]);
}

process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await close();
  process.exit(0);
});

function asToolResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function parsePort(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error('MIDEAS_MCP_PORT must be an integer between 0 and 65535.');
  }
  return parsed;
}
