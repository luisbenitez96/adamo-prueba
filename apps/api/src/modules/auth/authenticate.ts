import type { Request, RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error.js';
import type { TokenService } from '../../shared/security/token-service.js';
import type { SessionCookie } from './session-cookie.js';

export function createAuthenticate(
  tokens: TokenService,
  sessionCookie: SessionCookie,
): RequestHandler {
  return (req, _res, next) => {
    const token = sessionCookie.read(req);

    if (!token) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar'));
      return;
    }

    try {
      const { sub, scope } = tokens.verify(token);
      req.auth = { userId: sub, scope };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function getAuthContext(req: Request): NonNullable<Request['auth']> {
  if (!req.auth) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar');
  }
  return req.auth;
}
