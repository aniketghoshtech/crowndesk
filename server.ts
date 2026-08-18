import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth';
import caseRoutes from './server/routes/cases';
import fileRoutes from './server/routes/files';
import pricingRoutes, { servicesRouter, offersRouter } from './server/routes/pricing';
import paymentRoutes, { invoicesRouter } from './server/routes/payments';
import adminRoutes from './server/routes/admin';
import seoRoutes from './server/routes/seo';
import notifRoutes from './server/routes/notifications';
import geminiRoutes from './server/routes/gemini';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/pricing', pricingRoutes);
  app.use('/api/services', servicesRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/admin', adminRoutes);
  app.use('/api/seo', seoRoutes);
  app.use('/api/notifications', notifRoutes);
  app.use('/api/gemini', geminiRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      platform: 'CrownDesk Dental CAD SaaS',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Safe JSON 404 for any unmatched /api routes (prevents serving HTML to API requests)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrownDesk Dental CAD Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
