import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth';
import caseRoutes from './server/routes/cases';
import fileRoutes from './server/routes/files';
import pricingRoutes from './server/routes/pricing';
import paymentRoutes from './server/routes/payments';
import adminRoutes from './server/routes/admin';
import seoRoutes from './server/routes/seo';
import notifRoutes from './server/routes/notifications';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/pricing', pricingRoutes);
  app.use('/api', pricingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/seo', seoRoutes);
  app.use('/api/notifications', notifRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      platform: 'CrownDesk Dental CAD SaaS',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
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
