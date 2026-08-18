import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './server/app';
import { tryServeCaseSeoHtml } from './server/middleware/caseSeoMiddleware';

async function startServer() {
  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Safe JSON 404 for any unmatched /api routes (prevents serving HTML to API requests)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Dynamic Case SEO Interceptor for Case URLs & Tracking Pages
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Development Case SEO Middleware
    app.use(async (req, res, next) => {
      // Check if this is a page request that targets a case
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        const isHandled = await tryServeCaseSeoHtml(req, res, async () => {
          const templatePath = path.resolve(process.cwd(), 'index.html');
          const template = fs.readFileSync(templatePath, 'utf-8');
          return await vite.transformIndexHtml(req.originalUrl, template);
        });
        if (isHandled) return;
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', async (req, res) => {
      const isHandled = await tryServeCaseSeoHtml(req, res, () => {
        return fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      });

      if (!isHandled) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrownDesk Dental CAD Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
