#!/usr/bin/env node
import { createServer as createHttpServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createLiveBridge, mcpSpriteSchema } from './live-bridge.js';
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

// Optional Streamable HTTP transport for REMOTE MCP clients (ChatGPT, OpenAI
// Agents SDK, etc.). Disabled unless MIDEAS_MCP_HTTP_PORT is set. Uses its own
// Bearer token (defaults to MIDEAS_MCP_TOKEN) and binds to MIDEAS_MCP_HTTP_HOST.
const httpPortRaw = String(process.env.MIDEAS_MCP_HTTP_PORT || '').trim();
const httpEnabled = httpPortRaw.length > 0;
const httpPort = httpEnabled ? parsePort(httpPortRaw) : null;
const httpHost = String(process.env.MIDEAS_MCP_HTTP_HOST || '127.0.0.1').trim();
const httpToken = String(process.env.MIDEAS_MCP_HTTP_TOKEN || token).trim();
const httpPath = String(process.env.MIDEAS_MCP_HTTP_PATH || '/mcp').trim() || '/mcp';

let bridge;
try {
  bridge = await createLiveBridge({ token, host, port, allowedOrigins });
} catch (error) {
  // Exit with a readable one-line reason instead of an opaque stack trace, so a
  // client that spawned us (stdio) reports a diagnosable "closed before handshake".
  console.error(`[mideas-mcp] Startup failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

/**
 * Builds a fully configured Mideas MCP server. A fresh instance is used per
 * transport (one long-lived for stdio, one per request for stateless HTTP),
 * so tool registration lives here to stay identical across both surfaces.
 */
function createMideasServer() {
  const server = new McpServer(
    { name: 'mideas', version: '0.3.0' },
    {
      instructions: [
        'This server reads the live Mideas React state through a loopback-only authenticated bridge.',
        'Use get_app_state first and require connected=true before querying the project.',
        'execute_action changes UI state and accepts a fixed allowlist of actions.',
        'upsert_sprite saves one MSX2 sprite into the global sprite library (localStorage) without touching the open project.',
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

  server.tool(
    'upsert_sprite',
    'Save one MSX2 sprite into the global Mideas sprite library (localStorage). Adds a new entry (deduplicated by name); does NOT modify the open project. Sprite must be a full Msx2Sprite object (target "MSX2", vdpMode SCREEN4/SCREEN5, palette, frames).',
    {
      sprite: mcpSpriteSchema,
      waitMs: z.number().int().min(0).max(5_000).default(3_000),
    },
    async ({ sprite, waitMs }) => {
      const queued = bridge.queueAction({ type: 'upsert_sprite', sprite });
      const result = await bridge.waitForAction(queued.id, waitMs);
      return asToolResult({ action: queued, result });
    },
  );

  return server;
}

// --- stdio transport (always on; used by Claude Code / Desktop / Cursor) ---
const stdioServer = createMideasServer();
await stdioServer.connect(new StdioServerTransport());

// --- optional Streamable HTTP transport (remote clients) ---
let httpServer = null;
if (httpEnabled) {
  if (httpToken.length < 16) {
    throw new Error('MIDEAS_MCP_HTTP_TOKEN (or MIDEAS_MCP_TOKEN) must contain at least 16 characters to expose the HTTP transport.');
  }
  httpServer = startHttpMcp();
}

console.error(`Mideas MCP running on stdio; live bridge: ${bridge.address}`);
if (httpServer) {
  console.error(`Mideas MCP Streamable HTTP transport: http://${httpHost}:${httpPort}${httpPath} (Bearer auth)`);
}

let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await Promise.allSettled([
    stdioServer.close(),
    bridge.close(),
    httpServer ? new Promise(resolve => httpServer.close(() => resolve())) : Promise.resolve(),
  ]);
}

process.on('SIGINT', async () => { await close(); process.exit(0); });
process.on('SIGTERM', async () => { await close(); process.exit(0); });

/**
 * HTTP host for the MCP Streamable HTTP transport with SESSION management.
 * The first POST must be an `initialize` request; the transport then issues an
 * `mcp-session-id` the client echoes on every later POST/GET/DELETE. Each
 * session keeps its own server+transport so the initialized state persists
 * across requests (required by ChatGPT / OpenAI Agents SDK handshakes).
 * Auth is a Bearer token; only the configured path accepts requests.
 */
const httpSessions = new Map();

function startHttpMcp() {
  const server = createHttpServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', `http://${httpHost}`);
      response.setHeader('Cache-Control', 'no-store');

      if (request.method === 'GET' && requestUrl.pathname === '/health') {
        return sendJson(response, 200, { ok: true, transport: 'streamable-http', path: httpPath, sessions: httpSessions.size });
      }
      if (requestUrl.pathname !== httpPath) {
        return sendJson(response, 404, { error: 'Not found.' });
      }
      if (!hasBearer(request.headers['authorization'], request.headers['x-mideas-mcp-token'], httpToken)) {
        response.setHeader('WWW-Authenticate', 'Bearer');
        return sendJson(response, 401, { error: 'Unauthorized.' });
      }

      const sessionId = firstHeader(request.headers['mcp-session-id']);
      const existing = sessionId ? httpSessions.get(sessionId) : null;

      if (request.method === 'POST') {
        const raw = await readBody(request, 8 * 1024 * 1024);
        const parsed = raw ? JSON.parse(raw) : undefined;

        if (existing) {
          return existing.transport.handleRequest(request, response, parsed);
        }
        if (!isInitializeRequest(parsed)) {
          return sendJson(response, 400, {
            jsonrpc: '2.0',
            error: { code: -32000, message: 'No valid session. Send an initialize request first.' },
            id: null,
          });
        }
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: sid => { httpSessions.set(sid, entry); },
        });
        const mcp = createMideasServer();
        const entry = { server: mcp, transport };
        transport.onclose = () => { if (transport.sessionId) httpSessions.delete(transport.sessionId); };
        await mcp.connect(transport);
        return transport.handleRequest(request, response, parsed);
      }

      // GET (open SSE stream) or DELETE (terminate) require an established session.
      if (!existing) {
        return sendJson(response, 400, { error: 'Unknown or missing mcp-session-id.' });
      }
      return existing.transport.handleRequest(request, response);
    } catch (error) {
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error.' },
        id: null,
      }));
    }
  });
  // A port clash on the OPTIONAL HTTP transport must not kill the working stdio
  // server: log a clear reason and keep running stdio-only.
  server.on('error', error => {
    if (error && error.code === 'EADDRINUSE') {
      console.error(
        `[mideas-mcp] HTTP transport disabled: port ${httpPort} on ${httpHost} is already in use. `
        + 'Set MIDEAS_MCP_HTTP_PORT to a free port or stop the other server. stdio is still available.',
      );
    } else {
      console.error(`[mideas-mcp] HTTP transport error: ${error?.message || error}`);
    }
    httpServer = null;
  });
  server.listen(httpPort, httpHost);
  return server;
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : (typeof value === 'string' ? value : null);
}

function hasBearer(authHeader, tokenHeader, expected) {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  let provided = '';
  if (typeof header === 'string' && header.startsWith('Bearer ')) provided = header.slice(7).trim();
  if (!provided) {
    const alt = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
    if (typeof alt === 'string') provided = alt.trim();
  }
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function asToolResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function parsePort(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error('MIDEAS_MCP_PORT must be an integer between 0 and 65535.');
  }
  return parsed;
}
