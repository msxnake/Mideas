import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const projectSchema = z.object({
  assets: z.array(z.object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(500),
    type: z.string().min(1).max(100),
    data: z.unknown().optional(),
  }).passthrough()).max(10_000),
  currentProjectName: z.string().max(500).nullable().optional(),
  currentScreenMode: z.string().max(200).optional(),
  selectedAssetId: z.string().max(200).nullable().optional(),
  currentEditor: z.union([z.string().max(100), z.number().int()]).optional(),
  statusBarMessage: z.string().max(1_000).optional(),
  componentDefinitions: z.array(z.unknown()).max(5_000).optional(),
  entityTemplates: z.array(z.unknown()).max(5_000).optional(),
  enemyDefinitions: z.array(z.unknown()).max(5_000).optional(),
  tileBanks: z.array(z.unknown()).max(1_000).optional(),
  ideConfiguration: z.record(z.unknown()).optional(),
  msx2ProjectProfile: z.unknown().optional(),
  mainMenuConfig: z.unknown().optional(),
  presentationScreen: z.unknown().optional(),
}).passthrough();

const stateEnvelopeSchema = z.object({
  clientId: z.string().min(1).max(100),
  project: projectSchema,
});

/** Loose validation for an MSX2 sprite payload; passthrough keeps palette/size/frames intact. */
export const mcpSpriteSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  target: z.literal('MSX2'),
  vdpMode: z.enum(['SCREEN4', 'SCREEN5']),
  frames: z.array(z.unknown()).min(1).max(64),
}).passthrough();

export const controlledActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('focus_asset'), assetId: z.string().min(1).max(200) }),
  z.object({ type: z.literal('open_configuration') }),
  z.object({ type: z.literal('set_status_message'), message: z.string().min(1).max(200) }),
  z.object({ type: z.literal('upsert_sprite'), sprite: mcpSpriteSchema }),
]);

