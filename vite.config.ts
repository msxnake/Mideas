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
      // Pre-transforma el grafo de arranque mientras el server sube, en lugar
      // de hacerlo cuando el navegador pide cada módulo (primera carga lenta).
      warmup: {
        clientFiles: ['./index.html', './index.tsx', './components/AppUI.tsx'],
      },
    },

    // Exponer la API key de Gemini al frontend
    define: {
      // Puedes usar solo una, la más clara
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Si también la usas como API_KEY en algún lado, dale, sino quítala
      // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),  // @/components/... ahora funciona
      },
      // Prefer authored TypeScript over stale CommonJS .js siblings from tsc output.
      extensions: ['.mjs', '.mts', '.ts', '.tsx', '.js', '.jsx', '.json'],
    },

    optimizeDeps: {
      // Pre-bundlea estas dependencias durante el arranque del server en vez de
      // descubrirlas al cargar la página (cada descubrimiento tardío fuerza una
      // re-optimización que bloquea la primera carga).
      include: [
        'react',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        '@xyflow/react',
        'jszip',
        'lucide-react',
        'twgl.js',
      ],
    },

    build: {
      chunkSizeWarningLimit: 600,
      // Let dynamic editor imports define boundaries. Grouping editor dependencies
      // manually can pull generators and other tools back into the startup graph.
      manifest: true,
    }
  };
});
