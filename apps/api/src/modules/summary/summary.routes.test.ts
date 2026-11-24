import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SMALL_SERVICE_DEFINITIONS } from '../../test/catalog-fixtures.js';
import { createTestApp, TEST_COOKIE_NAME } from '../../test/create-test-app.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { TestDatabase } from '../../test/test-database.js';
import { generateClient } from '../clients/client-generator.js';
import { ClientModel } from '../clients/client.model.js';
import { seedDefaultServices } from '../services/default-services.js';
import { ServiceModel } from '../services/service.model.js';
import { UserModel } from '../users/user.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';
const SMALL_TOTAL = 12 + 30 + 3 + 7;

describe('GET /api/summary', () => {
  const database = new TestDatabase();

  beforeAll(async () => {
    await database.start();
    await UserModel.init();
    await ServiceModel.init();
    await ClientModel.init();
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

  it('devuelve el total de clientes, de servicios y el desglose por estado', async () => {
    const context = await fullAccessSession();
    await seedDefaultServices(
      context.serviceRepository,
      context.clientRepository,
      SMALL_SERVICE_DEFINITIONS,
    );

    const response = await context.agent.get('/api/summary');

    expect(response.status).toBe(200);
    expect(response.body.summary.totalClients).toBe(SMALL_TOTAL);
    expect(response.body.summary.totalServices).toBe(4);
    const { active, pending, inactive } = response.body.summary.clientsByStatus;
    expect(active + pending + inactive).toBe(SMALL_TOTAL);
  });

  it('el desglose coincide con los estados reales guardados', async () => {
    const context = await fullAccessSession();
    await context.serviceRepository.insertMissing([
      { name: 'Adamo Pay', description: 'x', accentColor: '#112233', order: 1 },
    ]);
    const [service] = await context.serviceRepository.findAll();
    const base = generateClient(service!.id, 'Adamo Pay', 0);
    await context.clientRepository.insertMany([
      { ...base, email: 'a@example.com', status: 'active' },
      { ...base, email: 'b@example.com', status: 'active' },
      { ...base, email: 'c@example.com', status: 'pending' },
      { ...base, email: 'd@example.com', status: 'inactive' },
    ]);

    const response = await context.agent.get('/api/summary');

    expect(response.body.summary).toEqual({
      totalClients: 4,
      totalServices: 1,
      clientsByStatus: { active: 2, pending: 1, inactive: 1 },
    });
  });

  it('cambia cuando se agrega un cliente: se calcula, no está escrito de antemano', async () => {
    const context = await fullAccessSession();
    await seedDefaultServices(
      context.serviceRepository,
      context.clientRepository,
      SMALL_SERVICE_DEFINITIONS,
    );
    const before = (await context.agent.get('/api/summary')).body.summary.totalClients;
    const [pay] = await context.serviceRepository.findAll();
    await context.clientRepository.insertMany([generateClient(pay!.id, 'Adamo Pay', 999)]);

    const after = (await context.agent.get('/api/summary')).body.summary.totalClients;

    expect(after).toBe(before + 1);
  });

  it('sin datos todo está en cero', async () => {
    const { agent } = await fullAccessSession();

    const response = await agent.get('/api/summary');

    expect(response.body.summary).toEqual({
      totalClients: 0,
      totalServices: 0,
      clientsByStatus: { active: 0, pending: 0, inactive: 0 },
    });
  });

  it('solo trae los campos del resumen', async () => {
    const { agent } = await fullAccessSession();

    const response = await agent.get('/api/summary');

    expect(Object.keys(response.body.summary).sort()).toEqual([
      'clientsByStatus',
      'totalClients',
      'totalServices',
    ]);
  });

  it('sin sesión responde 401', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/summary');

    expect(response.status).toBe(401);
    expect(response.body.summary).toBeUndefined();
  });

  it('con un token inválido responde 401', async () => {
    const { app } = createTestApp();

    const response = await request(app)
      .get('/api/summary')
      .set('Cookie', `${TEST_COOKIE_NAME}=basura`);

    expect(response.status).toBe(401);
  });

  it('con la contraseña temporal sin cambiar responde 403 y no entrega datos', async () => {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });

    const response = await agent.get('/api/summary');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(response.body.summary).toBeUndefined();
  });
});
