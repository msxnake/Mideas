/**
 * @file Vite configuration file.
 * Configuración correcta y optimizada para tu proyecto Mideas
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno según el modo (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      open: true,          // Abre el navegador al iniciar
      port: 3000,
      strictPort: true,    // Falla si el puerto está ocupado
      host: 'localhost'
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
    },

    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@xyflow/react'],
            'msx-utils': [
              './utils/msxGenerator/index.ts',
              './utils/summaryExtractor.ts'
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
