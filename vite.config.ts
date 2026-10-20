import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * Plugin untuk menghasilkan berkas index.html fisik untuk setiap rute SPA
 * agar Vercel, Netlify, dan static host lain menjawab 200 OK langsung
 * tanpa bergantung pada rewrite rule.
 *
 * Daftar rute = gabungan rute React Router (src/routes/navigation.ts)
 * termasuk seluruh alias URL lama.
 */
function spaRoutesPlugin(): Plugin {
  return {
    name: 'spa-static-routes',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtml = path.resolve(distDir, 'index.html');
      if (!fs.existsSync(indexHtml)) return;
      const htmlContent = fs.readFileSync(indexHtml, 'utf-8');

      // 404.html dari public/404.html dipertahankan bila sudah ada
      const notFoundHtml = path.resolve(distDir, '404.html');
      if (!fs.existsSync(notFoundHtml)) {
        fs.writeFileSync(notFoundHtml, htmlContent);
      }

      const routes = [
        // Portal publik & siswa
        'cek',
        'check',
        'login-siswa',
        'kelas7',
        'kelas-7',
        'cek-kelas7',
        'cek7',
        'kuis',
        'quiz',
        'ujian',
        'pengganti',
        'tugas-pengganti',
        'pengganti-kka2',
        'kka2',
        // Arsip Karya Siswa (showcase lama; materi kini menjadi beranda "/")
        'arsip-karya',
        'showcase',
        // Panel master
        'master',
        'master/students',
        'students',
        'master/grades',
        'grades',
        'master/calculator',
        'calculator',
        'kalkulator',
        'master/tasks',
        'tasks',
        'master/substitute',
        'master/pengganti',
        'master/tugas-pengganti',
        'substitute',
        'master/spreadsheet',
        'spreadsheet',
        'master/quiz',
        'master/kuis',
        'master/excel',
        'master/lab-excel',
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
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/data/**'] },
    },
  };
});
