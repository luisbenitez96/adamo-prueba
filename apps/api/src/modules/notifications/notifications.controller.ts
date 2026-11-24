import type { RequestHandler } from 'express';
import { getAuthContext } from '../auth/authenticate.js';
import type { NotificationService } from './notification.service.js';

export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  list: RequestHandler = async (req, res) => {
    const { userId } = getAuthContext(req);

    res.json(await this.notificationService.list(userId));
  };

  markRead: RequestHandler = async (req, res) => {
    const { userId } = getAuthContext(req);

    await this.notificationService.markRead(userId, String(req.params.notificationId));
    res.status(204).end();
  };

  markAllRead: RequestHandler = async (req, res) => {
    const { userId } = getAuthContext(req);

    await this.notificationService.markAllRead(userId);
    res.status(204).end();
  };
}
