import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/http';
import { isSessionError } from './session-error';

describe('isSessionError', () => {
  it.each([401, 403])('es un error de sesión cuando la API responde %i', (status) => {
    expect(isSessionError(new ApiError(status, 'X', 'x'))).toBe(true);
  });

  it.each([400, 404, 500, 0])('no lo es cuando responde %i', (status) => {
    expect(isSessionError(new ApiError(status, 'X', 'x'))).toBe(false);
  });

  it('no lo es con errores ajenos a la API ni sin error', () => {
    expect(isSessionError(new Error('x'))).toBe(false);
    expect(isSessionError(null)).toBe(false);
    expect(isSessionError(undefined)).toBe(false);
  });
});
