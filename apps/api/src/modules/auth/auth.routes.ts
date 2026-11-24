import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../shared/http/validate-body.js';
import type { AuthController } from './auth.controller.js';
import { emailRequestSchema } from './auth.schemas.js';

export function createAuthRouter(controller: AuthController, rateLimiter: RequestHandler): Router {
  const router = Router();

  router.post('/register', rateLimiter, validateBody(emailRequestSchema), controller.register);
  router.post(
    '/forgot-password',
    rateLimiter,
    validateBody(emailRequestSchema),
    controller.forgotPassword,
  );

  return router;
}
