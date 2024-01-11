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
      react({
        input: [
          'resources/css/app.css',
          'resources/js/app.jsx',
          'resources/js/Broadcast/NewRoom.jsx'
        ],
        refresh: true,
      }),
    ],
  });
};
