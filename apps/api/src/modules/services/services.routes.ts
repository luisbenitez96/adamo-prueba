import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireFullAccess } from '../auth/require-full-access.js';
import type { CatalogController } from './catalog.controller.js';

interface ServicesRouterDependencies {
  catalogController: CatalogController;
  authenticate: RequestHandler;
}

export function createServicesRouter({
  catalogController,
  authenticate,
}: ServicesRouterDependencies): Router {
  const router = Router();

  router.get('/', authenticate, requireFullAccess, catalogController.list);

  return router;
}
