import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireFullAccess } from '../auth/require-full-access.js';
import type { SummaryController } from './summary.controller.js';

interface SummaryRouterDependencies {
  summaryController: SummaryController;
  authenticate: RequestHandler;
}

export function createSummaryRouter({
  summaryController,
  authenticate,
}: SummaryRouterDependencies): Router {
  const router = Router();

  router.get('/', authenticate, requireFullAccess, summaryController.get);

  return router;
}
