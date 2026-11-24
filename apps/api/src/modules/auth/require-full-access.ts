import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error.js';
import { getAuthContext } from './authenticate.js';

export const requireFullAccess: RequestHandler = (req, _res, next) => {
  const { scope } = getAuthContext(req);

  if (scope !== 'full') {
    next(
      new AppError(
        403,
        'PASSWORD_CHANGE_REQUIRED',
        'Debes actualizar tu contraseña temporal antes de continuar',
      ),
    );
    return;
  }

  next();
};
