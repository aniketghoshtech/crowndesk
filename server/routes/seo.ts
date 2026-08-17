import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';

const router = express.Router();

// GET /api/seo - Global & Page SEO
router.get('/', (req: Request, res: Response): void => {
  res.json({ seo: db.getSEO() });
});

// PUT /api/seo - Admin Update SEO
router.put('/', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Administrative access required.' });
    return;
  }
  const updated = db.updateSEO(req.body);
  db.logAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'SEO_UPDATED',
    details: 'SEO metadata updated from admin panel without code modification.',
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS'
  });
  res.json({ message: 'SEO configuration saved.', seo: updated });
});

export default router;