export async function createLiveBridge(options = {}) {
  const host = options.host || '127.0.0.1';
  const port = options.port ?? 3333;
  const token = String(options.token || '');
  const maxBodyBytes = options.maxBodyBytes ?? 5 * 1024 * 1024;
  const stateTtlMs = options.stateTtlMs ?? 10_000;
  const actionTtlMs = options.actionTtlMs ?? 30_000;
  const allowedOrigins = new Set(options.allowedOrigins || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (token.length < 16) {
    throw new Error('MIDEAS_MCP_TOKEN must contain at least 16 characters.');
  }

  let latestState = null;
  let revision = 0;
  const actions = new Map();
  const waiters = new Map();

  const api = {
    getSnapshot() {
      const connected = Boolean(latestState && Date.now() - latestState.receivedAt <= stateTtlMs);
      return {
        connected,
        revision,
        updatedAt: latestState ? new Date(latestState.receivedAt).toISOString() : null,
        clientId: latestState?.clientId || null,
        project: connected ? structuredClone(latestState.project) : null,
      };
    },

    requireProject() {
      const snapshot = api.getSnapshot();
      if (!snapshot.connected || !snapshot.project) {
        throw new Error('Mideas is not connected. Open the app and verify the MCP bridge configuration.');
      }
      return snapshot;
    },

    queueAction(input) {
      api.requireProject();
      const action = controlledActionSchema.parse(input);
      const id = randomUUID();
      const now = Date.now();
      const record = {
        id,
        action,
        status: 'queued',
        createdAt: now,
        expiresAt: now + actionTtlMs,
        deliveredAt: null,
        result: null,
      };
      actions.set(id, record);
      return publicAction(record);
    },

    async waitForAction(id, timeoutMs = 3_000) {
      const record = actions.get(id);
      if (!record) throw new Error(`Unknown action: ${id}`);
      if (record.result) return structuredClone(record.result);
      if (timeoutMs <= 0) return { status: record.status };

      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          waiters.delete(id);
          resolve({ status: actions.get(id)?.status || 'expired' });
        }, Math.min(timeoutMs, actionTtlMs));
        waiters.set(id, result => {
          clearTimeout(timeout);
          resolve(structuredClone(result));
        });
      });
    },

    async close() {
      for (const resolve of waiters.values()) resolve({ status: 'closed' });
      waiters.clear();
      await new Promise((resolve, reject) => httpServer.close(error => error ? reject(error) : resolve()));
    },
  };

  const httpServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', `http://${host}`);
      const origin = request.headers.origin;

      if (origin && allowedOrigins.has(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Vary', 'Origin');
      }
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');

      if (request.method === 'OPTIONS') {
        if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: 'Origin not allowed.' });
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mideas-MCP-Token');
        response.writeHead(204);
        return response.end();
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
        const snapshot = api.getSnapshot();
        return sendJson(response, 200, { ok: true, connected: snapshot.connected, revision: snapshot.revision });
      }

      if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: 'Origin not allowed.' });
      if (!hasValidToken(request.headers['x-mideas-mcp-token'], token)) {
        return sendJson(response, 401, { error: 'Invalid bridge token.' });
      }

      if (request.method === 'POST' && requestUrl.pathname === '/api/state') {
        const envelope = stateEnvelopeSchema.parse(await readJson(request, maxBodyBytes));
        revision += 1;
        latestState = {
          clientId: envelope.clientId,
          project: structuredClone(envelope.project),
          receivedAt: Date.now(),
        };
        return sendJson(response, 200, { ok: true, revision });
      }

      if (request.method === 'GET' && requestUrl.pathname === '/api/actions') {
        const now = Date.now();
        const pending = [];
        for (const [id, record] of actions) {
          if (record.expiresAt <= now) {
            actions.delete(id);
            const resolve = waiters.get(id);
            if (resolve) resolve({ status: 'expired' });
            waiters.delete(id);
            continue;
          }
          if (record.status === 'queued' || (record.status === 'delivered' && now - record.deliveredAt > 2_000)) {
            record.status = 'delivered';
            record.deliveredAt = now;
            pending.push(publicAction(record));
          }
        }
        return sendJson(response, 200, { actions: pending });
      }

      const resultMatch = request.method === 'POST'
        ? requestUrl.pathname.match(/^\/api\/actions\/([0-9a-f-]+)\/result$/i)
        : null;
      if (resultMatch) {
        const record = actions.get(resultMatch[1]);
        if (!record) return sendJson(response, 404, { error: 'Action not found or expired.' });
        const result = z.object({
          ok: z.boolean(),
          message: z.string().max(500).optional(),
        }).parse(await readJson(request, 16_384));
        record.status = result.ok ? 'completed' : 'failed';
        record.result = { status: record.status, ...result };
        const resolve = waiters.get(record.id);
        if (resolve) resolve(record.result);
        waiters.delete(record.id);
        return sendJson(response, 200, { ok: true });
      }

      return sendJson(response, 404, { error: 'Not found.' });
    } catch (error) {
      const status = error?.name === 'ZodError' ? 400 : (error?.statusCode || 500);
      return sendJson(response, status, { error: error instanceof Error ? error.message : 'Unexpected error.' });
    }
  });

  await new Promise((resolve, reject) => {
    httpServer.once('error', error => {
      if (error && error.code === 'EADDRINUSE') {
        reject(new Error(
          `Mideas MCP bridge port ${port} on ${host} is already in use. `
          + 'Another Mideas MCP server is probably already running — connect to that one instead of '
          + 'starting a second instance, or set MIDEAS_MCP_PORT to a free port.',
        ));
      } else {
        reject(error);
      }
    });
    httpServer.listen(port, host, resolve);
  });

  const address = httpServer.address();
  api.address = typeof address === 'object' && address ? `http://${host}:${address.port}` : null;
  return api;
}

function publicAction(record) {
  return {
    id: record.id,
    type: record.action.type,
    payload: Object.fromEntries(Object.entries(record.action).filter(([key]) => key !== 'type')),
    status: record.status,
    createdAt: new Date(record.createdAt).toISOString(),
  };
}

function hasValidToken(candidate, expected) {
  const provided = Array.isArray(candidate) ? candidate[0] : candidate;
  if (typeof provided !== 'string') return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

async function readJson(request, maxBytes) {
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
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) throw new Error('A JSON request body is required.');
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}
