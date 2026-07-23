// Standalone smoke client for the Streamable HTTP transport.
// Run against a server started with MIDEAS_MCP_HTTP_PORT set.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.env.MCP_URL || 'http://127.0.0.1:3334/mcp');
const token = process.env.MIDEAS_MCP_TOKEN || '';

const transport = new StreamableHTTPClientTransport(url, {
  requestInit: { headers: { Authorization: `Bearer ${token}` } },
});
const client = new Client({ name: 'mideas-http-smoke', version: '0.0.1' });

await client.connect(transport);
const tools = await client.listTools();
console.log('TOOLS', tools.tools.map(t => t.name).sort().join(','));

const state = await client.callTool({ name: 'get_app_state', arguments: {} });
console.log('STATE', JSON.stringify(state.structuredContent));

await client.close();
console.log('OK');
