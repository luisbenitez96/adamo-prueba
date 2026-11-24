import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { healthRouter } from './modules/health/health.routes.js';
import { createErrorHandler, notFoundHandler } from './shared/http/error-handler.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', healthRouter);

  app.use(notFoundHandler);
  app.use(createErrorHandler());

  return app;
}
