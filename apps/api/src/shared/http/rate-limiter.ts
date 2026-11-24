import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

export function createRateLimiter({ windowMs, limit }: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos, inténtalo más tarde'));
    },
  });
}
