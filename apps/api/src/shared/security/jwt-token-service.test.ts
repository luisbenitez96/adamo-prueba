import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { JwtTokenService } from './jwt-token-service.js';

const SECRET = 'un-secreto-de-pruebas-suficientemente-largo';
const ONE_HOUR = 3600;

describe('JwtTokenService', () => {
  const service = new JwtTokenService(SECRET, ONE_HOUR);

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recupera el usuario y el scope del token que firmó', () => {
    const token = service.sign({ sub: 'user-1', scope: 'full' });

    expect(service.verify(token)).toEqual({ sub: 'user-1', scope: 'full' });
  });

  it('conserva el scope password-change', () => {
    const token = service.sign({ sub: 'user-1', scope: 'password-change' });

    expect(service.verify(token).scope).toBe('password-change');
  });

  it('rechaza un token expirado', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const token = service.sign({ sub: 'user-1', scope: 'full' });

    vi.setSystemTime(Date.now() + (ONE_HOUR + 1) * 1000);

    expect(() => service.verify(token)).toThrow(AppError);
  });

  it('acepta el token justo antes de expirar', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const token = service.sign({ sub: 'user-1', scope: 'full' });

    vi.setSystemTime(Date.now() + (ONE_HOUR - 1) * 1000);

    expect(service.verify(token).sub).toBe('user-1');
  });

  it('rechaza un token firmado con otro secreto', () => {
    const foreignToken = new JwtTokenService('otro-secreto-distinto-y-largo-123', ONE_HOUR).sign({
      sub: 'user-1',
      scope: 'full',
    });

    expect(() => service.verify(foreignToken)).toThrow(AppError);
  });

  it('rechaza un token manipulado', () => {
    const token = service.sign({ sub: 'user-1', scope: 'password-change' });
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'user-1', scope: 'full' })).toString(
      'base64url',
    );

    expect(() => service.verify(`${header}.${forgedPayload}.${signature}`)).toThrow(AppError);
  });

  it('rechaza un token sin firma (algoritmo none)', () => {
    const unsignedToken = jwt.sign({ sub: 'user-1', scope: 'full' }, '', { algorithm: 'none' });

    expect(() => service.verify(unsignedToken)).toThrow(AppError);
  });

  it('rechaza un token firmado con otro algoritmo aunque use el mismo secreto', () => {
    const token = jwt.sign({ sub: 'user-1', scope: 'full' }, SECRET, { algorithm: 'HS512' });

    expect(() => service.verify(token)).toThrow(AppError);
  });

  it('rechaza un token con un scope que no existe', () => {
    const token = jwt.sign({ sub: 'user-1', scope: 'admin' }, SECRET);

    expect(() => service.verify(token)).toThrow(AppError);
  });

  it('rechaza un token sin usuario', () => {
    const token = jwt.sign({ scope: 'full' }, SECRET);

    expect(() => service.verify(token)).toThrow(AppError);
  });

  it('rechaza texto que no es un token', () => {
    expect(() => service.verify('esto-no-es-un-jwt')).toThrow(AppError);
  });

  it('el error es un 401 con código INVALID_TOKEN', () => {
    expect.assertions(2);

    try {
      service.verify('esto-no-es-un-jwt');
    } catch (error) {
      expect((error as AppError).statusCode).toBe(401);
      expect((error as AppError).code).toBe('INVALID_TOKEN');
    }
  });
});
