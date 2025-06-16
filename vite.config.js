import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default async ({ command }) => {
  return defineConfig({
    plugins: [
      laravel({
        input: [
          'resources/css/app.css',
          'resources/js/app.jsx'
        ],
        refresh: true,
      }),
      react(),
    ],
    server: {
      proxy: {
        // CORSを回避するため、APIリクエストをExpressに中継
        '/api': {
          target: 'http://localhost:3000', // Expressサーバー
          changeOrigin: true,
          secure: false,
        }
      }
    },
    optimizeDeps: {
      include: ['monaco-editor/esm/vs/editor/editor.api']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'monaco-editor': ['monaco-editor']
          }
        }
      }
    }
  });
};
