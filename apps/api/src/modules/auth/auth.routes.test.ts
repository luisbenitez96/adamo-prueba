import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import {
  createTestApp,
  TEST_REQUEST_COOLDOWN_MS,
  TEST_TEMP_PASSWORD_TTL_MS,
} from '../../test/create-test-app.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';

const GENERIC_RESPONSE = {
  message: 'Si el correo es válido, en unos minutos recibirás un mensaje con las instrucciones.',
};

describe('rutas de autenticación', () => {
  const database = new TestDatabase();

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

  describe('POST /api/auth/register', () => {
    it('crea la cuenta y envía la contraseña temporal por correo', async () => {
      const { app, emailSender, users, hasher, clock } = createTestApp();

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ana@correo.com' });

      expect(response.status).toBe(202);
      expect(response.body).toEqual(GENERIC_RESPONSE);

      const [email] = emailSender.messagesTo('ana@correo.com');
      expect(emailSender.sent).toHaveLength(1);
      const user = await users.findByEmail('ana@correo.com');
      expect(user).not.toBeNull();
      expect(await hasher.verify(extractTemporaryPassword(email!), user!.tempPasswordHash!)).toBe(
        true,
      );
      expect(user!.tempPasswordExpiresAt).toEqual(
        new Date(clock.now().getTime() + TEST_TEMP_PASSWORD_TTL_MS),
      );
    });

    it('no guarda la contraseña temporal en texto plano', async () => {
      const { app, emailSender, users } = createTestApp();

      await request(app).post('/api/auth/register').send({ email: 'ana@correo.com' });

      const user = await users.findByEmail('ana@correo.com');
      const temporaryPassword = extractTemporaryPassword(emailSender.sent[0]!);
      expect(user!.tempPasswordHash).not.toContain(temporaryPassword);
      expect(user!.passwordHash).toBeNull();
    });

    it('normaliza el correo antes de guardarlo y de escribirle', async () => {
      const { app, emailSender, users } = createTestApp();

      await request(app).post('/api/auth/register').send({ email: '  Ana@Correo.COM ' });

      expect(await users.findByEmail('ana@correo.com')).not.toBeNull();
      expect(emailSender.messagesTo('ana@correo.com')).toHaveLength(1);
    });

    it('con un correo ya registrado responde 409 para mostrarlo bajo el campo', async () => {
      const { app, users } = createTestApp();
      await users.create({ email: 'ana@correo.com', passwordHash: 'hash-actual' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ana@correo.com' });

      expect(response.status).toBe(409);
      expect(response.body.error).toEqual({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Este correo ya está registrado',
      });
    });

    it('con un correo ya registrado no envía correo ni toca sus credenciales', async () => {
      const { app, emailSender, users } = createTestApp();
      await users.create({ email: 'ana@correo.com', passwordHash: 'hash-actual' });

      await request(app).post('/api/auth/register').send({ email: 'ana@correo.com' });

      const user = await users.findByEmail('ana@correo.com');
      expect(emailSender.sent).toHaveLength(0);
      expect(user!.passwordHash).toBe('hash-actual');
      expect(user!.tempPasswordHash).toBeNull();
    });

    it('detecta el correo ya registrado aunque cambien las mayúsculas o los espacios', async () => {
      const { app, users } = createTestApp();
      await users.create({ email: 'ana@correo.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: '  ANA@Correo.com ' });

      expect(response.status).toBe(409);
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it('registrar dos veces el mismo correo deja una sola cuenta y un solo correo enviado', async () => {
      const { app, emailSender } = createTestApp();

      const first = await request(app).post('/api/auth/register').send({ email: 'ana@correo.com' });
      const second = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ana@correo.com' });

      expect(first.status).toBe(202);
      expect(second.status).toBe(409);
      expect(emailSender.sent).toHaveLength(1);
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it.each([
      ['sin cuerpo', undefined],
      ['sin correo', {}],
      ['con un correo mal formado', { email: 'no-es-un-correo' }],
      ['con un correo que no es texto', { email: 123 }],
      ['con un correo vacío', { email: '' }],
      ['con un correo demasiado largo', { email: `${'a'.repeat(250)}@correo.com` }],
    ])('rechaza la solicitud %s', async (_caso, body) => {
      const { app, emailSender } = createTestApp();

      const response = await request(app).post('/api/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Ingresa un correo electrónico válido',
      });
      expect(emailSender.sent).toHaveLength(0);
      expect(await UserModel.countDocuments()).toBe(0);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('guarda una contraseña temporal nueva y la envía por correo', async () => {
      const { app, emailSender, users, hasher, clock } = createTestApp();
      await users.create({ email: 'ana@correo.com', passwordHash: 'hash-actual' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ana@correo.com' });

      expect(response.status).toBe(202);
      expect(response.body).toEqual(GENERIC_RESPONSE);
      expect(emailSender.sent).toHaveLength(1);
      const user = await users.findByEmail('ana@correo.com');
      expect(
        await hasher.verify(
          extractTemporaryPassword(emailSender.sent[0]!),
          user!.tempPasswordHash!,
        ),
      ).toBe(true);
      expect(user!.tempPasswordExpiresAt).toEqual(
        new Date(clock.now().getTime() + TEST_TEMP_PASSWORD_TTL_MS),
      );
    });

    it('no borra la contraseña actual del usuario', async () => {
      const { app, users } = createTestApp();
      await users.create({ email: 'ana@correo.com', passwordHash: 'hash-actual' });

      await request(app).post('/api/auth/forgot-password').send({ email: 'ana@correo.com' });

      expect((await users.findByEmail('ana@correo.com'))!.passwordHash).toBe('hash-actual');
    });

    it('la contraseña temporal nueva reemplaza a la anterior', async () => {
      const { app, emailSender, users, hasher, clock } = createTestApp();
      await users.create({ email: 'ana@correo.com' });

      await request(app).post('/api/auth/forgot-password').send({ email: 'ana@correo.com' });
      clock.advance(TEST_REQUEST_COOLDOWN_MS);
      await request(app).post('/api/auth/forgot-password').send({ email: 'ana@correo.com' });

      const [first, second] = emailSender.sent.map(extractTemporaryPassword);
      const user = await users.findByEmail('ana@correo.com');
      expect(first).not.toBe(second);
      expect(await hasher.verify(first!, user!.tempPasswordHash!)).toBe(false);
      expect(await hasher.verify(second!, user!.tempPasswordHash!)).toBe(true);
    });

    it('con un correo que no existe avisa que no hay cuenta, y no crea ninguna ni envía nada', async () => {
      const { app, emailSender } = createTestApp();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nadie@correo.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No encontramos una cuenta con este correo',
      });
      expect(emailSender.sent).toHaveLength(0);
      expect(await UserModel.countDocuments()).toBe(0);
    });

    it('distingue entre un correo que existe (202) y uno que no (404)', async () => {
      const { app, users } = createTestApp();
      await users.create({ email: 'existente@correo.com' });

      const forExisting = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'existente@correo.com' });
      const forMissing = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nadie@correo.com' });

      expect(forExisting.status).toBe(202);
      expect(forMissing.status).toBe(404);
    });

    it('encuentra la cuenta sin importar mayúsculas ni espacios en el correo', async () => {
      const { app, users, emailSender } = createTestApp();
      await users.create({ email: 'ana@correo.com' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: '  ANA@Correo.com ' });

      expect(response.status).toBe(202);
      expect(emailSender.sent).toHaveLength(1);
    });

    it('no envía otro correo si se repite la solicitud antes del tiempo de espera, y no la trata como cuenta inexistente', async () => {
      const { app, emailSender, users } = createTestApp();
      await users.create({ email: 'ana@correo.com' });

      await request(app).post('/api/auth/forgot-password').send({ email: 'ana@correo.com' });
      const repeated = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ana@correo.com' });

      expect(repeated.status).toBe(202);
      expect(emailSender.sent).toHaveLength(1);
    });

    it('rechaza un correo mal formado', async () => {
      const { app, emailSender } = createTestApp();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'no-es-un-correo' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(emailSender.sent).toHaveLength(0);
    });
  });

  describe('límite de solicitudes por IP', () => {
    it('responde 429 al pasar el límite y no envía más correos', async () => {
      const { app, emailSender } = createTestApp({
        accountRateLimit: { windowMs: 60_000, limit: 2 },
      });

      await request(app).post('/api/auth/register').send({ email: 'uno@correo.com' });
      await request(app).post('/api/auth/forgot-password').send({ email: 'uno@correo.com' });
      const blocked = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dos@correo.com' });

      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(emailSender.messagesTo('dos@correo.com')).toHaveLength(0);
    });

    it('cuenta juntas las solicitudes de register y forgot-password', async () => {
      const { app } = createTestApp({ accountRateLimit: { windowMs: 60_000, limit: 1 } });

      await request(app).post('/api/auth/register').send({ email: 'uno@correo.com' });
      const blocked = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'uno@correo.com' });

      expect(blocked.status).toBe(429);
    });
  });
});
