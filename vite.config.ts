/**
 * @file Vite configuration file.
 * Configuración correcta y optimizada para tu proyecto Mideas
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const copyPngMsxCharsToolPlugin = () => ({
  name: 'copy-png-msx-chars-tool',
  apply: 'build' as const,
  closeBundle() {
    const sourceDir = path.resolve(__dirname, 'tools/png-msx-chars');
    const targetDir = path.resolve(__dirname, 'dist/tools/png-msx-chars');
    if (!fs.existsSync(sourceDir)) return;

    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.cpSync(sourceDir, targetDir, { recursive: true });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno según el modo (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');
  const mcpBridgePort = env.MIDEAS_MCP_PORT || '3333';
  const mcpBridgeToken = env.MIDEAS_MCP_TOKEN || '';

  return {
    plugins: [react(), copyPngMsxCharsToolPlugin()],

    server: {
      open: true,          // Abre el navegador al iniciar
      port: 3000,
      strictPort: true,    // Falla si el puerto está ocupado
      host: 'localhost',
      proxy: mcpBridgeToken ? {
        '/mcp-api': {
          target: `http://127.0.0.1:${mcpBridgePort}`,
          changeOrigin: false,
          headers: { 'X-Mideas-MCP-Token': mcpBridgeToken },
          rewrite: requestPath => requestPath.replace(/^\/mcp-api/, '/api'),
        },
      } : undefined,
    },

    // Exponer la API key de Gemini al frontend
    define: {
      // Puedes usar solo una, la más clara
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Si también la usas como API_KEY en algún lado, déjala, sino quítala
      // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),  // @/components/... ahora funciona
      },
      // Prefer authored TypeScript over stale CommonJS .js siblings from tsc output.
      extensions: ['.mjs', '.mts', '.ts', '.tsx', '.js', '.jsx', '.json'],
    },

    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@xyflow/react'],
            'msx-utils': [
              './utils/msxGenerator/index.ts'
            ],
            'editors': [
              './components/editors/TileEditor.tsx',
              './components/editors/SpriteEditor.tsx',
              './components/editors/ScreenEditor.tsx',
              './components/editors/WorldMapEditor.tsx'
            ],
            'tools': [
              './components/tools/FileExplorerPanel.tsx',
              './components/tools/PropertiesPanel.tsx',
              './components/tools/PalettePanel.tsx'
            ]
          }
        }
      }
    }
  };
});
