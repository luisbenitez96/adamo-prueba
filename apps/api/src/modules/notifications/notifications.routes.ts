import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireFullAccess } from '../auth/require-full-access.js';
import type { NotificationsController } from './notifications.controller.js';

interface NotificationsRouterDependencies {
  notificationsController: NotificationsController;
  authenticate: RequestHandler;
}

export function createNotificationsRouter({
  notificationsController,
  authenticate,
}: NotificationsRouterDependencies): Router {
  const router = Router();

  router.use(authenticate, requireFullAccess);
  router.get('/', notificationsController.list);
  router.post('/read', notificationsController.markAllRead);
  router.post('/:notificationId/read', notificationsController.markRead);

  return router;
}
