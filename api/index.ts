import { app } from '../server/app';
import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  // Normalize URL in case hosting rewrote to /api/index or stripped path
  if (req.url && req.url.startsWith('/api/index')) {
    req.url = req.url.replace('/api/index', '/api') || '/api/health';
  }
  return app(req, res);
}

