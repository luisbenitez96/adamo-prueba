import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../shared/http/validate-body.js';
import type { AuthController } from './auth.controller.js';
import { emailRequestSchema, loginSchema } from './auth.schemas.js';
import type { SessionController } from './session.controller.js';

interface AuthRouterDependencies {
  authController: AuthController;
  sessionController: SessionController;
  authenticate: RequestHandler;
  accountRateLimiter: RequestHandler;
  loginRateLimiter: RequestHandler;
}

export function createAuthRouter({
  authController,
  sessionController,
  authenticate,
  accountRateLimiter,
  loginRateLimiter,
}: AuthRouterDependencies): Router {
  const router = Router();

  router.post(
    '/register',
    accountRateLimiter,
    validateBody(emailRequestSchema),
    authController.register,
  );
  router.post(
    '/forgot-password',
    accountRateLimiter,
    validateBody(emailRequestSchema),
    authController.forgotPassword,
  );
  router.post('/login', loginRateLimiter, validateBody(loginSchema), sessionController.login);
  router.get('/me', authenticate, sessionController.me);
  router.post('/logout', sessionController.logout);

  return router;
}
