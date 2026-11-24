import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { createTestApp, TEST_COOKIE_NAME } from '../../test/create-test-app.js';
import { TestDatabase } from '../../test/test-database.js';
import { UserModel } from '../users/user.model.js';
import { seedDefaultServices } from './default-services.js';
import { ServiceModel } from './service.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';

describe('GET /api/services', () => {
  const database = new TestDatabase();

  beforeAll(async () => {
    await database.start();
    await UserModel.init();
    await ServiceModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  async function fullAccessSession() {
    const context = createTestApp();
    await context.users.create({ email: EMAIL, passwordHash: await context.hasher.hash(PASSWORD) });
    const agent = request.agent(context.app);
    await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    return { ...context, agent };
  }

  async function temporarySession() {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });
    return { ...context, agent };
  }

  it('con acceso completo devuelve los 4 servicios del diseño, en orden', async () => {
    const { agent, serviceRepository } = await fullAccessSession();
    await seedDefaultServices(serviceRepository);

    const response = await agent.get('/api/services');

    expect(response.status).toBe(200);
    expect(response.body.services).toEqual([
      expect.objectContaining({
        name: 'Adamo Pay',
        description: 'Gestión de pagos',
        clientsCount: 3827,
        accentColor: '#0e9384',
      }),
      expect.objectContaining({
        name: 'Adamo ID',
        description: 'Verificación de identidad',
        clientsCount: 9411,
        accentColor: '#0086c9',
      }),
      expect.objectContaining({
        name: 'Adamo Risk',
        description: 'Reducción de riesgos',
        clientsCount: 793,
        accentColor: '#7839ee',
      }),
      expect.objectContaining({
        name: 'Adamo Sign',
        description: 'Firma de documentos',
        clientsCount: 2738,
        accentColor: '#3e4784',
      }),
    ]);
  });

  it('cada servicio trae solo los campos públicos, sin datos internos de la base', async () => {
    const { agent, serviceRepository } = await fullAccessSession();
    await seedDefaultServices(serviceRepository);

    const response = await agent.get('/api/services');

    response.body.services.forEach((service: Record<string, unknown>) => {
      expect(Object.keys(service).sort()).toEqual([
        'accentColor',
        'clientsCount',
        'description',
        'id',
        'name',
      ]);
    });
  });

  it('responde una lista vacía si todavía no hay servicios', async () => {
    const { agent } = await fullAccessSession();

    const response = await agent.get('/api/services');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ services: [] });
  });

  it('sin sesión responde 401', async () => {
    const { app, serviceRepository } = createTestApp();
    await seedDefaultServices(serviceRepository);

    const response = await request(app).get('/api/services');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(response.body.services).toBeUndefined();
  });

  it('con un token inválido responde 401', async () => {
    const { app } = createTestApp();

    const response = await request(app)
      .get('/api/services')
      .set('Cookie', `${TEST_COOKIE_NAME}=basura`);

    expect(response.status).toBe(401);
  });

  it('con la contraseña temporal sin cambiar responde 403 y no entrega datos', async () => {
    const { agent, serviceRepository } = await temporarySession();
    await seedDefaultServices(serviceRepository);

    const response = await agent.get('/api/services');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(response.body.services).toBeUndefined();
  });

  it('después de cambiar la contraseña temporal, ya puede ver los servicios', async () => {
    const { agent, serviceRepository } = await temporarySession();
    await seedDefaultServices(serviceRepository);
    const before = await agent.get('/api/services');

    await agent
      .post('/api/auth/change-password')
      .send({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1' });
    const after = await agent.get('/api/services');

    expect(before.status).toBe(403);
    expect(after.status).toBe(200);
    expect(after.body.services).toHaveLength(4);
  });

  it('después de cerrar sesión deja de estar disponible', async () => {
    const { agent, serviceRepository } = await fullAccessSession();
    await seedDefaultServices(serviceRepository);
    await agent.post('/api/auth/logout');

    const response = await agent.get('/api/services');

    expect(response.status).toBe(401);
  });
});
