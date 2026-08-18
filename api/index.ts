import { app } from '../server/app';
import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  try {
    if (req.url && req.url.startsWith('/api/index')) {
      req.url = req.url.replace('/api/index', '/api') || '/api/health';
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless Handler Error:', err);
    res.status(500).json({ error: err?.message || 'Serverless Handler Exception' });
  }
}