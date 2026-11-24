import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../../test/create-test-app.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';
import { NOTIFICATION_TEMPLATES } from './notification-templates.js';
import { NotificationModel } from './notification.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';
const NEW_PASSWORD = 'NuevaClave1';

describe('notificaciones que generan los eventos de la cuenta', () => {
  const database = new TestDatabase();

  beforeAll(async () => {
    await database.start();
    await UserModel.init();
    await NotificationModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  async function typesOf(context: ReturnType<typeof createTestApp>, email = EMAIL) {
    const user = await context.users.findByEmail(email);
    const items = await context.notificationRepository.findLatest(user!.id, 50);
    return items.map((item) => item.type).reverse();
  }

  it('crear la cuenta genera la bienvenida', async () => {
    const context = createTestApp();

    await request(context.app).post('/api/auth/register').send({ email: EMAIL });

    expect(await typesOf(context)).toEqual(['account-created']);
  });

  it('la notificación guarda el título y el mensaje de su plantilla', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const user = await context.users.findByEmail(EMAIL);

    const [stored] = await context.notificationRepository.findLatest(user!.id, 1);

    expect(stored).toMatchObject(NOTIFICATION_TEMPLATES['account-created']);
    expect(stored!.read).toBe(false);
    expect(stored!.createdAt).toEqual(context.clock.now());
  });

  it('un registro rechazado (correo ya registrado) no genera notificaciones nuevas', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });

    const response = await request(context.app).post('/api/auth/register').send({ email: EMAIL });

    expect(response.status).toBe(409);
    expect(await typesOf(context)).toEqual(['account-created']);
  });

  it('pedir una contraseña temporal genera la alerta', async () => {
    const context = createTestApp();
    await context.users.create({ email: EMAIL, passwordHash: await context.hasher.hash(PASSWORD) });

    await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });

    expect(await typesOf(context)).toEqual(['temporary-password-requested']);
  });

  it('pedirla dentro del minuto de espera no genera otra alerta (tampoco se envía otro correo)', async () => {
    const context = createTestApp();
    await context.users.create({ email: EMAIL, passwordHash: await context.hasher.hash(PASSWORD) });
    await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });

    await request(context.app).post('/api/auth/forgot-password').send({ email: EMAIL });

    expect(context.emailSender.sent).toHaveLength(1);
    expect(await typesOf(context)).toEqual(['temporary-password-requested']);
  });

  it('pedir la temporal de un correo que no existe no crea nada', async () => {
    const context = createTestApp();

    await request(context.app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nadie@correo.com' });

    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it('entrar con la contraseña temporal genera la alerta', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });

    await request(context.app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });

    expect(await typesOf(context)).toEqual(['account-created', 'temporary-login']);
  });

  it('entrar con la contraseña de siempre no genera nada', async () => {
    const context = createTestApp();
    await context.users.create({ email: EMAIL, passwordHash: await context.hasher.hash(PASSWORD) });

    await request(context.app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });

    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it('un intento de login con contraseña incorrecta no genera nada', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });

    await request(context.app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'Incorrecta1' });

    expect(await typesOf(context)).toEqual(['account-created']);
  });

  it('cambiar la contraseña genera la confirmación', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });

    await agent
      .post('/api/auth/change-password')
      .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });

    expect(await typesOf(context)).toEqual([
      'account-created',
      'temporary-login',
      'password-changed',
    ]);
  });

  it('un cambio rechazado (contraseña repetida) no genera la confirmación', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const temporary = extractTemporaryPassword(context.emailSender.sent[0]!);
    const agent = request.agent(context.app);
    await agent.post('/api/auth/login').send({ email: EMAIL, password: temporary });

    const response = await agent
      .post('/api/auth/change-password')
      .send({ newPassword: temporary, confirmPassword: temporary });

    expect(response.status).toBe(400);
    expect(await typesOf(context)).not.toContain('password-changed');
  });

  it('las notificaciones aparecen en la campana: recorrido completo y se pueden leer', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });
    await agent
      .post('/api/auth/change-password')
      .send({ newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });

    const list = (await agent.get('/api/notifications')).body;
    await agent.post('/api/notifications/read');
    const after = (await agent.get('/api/notifications')).body;

    expect(list.notifications.map((item: { type: string }) => item.type)).toEqual([
      'password-changed',
      'temporary-login',
      'account-created',
    ]);
    expect(list.unreadCount).toBe(3);
    expect(after.unreadCount).toBe(0);
  });
});
