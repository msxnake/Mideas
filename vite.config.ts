/**
 * @file Vite configuration file.
 * This file configures the Vite development server and build process.
 * It sets up environment variables and path aliases.
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Separate vendor libraries
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['@xyflow/react'],
              // MSX utilities and generators
              'msx-utils': ['./utils/msxGenerator/index.ts', './utils/summaryExtractor.ts'],
              // Editors chunk
              'editors': [
                './components/editors/TileEditor.tsx',
                './components/editors/SpriteEditor.tsx',
                './components/editors/ScreenEditor.tsx',
                './components/editors/WorldMapEditor.tsx'
              ],
              // Tools and modals
              'tools': [
                './components/tools/FileExplorerPanel.tsx',
                './components/tools/PropertiesPanel.tsx',
                './components/tools/PalettePanel.tsx'
              ]
            }
          }
        },
        chunkSizeWarningLimit: 600
      }
    };
});
