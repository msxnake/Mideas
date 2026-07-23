import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../src/index.js', import.meta.url));

test('serves the safe live-app tool surface through MCP stdio', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      MIDEAS_MCP_TOKEN: 'integration-test-token-1234',
      MIDEAS_MCP_PORT: '0',
    },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'mideas-mcp-test', version: '0.2.0' });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map(tool => tool.name).sort(),
      [
        'execute_action',
        'get_app_state',
        'get_asset',
        'get_configuration',
        'get_project',
        'list_components',
        'list_entities',
        'list_screens',
        'list_worlds',
        'upsert_sprite',
      ],
    );

    const state = await client.callTool({ name: 'get_app_state', arguments: {} });
    assert.equal(state.structuredContent.connected, false);
    assert.equal(state.structuredContent.assetCount, 0);
  } finally {
    await client.close().catch(() => {});
  }
});
