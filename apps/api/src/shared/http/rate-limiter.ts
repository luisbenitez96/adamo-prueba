import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
}: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos, inténtalo más tarde'));
    },
  });
}
