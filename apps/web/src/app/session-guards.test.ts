import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { FULL_SESSION, mockSession, TEMPORARY_SESSION } from '../test/api-handlers';
import { apiError } from '../test/api-handlers';
import { server } from '../test/server';
import { http, HttpResponse } from 'msw';
import { ApiError } from '../lib/http';
import { createSessionGuards } from './session-guards';
import { ROUTES } from './routes';

function newGuards() {
  return createSessionGuards(new QueryClient());
}

function destinationOf(outcome: Response | null): string | null {
  return outcome ? outcome.headers.get('Location') : null;
}

describe('requireGuest (pantallas para quien no ha iniciado sesión)', () => {
  it('sin sesión deja pasar', async () => {
    expect(await newGuards().requireGuest()).toBeNull();
  });

  it('con sesión completa envía al dashboard', async () => {
    mockSession(FULL_SESSION);

    expect(destinationOf(await newGuards().requireGuest())).toBe(ROUTES.dashboard);
  });

  it('con sesión pendiente de cambio de contraseña envía a cambiarla', async () => {
    mockSession(TEMPORARY_SESSION);

    expect(destinationOf(await newGuards().requireGuest())).toBe(ROUTES.changePassword);
  });
});

describe('requirePasswordChange (pantalla de cambiar contraseña)', () => {
  it('sin sesión envía al inicio de sesión', async () => {
    expect(destinationOf(await newGuards().requirePasswordChange())).toBe(ROUTES.login);
  });

  it('con sesión completa envía al dashboard: ya no hay nada que cambiar', async () => {
    mockSession(FULL_SESSION);

    expect(destinationOf(await newGuards().requirePasswordChange())).toBe(ROUTES.dashboard);
  });

  it('con sesión pendiente de cambio deja pasar', async () => {
    mockSession(TEMPORARY_SESSION);

    expect(await newGuards().requirePasswordChange()).toBeNull();
  });
});

describe('requireFullAccess (dashboard)', () => {
  it('sin sesión envía al inicio de sesión', async () => {
    expect(destinationOf(await newGuards().requireFullAccess())).toBe(ROUTES.login);
  });

  it('con sesión pendiente de cambio envía a cambiar la contraseña', async () => {
    mockSession(TEMPORARY_SESSION);

    expect(destinationOf(await newGuards().requireFullAccess())).toBe(ROUTES.changePassword);
  });

  it('con sesión completa deja pasar', async () => {
    mockSession(FULL_SESSION);

    expect(await newGuards().requireFullAccess()).toBeNull();
  });
});

describe('comportamiento común', () => {
  it('las redirecciones son respuestas de redirección (302)', async () => {
    mockSession(FULL_SESSION);

    const outcome = await newGuards().requireGuest();

    expect(outcome?.status).toBe(302);
  });

  it('siempre consulta la sesión actual: no reutiliza un resultado anterior', async () => {
    const guards = newGuards();
    expect(await guards.requireFullAccess()).not.toBeNull();

    mockSession(FULL_SESSION);

    expect(await guards.requireFullAccess()).toBeNull();
  });

  it('si el servidor falla, lo propaga en vez de decidir sin saber', async () => {
    server.use(http.get('*/api/auth/me', () => apiError(500, 'INTERNAL_ERROR', 'x')));

    await expect(newGuards().requireGuest()).rejects.toBeInstanceOf(ApiError);
  });

  it('si no hay conexión, lo propaga', async () => {
    server.use(http.get('*/api/auth/me', () => HttpResponse.error()));

    await expect(newGuards().requireFullAccess()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
