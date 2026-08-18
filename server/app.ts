import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import fileRoutes from './routes/files';
import pricingRoutes, { servicesRouter, offersRouter } from './routes/pricing';
import paymentRoutes, { invoicesRouter } from './routes/payments';
import adminRoutes from './routes/admin';
import seoRoutes from './routes/seo';
import notifRoutes from './routes/notifications';
import geminiRoutes from './routes/gemini';

export function createExpressApp() {
  const app = express();

  // Trust proxy for reverse proxies (Nginx, Cloud Run, Vercel, Cloudflare, etc.)
  app.set('trust proxy', 1);

  // Basic Security & Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global Rate Limiter with proxy-safe key generator
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000, // 3000 requests per 15 min window
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || '127.0.0.1';
    },
    validate: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', globalLimiter);

  // Health endpoint
  const healthHandler = (req: express.Request, res: express.Response) => {
    res.json({
      status: 'online',
      platform: 'CrownDesk Dental CAD SaaS',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // Helper to mount routes with and without /api prefix for maximum hosting compatibility (Vercel, Render, Container, etc.)
  const mountRoutes = (prefix: string, router: express.Router | express.RequestHandler) => {
    app.use(`/api/${prefix}`, router);
    app.use(`/${prefix}`, router);
  };

  // Mount API Endpoints
  mountRoutes('auth', authRoutes);
  mountRoutes('cases', caseRoutes);
  mountRoutes('files', fileRoutes);
  mountRoutes('pricing', pricingRoutes);
  mountRoutes('services', servicesRouter);
  mountRoutes('offers', offersRouter);
  mountRoutes('payments', paymentRoutes);
  mountRoutes('invoices', invoicesRouter);
  mountRoutes('admin', adminRoutes);
  mountRoutes('seo', seoRoutes);
  mountRoutes('notifications', notifRoutes);
  mountRoutes('gemini', geminiRoutes);

  // Direct root sitemap
  app.get('/sitemap.xml', (req, res, next) => {
    req.url = '/sitemap.xml';
    seoRoutes(req, res, next);
  });

  // Global Error Handler to guarantee JSON responses and prevent serverless crashes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error captured:', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      status: statusCode,
    });
  });

  return app;
}

export const app = createExpressApp();
