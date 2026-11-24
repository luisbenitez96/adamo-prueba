import { describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/app-error.js';
import { AccountNotFoundError } from './account-not-found-error.js';

describe('AccountNotFoundError', () => {
  it('es un AppError 404 con código y mensaje claros', () => {
    const error = new AccountNotFoundError();

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(error.message).toBe('No encontramos una cuenta con este correo');
  });
});
