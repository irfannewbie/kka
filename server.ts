import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiErrorHandler, registerApiRoutes } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Kepercayaan proxy dibutuhkan agar req.ip (rate limiter) akurat di belakang proxy/deploy.
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '5mb' }));

  // Endpoint API (rate limiting + token admin + validasi payload)
  registerApiRoutes(app);

  // Vite middleware untuk development atau static dist untuk production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler global (harus dipasang setelah seluruh route)
  app.use(apiErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
