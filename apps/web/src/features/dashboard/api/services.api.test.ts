import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiError } from '../../../test/api-handlers';
import { DESIGN_SERVICES, server } from '../../../test/server';
import { servicesApi } from './services.api';

describe('servicesApi.list', () => {
  it('devuelve la lista de servicios del servidor', async () => {
    expect(await servicesApi.list()).toEqual(DESIGN_SERVICES);
  });

  it('propaga el error si no hay sesión', async () => {
    server.use(http.get('*/api/services', () => apiError(401, 'UNAUTHENTICATED', 'x')));

    await expect(servicesApi.list()).rejects.toMatchObject({ status: 401 });
  });

  it('propaga el error si debe cambiar la contraseña', async () => {
    server.use(http.get('*/api/services', () => apiError(403, 'PASSWORD_CHANGE_REQUIRED', 'x')));

    await expect(servicesApi.list()).rejects.toMatchObject({
      status: 403,
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  });

  it('rechaza una respuesta con formato inesperado', async () => {
    server.use(http.get('*/api/services', () => HttpResponse.json([{ name: 'suelto' }])));

    await expect(servicesApi.list()).rejects.toThrow();
  });

  it('rechaza una respuesta con un color inválido', async () => {
    server.use(
      http.get('*/api/services', () =>
        HttpResponse.json({ services: [{ ...DESIGN_SERVICES[0], accentColor: 'red' }] }),
      ),
    );

    await expect(servicesApi.list()).rejects.toThrow();
  });
});
