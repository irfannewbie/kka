import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// Plugin to generate static index.html fallbacks for SPA routes so Vercel, Netlify, and static hosts serve 200 OK immediately
function spaRoutesPlugin(): Plugin {
  return {
    name: 'spa-static-routes',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtml = path.resolve(distDir, 'index.html');
      if (!fs.existsSync(indexHtml)) return;
      const htmlContent = fs.readFileSync(indexHtml, 'utf-8');

      // Generate 404.html fallback
      fs.writeFileSync(path.resolve(distDir, '404.html'), htmlContent);

      // Generate physical folders for known SPA routes
      const routes = [
        'master',
        'master/students',
        'master/grades',
        'master/calculator',
        'master/tasks',
        'master/substitute',
        'master/spreadsheet',
        'master/quiz',
        'master/excel',
        'materi',
        'materi/kelas7',
        'materi/kelas8',
        'kelas7',
        'cek',
        'kuis',
        'pengganti',
        'excel',
        'lab-excel',
      ];

      for (const route of routes) {
        const routeDir = path.resolve(distDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.resolve(routeDir, 'index.html'), htmlContent);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), spaRoutesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
