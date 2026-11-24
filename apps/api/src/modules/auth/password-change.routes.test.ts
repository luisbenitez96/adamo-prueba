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
const REUSED_MESSAGE =
  'No puedes reutilizar tu contraseña actual ni ninguna de las últimas 5 anteriores';
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

      expect(me.body).toEqual({ session: { email: EMAIL, requiresPasswordChange: false } });
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

    it('tras cambiarla, la sesión temporal anterior ya no cuenta como sesión al consultar al usuario', async () => {
      const { agent, app, temporaryToken } = await startTemporarySession();
      await agent.post('/api/auth/change-password').send(validBody);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${TEST_COOKIE_NAME}=${temporaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ session: null });
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
        message: REUSED_MESSAGE,
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

    describe('historial de contraseñas', () => {
      async function cycleThrough(passwords: string[]) {
        const context = createTestApp();
        await context.users.create({
          email: EMAIL,
          passwordHash: await context.hasher.hash('Inicial123'),
        });
        for (const password of passwords) {
          await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });
          context.clock.advance(61_000);
          const agent = request.agent(context.app);
          await agent.post('/api/auth/login').send({
            email: EMAIL,
            password: extractTemporaryPassword(context.emailSender.sent.at(-1)!),
          });
          const response = await agent
            .post('/api/auth/change-password')
            .send({ newPassword: password, confirmPassword: password });
          expect(response.status).toBe(200);
        }
        return context;
      }

      async function attemptChange(
        context: Awaited<ReturnType<typeof cycleThrough>>,
        password: string,
      ) {
        await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });
        context.clock.advance(61_000);
        const agent = request.agent(context.app);
        await agent.post('/api/auth/login').send({
          email: EMAIL,
          password: extractTemporaryPassword(context.emailSender.sent.at(-1)!),
        });
        return agent
          .post('/api/auth/change-password')
          .send({ newPassword: password, confirmPassword: password });
      }

      it.each([
        ['la que tenía al empezar', 'Inicial123'],
        ['la penúltima', 'Segunda123'],
        ['la actual', 'Tercera123'],
      ])('rechaza volver a usar %s', async (_name, password) => {
        const context = await cycleThrough(['Primera123', 'Segunda123', 'Tercera123']);

        const response = await attemptChange(context, password);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual({ code: 'PASSWORD_REUSED', message: REUSED_MESSAGE });
      });

      it('recuerda las últimas 5 anteriores: la quinta anterior sigue bloqueada', async () => {
        const context = await cycleThrough([
          'Clave1aaa',
          'Clave2aaa',
          'Clave3aaa',
          'Clave4aaa',
          'Clave5aaa',
        ]);

        expect((await attemptChange(context, 'Inicial123')).status).toBe(400);
        expect((await attemptChange(context, 'Clave1aaa')).status).toBe(400);
      });

      it('la sexta anterior ya se olvida y se puede volver a usar', async () => {
        const context = await cycleThrough([
          'Clave1aaa',
          'Clave2aaa',
          'Clave3aaa',
          'Clave4aaa',
          'Clave5aaa',
          'Clave6aaa',
        ]);

        expect((await attemptChange(context, 'Inicial123')).status).toBe(200);
      });

      it('una contraseña nueva que nunca se usó se acepta', async () => {
        const context = await cycleThrough(['Primera123', 'Segunda123']);

        expect((await attemptChange(context, 'Totalmente9Nueva')).status).toBe(200);
      });

      it('un intento rechazado no altera el historial', async () => {
        const context = await cycleThrough(['Primera123']);
        await attemptChange(context, 'Primera123');
        await attemptChange(context, 'Inicial123');

        const user = await context.users.findByEmail(EMAIL);

        expect(user!.passwordHistory).toHaveLength(1);
      });

      it('el historial guarda solo hashes, nunca las contraseñas en texto plano', async () => {
        const context = await cycleThrough(['Primera123', 'Segunda123']);

        const user = await context.users.findByEmail(EMAIL);

        expect(user!.passwordHistory).toHaveLength(2);
        user!.passwordHistory.forEach((hash) => expect(hash).toMatch(/^\$2[aby]\$/));
      });

      it('el historial de un usuario no afecta a otro', async () => {
        const context = await cycleThrough(['Compartida1']);
        await context.users.create({
          email: 'otra@correo.com',
          passwordHash: await context.hasher.hash('Otra12345'),
        });
        await request(context.app)
          .post('/api/auth/forgot-password')
          .send({ email: 'otra@correo.com' });
        const agent = request.agent(context.app);
        await agent.post('/api/auth/login').send({
          email: 'otra@correo.com',
          password: extractTemporaryPassword(context.emailSender.sent.at(-1)!),
        });

        const response = await agent
          .post('/api/auth/change-password')
          .send({ newPassword: 'Compartida1', confirmPassword: 'Compartida1' });

        expect(response.status).toBe(200);
      });
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
      expect(meBefore.body.session.requiresPasswordChange).toBe(true);
      expect(meAfter.body.session.requiresPasswordChange).toBe(false);
      expect(finalLogin.body).toEqual({ email: EMAIL, requiresPasswordChange: false });
    });
  });
});
