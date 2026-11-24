import { http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../lib/http';
import { apiError, FULL_SESSION, mockPost, TEMPORARY_SESSION } from '../../../test/api-handlers';
import { server } from '../../../test/server';
import { authApi } from './auth.api';

describe('authApi.me', () => {
  it('devuelve la sesión cuando hay un usuario con sesión iniciada', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => HttpResponse.json(TEMPORARY_SESSION)));

    expect(await authApi.me()).toEqual(TEMPORARY_SESSION);
  });

  it('devuelve null cuando no hay sesión (401), sin tratarlo como error', async () => {
    expect(await authApi.me()).toBeNull();
  });

  it('un 403 u otro error de la petición sí se propaga', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => apiError(403, 'FORBIDDEN', 'Acceso denegado')));

    await expect(authApi.me()).rejects.toMatchObject({ status: 403 });
  });

  it('un error del servidor se propaga para poder avisar al usuario', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => apiError(500, 'INTERNAL_ERROR', 'x')));

    await expect(authApi.me()).rejects.toBeInstanceOf(ApiError);
  });

  it('si no hay conexión se propaga como error de red', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => HttpResponse.error()));

    await expect(authApi.me()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('una respuesta con formato inesperado se rechaza', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => HttpResponse.json({ email: 'ana@correo.com' })));

    await expect(authApi.me()).rejects.toThrow();
  });
});

describe('authApi.changePassword', () => {
  const values = { newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1' };

  it('envía las dos contraseñas y devuelve la sesión actualizada', async () => {
    const received = mockPost('/api/auth/change-password', () => HttpResponse.json(FULL_SESSION));

    expect(await authApi.changePassword(values)).toEqual(FULL_SESSION);
    expect(received).toEqual([values]);
  });

  it('propaga el error del servidor con su código', async () => {
    mockPost('/api/auth/change-password', () =>
      apiError(400, 'PASSWORD_REUSED', 'La nueva contraseña debe ser distinta a la actual'),
    );

    await expect(authApi.changePassword(values)).rejects.toMatchObject({
      status: 400,
      code: 'PASSWORD_REUSED',
    });
  });

  it('rechaza una respuesta con formato inesperado', async () => {
    mockPost('/api/auth/change-password', () => HttpResponse.json({ ok: true }));

    await expect(authApi.changePassword(values)).rejects.toThrow();
  });
});
