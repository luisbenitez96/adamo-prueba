import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthService } from './modules/auth/auth.service.js';
import { healthRouter } from './modules/health/health.routes.js';
import { createErrorHandler, notFoundHandler } from './shared/http/error-handler.js';
import { createRateLimiter } from './shared/http/rate-limiter.js';
import type { RateLimitOptions } from './shared/http/rate-limiter.js';

export interface AppDependencies {
  authService: AuthService;
  authRateLimit: RateLimitOptions;
  trustProxy: boolean;
}

export function createApp({ authService, authRateLimit, trustProxy }: AppDependencies): Express {
  const app = express();

  app.set('trust proxy', trustProxy ? 1 : false);
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', healthRouter);
  app.use(
    '/api/auth',
    createAuthRouter(new AuthController(authService), createRateLimiter(authRateLimit)),
  );

  app.use(notFoundHandler);
  app.use(createErrorHandler());

  return app;
}
