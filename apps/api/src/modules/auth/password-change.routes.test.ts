import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../shared/security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../../shared/security/jwt-token-service.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import {
  createTestApp,
  TEST_COOKIE_NAME,
  TEST_JWT_SECRET,
  TEST_SESSION_SECONDS,
  TEST_TEMP_PASSWORD_TTL_MS,
} from '../../test/create-test-app.js';
import { sessionCookieOf, tokenOf } from '../../test/session-cookie-helpers.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';

const EMAIL = 'ana@correo.com';
const NEW_PASSWORD = 'NuevaClave1';
const POLICY_MESSAGE = 'Al menos 8 caracteres, una mayúscula y un número.';
const MISMATCH_MESSAGE = 'Las contraseñas no coinciden';

describe('POST /api/auth/change-password', () => {
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

  async function startTemporarySession(email = EMAIL) {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email });
    const temporaryPassword = extractTemporaryPassword(context.emailSender.sent.at(-1)!);
    const agent = request.agent(context.app);
    const login = await agent.post('/api/auth/login').send({ email, password: temporaryPassword });

    return { ...context, agent, temporaryPassword, temporaryToken: tokenOf(login) };
  }

  const validBody = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

  describe('con una sesión de contraseña temporal', () => {
    it('cambia la contraseña y responde sin exigir otro cambio', async () => {
      const { agent } = await startTemporarySession();

      const response = await agent.post('/api/auth/change-password').send(validBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });

    it('entrega una cookie nueva con scope full', async () => {
      const { agent, users } = await startTemporarySession();

      const response = await agent.post('/api/auth/change-password').send(validBody);

      const user = await users.findByEmail(EMAIL);
      expect(sessionCookieOf(response)).toContain('HttpOnly');
      expect(tokenService.verify(tokenOf(response))).toEqual({ sub: user!.id, scope: 'full' });
    });

    it('tras cambiarla, la sesión pasa a ser de acceso completo', async () => {
      const { agent } = await startTemporarySession();

      await agent.post('/api/auth/change-password').send(validBody);
      const me = await agent.get('/api/auth/me');

      expect(me.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });

    it('guarda la contraseña nueva como hash, nunca en texto plano', async () => {
      const { agent, users, hasher } = await startTemporarySession();

      await agent.post('/api/auth/change-password').send(validBody);

      const user = await users.findByEmail(EMAIL);
      expect(user!.passwordHash).not.toContain(NEW_PASSWORD);
      expect(await hasher.verify(NEW_PASSWORD, user!.passwordHash!)).toBe(true);
    });

    it('gasta la contraseña temporal: queda borrada y ya no sirve para entrar', async () => {
      const { agent, app, users, temporaryPassword } = await startTemporarySession();

      await agent.post('/api/auth/change-password').send(validBody);

      const user = await users.findByEmail(EMAIL);
      expect(user!.tempPasswordHash).toBeNull();
      expect(user!.tempPasswordExpiresAt).toBeNull();
      const withTemporary = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: temporaryPassword });
      expect(withTemporary.status).toBe(401);
    });

    it('después se puede iniciar sesión con la contraseña nueva', async () => {
      const { agent, app } = await startTemporarySession();
      await agent.post('/api/auth/change-password').send(validBody);

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: NEW_PASSWORD });

      expect(login.status).toBe(200);
      expect(login.body.requiresPasswordChange).toBe(false);
    });

    it('la sesión temporal anterior no sirve para cambiarla otra vez', async () => {
      const { agent, app, temporaryToken } = await startTemporarySession();
      await agent.post('/api/auth/change-password').send(validBody);

      const replay = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', `${TEST_COOKIE_NAME}=${temporaryToken}`)
        .send({ newPassword: 'OtraClave99', confirmPassword: 'OtraClave99' });

      expect(replay.status).toBe(401);
      expect(replay.body.error.code).toBe('TEMPORARY_PASSWORD_EXPIRED');
    });

    it('tras cambiarla, la sesión temporal anterior deja de ser válida también para consultar al usuario', async () => {
      const { agent, app, temporaryToken } = await startTemporarySession();
      await agent.post('/api/auth/change-password').send(validBody);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${TEST_COOKIE_NAME}=${temporaryToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('si la contraseña temporal venció mientras tanto, pide solicitar una nueva', async () => {
      const { agent, clock, users } = await startTemporarySession();
      clock.advance(TEST_TEMP_PASSWORD_TTL_MS + 1000);

      const response = await agent.post('/api/auth/change-password').send(validBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TEMPORARY_PASSWORD_EXPIRED');
      expect((await users.findByEmail(EMAIL))!.passwordHash).toBeNull();
    });

    it('rechaza una contraseña igual a la temporal', async () => {
      const { agent, temporaryPassword } = await startTemporarySession();

      const response = await agent
        .post('/api/auth/change-password')
        .send({ newPassword: temporaryPassword, confirmPassword: temporaryPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({
        code: 'PASSWORD_REUSED',
        message: 'La nueva contraseña debe ser distinta a la actual',
      });
    });

    it('rechaza una contraseña igual a la que el usuario ya tenía', async () => {
      const context = createTestApp();
      const previousPassword = 'Anterior123';
      await context.users.create({
        email: EMAIL,
        passwordHash: await context.hasher.hash(previousPassword),
      });
      await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });
      const agent = request.agent(context.app);
      await agent
        .post('/api/auth/login')
        .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });

      const response = await agent
        .post('/api/auth/change-password')
        .send({ newPassword: previousPassword, confirmPassword: previousPassword });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('PASSWORD_REUSED');
    });

    it.each([
      ['es muy corta', { newPassword: 'Abc1234', confirmPassword: 'Abc1234' }, POLICY_MESSAGE],
      [
        'no tiene mayúscula',
        { newPassword: 'abcdefg1', confirmPassword: 'abcdefg1' },
        POLICY_MESSAGE,
      ],
      ['no tiene número', { newPassword: 'Abcdefgh', confirmPassword: 'Abcdefgh' }, POLICY_MESSAGE],
      [
        'es demasiado larga',
        { newPassword: `A1${'a'.repeat(200)}`, confirmPassword: `A1${'a'.repeat(200)}` },
        POLICY_MESSAGE,
      ],
      ['no es texto', { newPassword: 12345678, confirmPassword: 12345678 }, POLICY_MESSAGE],
      ['no se envía', { confirmPassword: NEW_PASSWORD }, POLICY_MESSAGE],
      [
        'no coincide con la confirmación',
        { newPassword: NEW_PASSWORD, confirmPassword: 'NuevaClave2' },
        MISMATCH_MESSAGE,
      ],
      ['no trae confirmación', { newPassword: NEW_PASSWORD }, MISMATCH_MESSAGE],
    ])('rechaza la contraseña nueva si %s', async (_caso, body, expectedMessage) => {
      const { agent, users } = await startTemporarySession();

      const response = await agent.post('/api/auth/change-password').send(body);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({ code: 'VALIDATION_ERROR', message: expectedMessage });
      expect((await users.findByEmail(EMAIL))!.passwordHash).toBeNull();
    });

    it('rechaza una solicitud sin cuerpo', async () => {
      const { agent } = await startTemporarySession();

      const response = await agent.post('/api/auth/change-password');

      expect(response.status).toBe(400);
    });

    it('tras un intento rechazado, puede volver a intentarlo con datos válidos', async () => {
      const { agent } = await startTemporarySession();

      const rejected = await agent
        .post('/api/auth/change-password')
        .send({ newPassword: 'corta', confirmPassword: 'corta' });
      const accepted = await agent.post('/api/auth/change-password').send(validBody);

      expect(rejected.status).toBe(400);
      expect(accepted.status).toBe(200);
    });

    it('solo cambia la contraseña del usuario de la sesión', async () => {
      const otherHash = await new BcryptPasswordHasher(4).hash('ClaveDeLuis1');
      await UserModel.create({ email: 'luis@correo.com', passwordHash: otherHash });
      const { agent, users } = await startTemporarySession();

      await agent.post('/api/auth/change-password').send(validBody);

      expect((await users.findByEmail('luis@correo.com'))!.passwordHash).toBe(otherHash);
      expect((await users.findByEmail(EMAIL))!.passwordHash).not.toBe(otherHash);
    });
  });

  describe('sin la sesión adecuada', () => {
    it('sin sesión responde 401', async () => {
      const { app } = createTestApp();

      const response = await request(app).post('/api/auth/change-password').send(validBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('con una sesión de acceso completo responde 403 y no cambia nada', async () => {
      const context = createTestApp();
      const currentHash = await context.hasher.hash('Actual12345');
      await context.users.create({ email: EMAIL, passwordHash: currentHash });
      const agent = request.agent(context.app);
      await agent.post('/api/auth/login').send({ email: EMAIL, password: 'Actual12345' });

      const response = await agent.post('/api/auth/change-password').send(validBody);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('PASSWORD_CHANGE_NOT_REQUIRED');
      expect((await context.users.findByEmail(EMAIL))!.passwordHash).toBe(currentHash);
    });

    it('con un token inválido responde 401', async () => {
      const { app } = createTestApp();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', `${TEST_COOKIE_NAME}=basura`)
        .send(validBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('flujo completo', () => {
    it('crear cuenta → entrar con la temporal → cambiar contraseña → entrar con la nueva', async () => {
      const { app, emailSender } = createTestApp();
      await request(app).post('/api/auth/register').send({ email: EMAIL });
      const agent = request.agent(app);

      const temporaryLogin = await agent
        .post('/api/auth/login')
        .send({ email: EMAIL, password: extractTemporaryPassword(emailSender.sent[0]!) });
      const meBefore = await agent.get('/api/auth/me');
      await agent.post('/api/auth/change-password').send(validBody);
      const meAfter = await agent.get('/api/auth/me');
      await agent.post('/api/auth/logout');
      const finalLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: EMAIL, password: NEW_PASSWORD });

      expect(temporaryLogin.body.requiresPasswordChange).toBe(true);
      expect(meBefore.body.requiresPasswordChange).toBe(true);
      expect(meAfter.body.requiresPasswordChange).toBe(false);
      expect(finalLogin.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });
  });
});
