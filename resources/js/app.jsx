import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// 必要な Context のインポート
import { FileManagerProvider } from './Pages/Broadcast/Contexts/FileManagerContext';
import { AppDataProvider } from './Pages/Broadcast/Contexts/AppDataContext';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') return new jsonWorker();
      if (['css','scss','less'].includes(label)) return new cssWorker();
      if (['html','handlebars'].includes(label)) return new htmlWorker();
      if (['typescript','javascript'].includes(label)) return new tsWorker();
      return new editorWorker();
    }
  };

createInertiaApp({
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <React.StrictMode>
        <AppDataProvider>
          <FileManagerProvider>
            <App {...props} />
          </FileManagerProvider>
        </AppDataProvider>
      </React.StrictMode>
    );
  },
  progress: {
    color: '#4B5563',
  },
});
