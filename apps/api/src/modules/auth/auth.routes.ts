import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../shared/http/validate-body.js';
import type { AuthController } from './auth.controller.js';
import { changePasswordSchema, emailRequestSchema, loginSchema } from './auth.schemas.js';
import type { PasswordChangeController } from './password-change.controller.js';
import type { SessionController } from './session.controller.js';

interface AuthRouterDependencies {
  authController: AuthController;
  sessionController: SessionController;
  passwordChangeController: PasswordChangeController;
  authenticate: RequestHandler;
  accountRateLimiter: RequestHandler;
  loginRateLimiter: RequestHandler;
}

export function createAuthRouter({
  authController,
  sessionController,
  passwordChangeController,
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
  router.post(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    passwordChangeController.changePassword,
  );
  router.post('/logout', sessionController.logout);

  return router;
}
