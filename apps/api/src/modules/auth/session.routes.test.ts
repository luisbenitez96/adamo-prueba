import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JwtTokenService } from '../../shared/security/jwt-token-service.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import {
  createTestApp,
  TEST_COOKIE_NAME,
  TEST_JWT_SECRET,
  TEST_SESSION_SECONDS,
  TEST_TEMP_PASSWORD_TTL_MS,
} from '../../test/create-test-app.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';

function sessionCookieOf(response: Response): string | undefined {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith(`${TEST_COOKIE_NAME}=`));
}

function tokenOf(response: Response): string {
  const cookie = sessionCookieOf(response);
  const token = cookie?.match(new RegExp(`^${TEST_COOKIE_NAME}=([^;]+)`))?.[1];
  if (!token) {
    throw new Error('La respuesta no trae cookie de sesión');
  }
  return token;
}

describe('rutas de sesión', () => {
  const database = new TestDatabase();
  const tokenService = new JwtTokenService(TEST_JWT_SECRET, TEST_SESSION_SECONDS);

  beforeAll(async () => {
    await database.start();
    await UserModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  async function createAppWithUser(options: Parameters<typeof createTestApp>[0] = {}) {
    const context = createTestApp(options);
    const user = await context.users.create({
      email: EMAIL,
      passwordHash: await context.hasher.hash(PASSWORD),
    });
    return { ...context, user };
  }

  describe('POST /api/auth/login', () => {
    it('con su contraseña responde 200 sin exigir cambio de contraseña', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });

    it('entrega un token con el usuario y el scope full en una cookie segura', async () => {
      const { app, user } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      const cookie = sessionCookieOf(response)!;
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain(`Max-Age=${TEST_SESSION_SECONDS}`);
      expect(cookie).not.toContain('Secure');
      expect(tokenService.verify(tokenOf(response))).toEqual({ sub: user.id, scope: 'full' });
    });

    it('marca la cookie como Secure cuando está configurado', async () => {
      const { app } = await createAppWithUser({ cookieSecure: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(sessionCookieOf(response)).toContain('Secure');
    });

    it('no devuelve el token ni ningún hash en el cuerpo de la respuesta', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(JSON.stringify(response.body)).not.toContain(tokenOf(response));
      expect(JSON.stringify(response.body)).not.toMatch(/hash|token|\$2/i);
    });

    it('con la contraseña temporal que llegó por correo exige cambiar la contraseña', async () => {
      const { app, emailSender } = createTestApp();

      await request(app).post('/api/auth/register').send({ email: EMAIL });
      const temporaryPassword = extractTemporaryPassword(emailSender.sent[0]!);
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: temporaryPassword });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ email: EMAIL, requiresPasswordChange: true });
      expect(tokenService.verify(tokenOf(response)).scope).toBe('password-change');
    });

    it('la contraseña temporal sirve hasta justo antes de vencer', async () => {
      const { app, emailSender, clock } = createTestApp();
      await request(app).post('/api/auth/register').send({ email: EMAIL });
      const temporaryPassword = extractTemporaryPassword(emailSender.sent[0]!);

      clock.advance(TEST_TEMP_PASSWORD_TTL_MS - 1000);
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: temporaryPassword });

      expect(response.status).toBe(200);
    });

    it('la contraseña temporal vencida se rechaza', async () => {
      const { app, emailSender, clock } = createTestApp();
      await request(app).post('/api/auth/register').send({ email: EMAIL });
      const temporaryPassword = extractTemporaryPassword(emailSender.sent[0]!);

      clock.advance(TEST_TEMP_PASSWORD_TTL_MS + 1000);
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: temporaryPassword });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(sessionCookieOf(response)).toBeUndefined();
    });

    it('tras pedir una temporal, la contraseña propia sigue entrando como full y la temporal pide cambio', async () => {
      const { app, emailSender } = await createAppWithUser();
      await request(app).post('/api/auth/forgot-password').send({ email: EMAIL });
      const temporaryPassword = extractTemporaryPassword(emailSender.sent[0]!);

      const withOwn = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });
      const withTemporary = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: temporaryPassword });

      expect(withOwn.body.requiresPasswordChange).toBe(false);
      expect(tokenService.verify(tokenOf(withOwn)).scope).toBe('full');
      expect(withTemporary.body.requiresPasswordChange).toBe(true);
      expect(tokenService.verify(tokenOf(withTemporary)).scope).toBe('password-change');
    });

    it('con una contraseña incorrecta responde 401 y no entrega cookie', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: 'OtraClave123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });
      expect(sessionCookieOf(response)).toBeUndefined();
    });

    it('distingue mayúsculas y minúsculas en la contraseña', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD.toLowerCase() });

      expect(response.status).toBe(401);
    });

    it('responde igual con un correo que no existe que con una contraseña incorrecta', async () => {
      const { app } = await createAppWithUser();

      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: 'OtraClave123' });
      const unknownEmail = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nadie@correo.com', password: PASSWORD });

      expect(unknownEmail.status).toBe(wrongPassword.status);
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it('rechaza a un usuario que todavía no tiene ninguna contraseña válida', async () => {
      const { app, users } = createTestApp();
      await users.create({ email: EMAIL });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('acepta el correo sin importar mayúsculas ni espacios', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: '  ANA@Correo.com ', password: PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(EMAIL);
    });

    it.each([
      ['sin cuerpo', undefined],
      ['sin correo', { password: PASSWORD }],
      ['con un correo mal formado', { email: 'no-es-un-correo', password: PASSWORD }],
      ['sin contraseña', { email: EMAIL }],
      ['con la contraseña vacía', { email: EMAIL, password: '' }],
      ['con una contraseña que no es texto', { email: EMAIL, password: 12345 }],
      ['con una contraseña demasiado larga', { email: EMAIL, password: 'a'.repeat(200) }],
    ])('rechaza la solicitud %s con 400', async (_caso, body) => {
      const { app } = await createAppWithUser();

      const response = await request(app).post('/api/auth/login').send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(sessionCookieOf(response)).toBeUndefined();
    });

    it('bloquea con 429 tras demasiados intentos fallidos, aunque luego llegue la contraseña correcta', async () => {
      const { app } = await createAppWithUser({
        loginRateLimit: { windowMs: 60_000, limit: 2, skipSuccessfulRequests: true },
      });

      await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'mala-1' });
      await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'mala-2' });
      const blocked = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(sessionCookieOf(blocked)).toBeUndefined();
    });

    it('los inicios de sesión correctos no cuentan para el límite', async () => {
      const { app } = await createAppWithUser({
        loginRateLimit: { windowMs: 60_000, limit: 2, skipSuccessfulRequests: true },
      });

      const statuses: number[] = [];
      for (let attempt = 0; attempt < 4; attempt++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: EMAIL, password: PASSWORD });
        statuses.push(response.status);
      }

      expect(statuses).toEqual([200, 200, 200, 200]);
    });
  });

  describe('GET /api/auth/me', () => {
    it('sin cookie responde 401 UNAUTHENTICATED', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('con una cookie que no es un token responde 401 INVALID_TOKEN', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${TEST_COOKIE_NAME}=basura`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('con un token vencido responde 401', async () => {
      const { app, user } = await createAppWithUser();
      const expiredToken = new JwtTokenService(TEST_JWT_SECRET, -60).sign({
        sub: user.id,
        scope: 'full',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${TEST_COOKIE_NAME}=${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('con un token firmado con otro secreto responde 401', async () => {
      const { app, user } = await createAppWithUser();
      const forgedToken = new JwtTokenService('otro-secreto-distinto-y-bastante-largo', 3600).sign({
        sub: user.id,
        scope: 'full',
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${TEST_COOKIE_NAME}=${forgedToken}`);

      expect(response.status).toBe(401);
    });

    it('no acepta el token en la cabecera Authorization, solo en la cookie', async () => {
      const { app, user } = await createAppWithUser();
      const token = tokenService.sign({ sub: user.id, scope: 'full' });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('tras iniciar sesión devuelve el usuario de la sesión', async () => {
      const { app } = await createAppWithUser();
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });

    it('con una sesión de contraseña temporal indica que falta cambiarla', async () => {
      const { app, emailSender } = createTestApp();
      await request(app).post('/api/auth/register').send({ email: EMAIL });
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({ email: EMAIL, password: extractTemporaryPassword(emailSender.sent[0]!) });

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ email: EMAIL, requiresPasswordChange: true });
    });

    it('si el usuario ya no existe, la sesión deja de ser válida', async () => {
      const { app } = await createAppWithUser();
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
      await UserModel.deleteMany({});

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('responde 204 y vence la cookie de sesión', async () => {
      const { app } = await createAppWithUser();
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });

      const response = await agent.post('/api/auth/logout');

      const cookie = sessionCookieOf(response)!;
      expect(response.status).toBe(204);
      expect(cookie).toMatch(new RegExp(`^${TEST_COOKIE_NAME}=;`));
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
      expect(cookie).toContain('HttpOnly');
    });

    it('después de cerrar sesión ya no se puede consultar al usuario', async () => {
      const { app } = await createAppWithUser();
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
      await agent.post('/api/auth/logout');

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('sin sesión también responde 204', async () => {
      const { app } = await createAppWithUser();

      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(204);
    });
  });
});
