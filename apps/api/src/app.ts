import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthService } from './modules/auth/auth.service.js';
import { createAuthenticate } from './modules/auth/authenticate.js';
import { PasswordChangeController } from './modules/auth/password-change.controller.js';
import type { PasswordChangeService } from './modules/auth/password-change.service.js';
import { SessionController } from './modules/auth/session.controller.js';
import type { SessionCookie } from './modules/auth/session-cookie.js';
import type { SessionService } from './modules/auth/session.service.js';
import { healthRouter } from './modules/health/health.routes.js';
import { createErrorHandler, notFoundHandler } from './shared/http/error-handler.js';
import { createRateLimiter } from './shared/http/rate-limiter.js';
import type { RateLimitOptions } from './shared/http/rate-limiter.js';
import type { TokenService } from './shared/security/token-service.js';

export interface AppDependencies {
  authService: AuthService;
  sessionService: SessionService;
  passwordChangeService: PasswordChangeService;
  tokenService: TokenService;
  sessionCookie: SessionCookie;
  accountRateLimit: RateLimitOptions;
  loginRateLimit: RateLimitOptions;
  trustProxy: boolean;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  app.set('trust proxy', dependencies.trustProxy ? 1 : false);
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.use('/api', healthRouter);
  app.use(
    '/api/auth',
    createAuthRouter({
      authController: new AuthController(dependencies.authService),
      sessionController: new SessionController(
        dependencies.sessionService,
        dependencies.sessionCookie,
      ),
      passwordChangeController: new PasswordChangeController(
        dependencies.passwordChangeService,
        dependencies.sessionCookie,
      ),
      authenticate: createAuthenticate(dependencies.tokenService, dependencies.sessionCookie),
      accountRateLimiter: createRateLimiter(dependencies.accountRateLimit),
      loginRateLimiter: createRateLimiter(dependencies.loginRateLimit),
    }),
  );

  app.use(notFoundHandler);
  app.use(createErrorHandler());

  return app;
}
