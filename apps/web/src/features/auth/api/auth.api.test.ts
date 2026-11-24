import { http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../lib/http';
import { apiError, FULL_SESSION, mockPost, TEMPORARY_SESSION } from '../../../test/api-handlers';
import { server } from '../../../test/server';
import { authApi } from './auth.api';

describe('authApi.me', () => {
  it('devuelve la sesión cuando hay un usuario con sesión iniciada', async () => {
    server.use(
      mswHttp.get('*/api/auth/me', () => HttpResponse.json({ session: TEMPORARY_SESSION })),
    );

    expect(await authApi.me()).toEqual(TEMPORARY_SESSION);
  });

  it('devuelve null cuando no hay sesión', async () => {
    expect(await authApi.me()).toBeNull();
  });

  it('un 401 inesperado se propaga como error: ya no significa "sin sesión"', async () => {
    server.use(mswHttp.get('*/api/auth/me', () => apiError(401, 'UNAUTHENTICATED', 'x')));

    await expect(authApi.me()).rejects.toMatchObject({ status: 401 });
  });

  it('un 403 u otro error de la petición se propaga', async () => {
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

  it.each([
    ['sin el campo session', {}],
    [
      'con la sesión en formato antiguo (sin envoltorio)',
      { email: 'ana@correo.com', requiresPasswordChange: false },
    ],
    ['con una sesión incompleta', { session: { email: 'ana@correo.com' } }],
  ])('una respuesta %s se rechaza', async (_caso, body) => {
    server.use(mswHttp.get('*/api/auth/me', () => HttpResponse.json(body)));

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
      apiError(
        400,
        'PASSWORD_REUSED',
        'No puedes reutilizar tu contraseña actual ni ninguna de las últimas 5 anteriores',
      ),
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
