import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';

const router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const raw = db.getRawData();
  const userNotifs = raw.notifications.filter(n => n.userId === user.id);
  res.json({ notifications: userNotifs });
});

router.patch('/:id/read', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const raw = db.getRawData();
  const notif = raw.notifications.find(n => n.id === req.params.id && n.userId === user.id);
  if (notif) {
    notif.read = true;
    db.save();
  }
  res.json({ message: 'Marked as read.' });
});

router.patch('/read-all', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const raw = db.getRawData();
  raw.notifications.forEach(n => {
    if (n.userId === user.id) n.read = true;
  });
  db.save();
  res.json({ message: 'All notifications marked as read.' });
});

export default router;
