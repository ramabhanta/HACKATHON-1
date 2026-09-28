import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.find('notifications', n => n.userId === req.user!.id);
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(notifs);
});

notificationRouter.patch('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.findById('notifications', req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  if (notif.userId !== req.user!.id) return res.status(403).json({ error: 'Unauthorized' });

  const updated = db.update('notifications', req.params.id, { isRead: true });
  return res.json(updated);
});

notificationRouter.post('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.find('notifications', n => n.userId === req.user!.id && !n.isRead);
  notifs.forEach(n => {
    db.update('notifications', n.id, { isRead: true });
  });
  return res.json({ success: true, count: notifs.length });
});
