import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createErrorHandler } from '../../shared/http/error-handler.js';
import { JwtTokenService } from '../../shared/security/jwt-token-service.js';
import {
  TEST_COOKIE_NAME,
  TEST_JWT_SECRET,
  TEST_SESSION_SECONDS,
} from '../../test/create-test-app.js';
import { createAuthenticate } from './authenticate.js';
import { requireFullAccess } from './require-full-access.js';
import { SessionCookie } from './session-cookie.js';

describe('requireFullAccess', () => {
  const tokens = new JwtTokenService(TEST_JWT_SECRET, TEST_SESSION_SECONDS);
  const sessionCookie = new SessionCookie({
    name: TEST_COOKIE_NAME,
    secure: false,
    maxAgeMs: TEST_SESSION_SECONDS * 1000,
  });

  function buildProtectedApp() {
    const app = express();
    app.use(cookieParser());
    app.get(
      '/protegido',
      createAuthenticate(tokens, sessionCookie),
      requireFullAccess,
      (_req, res) => {
        res.json({ acceso: 'concedido' });
      },
    );
    app.use(createErrorHandler({ error: () => undefined }));
    return app;
  }

  it('deja pasar una sesión de acceso completo', async () => {
    const token = tokens.sign({ sub: 'user-1', scope: 'full' });

    const response = await request(buildProtectedApp())
      .get('/protegido')
      .set('Cookie', `${TEST_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ acceso: 'concedido' });
  });

  it('bloquea una sesión de contraseña temporal con 403 y no ejecuta la ruta', async () => {
    const token = tokens.sign({ sub: 'user-1', scope: 'password-change' });

    const response = await request(buildProtectedApp())
      .get('/protegido')
      .set('Cookie', `${TEST_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Debes actualizar tu contraseña temporal antes de continuar',
      },
    });
  });

  it('sin sesión responde 401 antes de evaluar el acceso', async () => {
    const response = await request(buildProtectedApp()).get('/protegido');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});
