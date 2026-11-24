import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, TEST_COOKIE_NAME } from '../../test/create-test-app.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';
import { NotificationModel } from './notification.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';

describe('/api/notifications', () => {
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

  async function sessionFor(email = EMAIL, context = createTestApp()) {
    const user = await context.users.create({
      email,
      passwordHash: await context.hasher.hash(PASSWORD),
    });
    const agent = request.agent(context.app);
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    return { ...context, agent, user };
  }

  async function addNotifications(
    context: Awaited<ReturnType<typeof sessionFor>>,
    count: number,
    userId = context.user.id,
  ) {
    for (let index = 0; index < count; index++) {
      context.clock.advance(1000);
      await context.notificationRepository.create({
        userId,
        type: 'account-created',
        title: `Aviso ${index + 1}`,
        message: 'Mensaje',
        createdAt: context.clock.now(),
      });
    }
  }

  describe('GET /api/notifications', () => {
    it('devuelve las notificaciones, las más recientes primero, y cuántas hay sin leer', async () => {
      const context = await sessionFor();
      await addNotifications(context, 3);

      const response = await context.agent.get('/api/notifications');

      expect(response.status).toBe(200);
      expect(response.body.notifications.map((item: { title: string }) => item.title)).toEqual([
        'Aviso 3',
        'Aviso 2',
        'Aviso 1',
      ]);
      expect(response.body.unreadCount).toBe(3);
    });

    it('cada notificación trae solo sus campos públicos', async () => {
      const context = await sessionFor();
      await addNotifications(context, 1);

      const response = await context.agent.get('/api/notifications');

      expect(Object.keys(response.body.notifications[0]).sort()).toEqual([
        'createdAt',
        'id',
        'message',
        'read',
        'title',
        'type',
      ]);
      expect(response.body.notifications[0].read).toBe(false);
      expect(new Date(response.body.notifications[0].createdAt).toISOString()).toBe(
        response.body.notifications[0].createdAt,
      );
    });

    it('limita la lista a las 20 más recientes pero cuenta todas las no leídas', async () => {
      const context = await sessionFor();
      await addNotifications(context, 25);

      const response = await context.agent.get('/api/notifications');

      expect(response.body.notifications).toHaveLength(20);
      expect(response.body.unreadCount).toBe(25);
      expect(response.body.notifications[0].title).toBe('Aviso 25');
      expect(response.body.notifications[19].title).toBe('Aviso 6');
    });

    it('sin notificaciones responde vacío y en cero', async () => {
      const context = await sessionFor();
      await NotificationModel.deleteMany({});

      const response = await context.agent.get('/api/notifications');

      expect(response.body).toEqual({ notifications: [], unreadCount: 0 });
    });

    it('cada usuario ve solo las suyas', async () => {
      const context = await sessionFor();
      const other = await context.users.create({ email: 'otra@correo.com' });
      await NotificationModel.deleteMany({});
      await addNotifications(context, 2);
      await addNotifications(context, 4, other.id);

      const response = await context.agent.get('/api/notifications');

      expect(response.body.notifications).toHaveLength(2);
      expect(response.body.unreadCount).toBe(2);
    });
  });

  describe('POST /api/notifications/:id/read', () => {
    it('marca una como leída y baja el contador', async () => {
      const context = await sessionFor();
      await addNotifications(context, 2);
      const { notifications } = (await context.agent.get('/api/notifications')).body;

      const response = await context.agent.post(`/api/notifications/${notifications[0].id}/read`);
      const after = (await context.agent.get('/api/notifications')).body;

      expect(response.status).toBe(204);
      expect(after.unreadCount).toBe(1);
      expect(after.notifications[0].read).toBe(true);
      expect(after.notifications[1].read).toBe(false);
    });

    it('un id que no existe responde 404', async () => {
      const { agent } = await sessionFor();

      const response = await agent.post(`/api/notifications/${new Types.ObjectId()}/read`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notificación no encontrada',
      });
    });

    it('un id con formato inválido también responde 404', async () => {
      const { agent } = await sessionFor();

      const response = await agent.post('/api/notifications/no-es-un-id/read');

      expect(response.status).toBe(404);
    });

    it('no se puede marcar la notificación de otro usuario', async () => {
      const context = await sessionFor();
      const other = await context.users.create({ email: 'otra@correo.com' });
      await NotificationModel.deleteMany({});
      await addNotifications(context, 1, other.id);
      const foreign = await NotificationModel.findOne({});

      const response = await context.agent.post(`/api/notifications/${foreign!.id}/read`);

      expect(response.status).toBe(404);
      expect((await NotificationModel.findById(foreign!.id))!.read).toBe(false);
    });
  });

  describe('POST /api/notifications/read', () => {
    it('marca todas como leídas', async () => {
      const context = await sessionFor();
      await addNotifications(context, 3);

      const response = await context.agent.post('/api/notifications/read');
      const after = (await context.agent.get('/api/notifications')).body;

      expect(response.status).toBe(204);
      expect(after.unreadCount).toBe(0);
      expect(after.notifications.every((item: { read: boolean }) => item.read)).toBe(true);
    });

    it('no toca las de otros usuarios', async () => {
      const context = await sessionFor();
      const other = await context.users.create({ email: 'otra@correo.com' });
      await addNotifications(context, 1, other.id);

      await context.agent.post('/api/notifications/read');

      expect(await context.notificationRepository.countUnread(other.id)).toBe(1);
    });
  });

  describe('acceso', () => {
    it.each([
      ['GET', '/api/notifications'],
      ['POST', '/api/notifications/read'],
      ['POST', `/api/notifications/${new Types.ObjectId()}/read`],
    ])('sin sesión %s %s responde 401', async (method, path) => {
      const { app } = createTestApp();

      const response = await request(app)[method.toLowerCase() as 'get' | 'post'](path);

      expect(response.status).toBe(401);
    });

    it('con un token inválido responde 401', async () => {
      const { app } = createTestApp();

      const response = await request(app)
        .get('/api/notifications')
        .set('Cookie', `${TEST_COOKIE_NAME}=basura`);

      expect(response.status).toBe(401);
    });

    it('con la contraseña temporal sin cambiar responde 403 y no entrega nada', async () => {
      const context = createTestApp();
      await request(context.app).post('/api/auth/register').send({ email: EMAIL });
      const agent = request.agent(context.app);
      await agent
        .post('/api/auth/login')
        .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });

      const list = await agent.get('/api/notifications');
      const readAll = await agent.post('/api/notifications/read');

      expect(list.status).toBe(403);
      expect(list.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
      expect(list.body.notifications).toBeUndefined();
      expect(readAll.status).toBe(403);
    });
  });
});
