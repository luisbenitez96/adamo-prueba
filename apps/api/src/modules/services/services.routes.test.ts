import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SMALL_SERVICE_DEFINITIONS } from '../../test/catalog-fixtures.js';
import { createTestApp, TEST_COOKIE_NAME } from '../../test/create-test-app.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { TestDatabase } from '../../test/test-database.js';
import { generateClient } from '../clients/client-generator.js';
import { ClientModel } from '../clients/client.model.js';
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

  async function temporarySession() {
    const context = createTestApp();
    await request(context.app).post('/api/auth/register').send({ email: EMAIL });
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/login')
      .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });
    return { ...context, agent };
  }

  const seed = ({
    serviceRepository,
    clientRepository,
  }: Awaited<ReturnType<typeof fullAccessSession>>) =>
    seedDefaultServices(serviceRepository, clientRepository, SMALL_SERVICE_DEFINITIONS);

  it('con acceso completo devuelve los 4 servicios en orden, con su descripción y color', async () => {
    const context = await fullAccessSession();
    await seed(context);

    const response = await context.agent.get('/api/services');

    expect(response.status).toBe(200);
    expect(
      response.body.services.map((service: Record<string, unknown>) => ({
        name: service.name,
        description: service.description,
        accentColor: service.accentColor,
      })),
    ).toEqual([
      { name: 'Adamo Pay', description: 'Gestión de pagos', accentColor: '#0e9384' },
      { name: 'Adamo ID', description: 'Verificación de identidad', accentColor: '#0086c9' },
      { name: 'Adamo Risk', description: 'Reducción de riesgos', accentColor: '#7839ee' },
      { name: 'Adamo Sign', description: 'Firma de documentos', accentColor: '#3e4784' },
    ]);
  });

  it('la cantidad de clientes sale de contar los clientes guardados de cada servicio', async () => {
    const context = await fullAccessSession();
    await seed(context);

    const response = await context.agent.get('/api/services');

    expect(
      response.body.services.map((service: { clientsCount: number }) => service.clientsCount),
    ).toEqual([12, 30, 3, 7]);
  });

  it('si se agrega un cliente, el contador sube: el número no está escrito de antemano', async () => {
    const context = await fullAccessSession();
    await seed(context);
    const [pay] = await context.serviceRepository.findAll();
    await context.clientRepository.insertMany([generateClient(pay!.id, 'Adamo Pay', 999)]);

    const response = await context.agent.get('/api/services');

    expect(response.body.services[0].clientsCount).toBe(13);
    expect(response.body.services[1].clientsCount).toBe(30);
  });

  it('un servicio sin clientes muestra cero', async () => {
    const context = await fullAccessSession();
    await context.serviceRepository.insertMissing([
      { name: 'Adamo Vacío', description: 'Sin clientes', accentColor: '#112233', order: 1 },
    ]);

    const response = await context.agent.get('/api/services');

    expect(response.body.services[0].clientsCount).toBe(0);
  });

  it('cada servicio trae solo los campos públicos, sin datos internos de la base', async () => {
    const context = await fullAccessSession();
    await seed(context);

    const response = await context.agent.get('/api/services');

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
    const context = createTestApp();
    await seedDefaultServices(
      context.serviceRepository,
      context.clientRepository,
      SMALL_SERVICE_DEFINITIONS,
    );

    const response = await request(context.app).get('/api/services');

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
    const context = await temporarySession();
    await seedDefaultServices(
      context.serviceRepository,
      context.clientRepository,
      SMALL_SERVICE_DEFINITIONS,
    );

    const response = await context.agent.get('/api/services');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(response.body.services).toBeUndefined();
  });

  it('después de cambiar la contraseña temporal, ya puede ver los servicios', async () => {
    const context = await temporarySession();
    await seedDefaultServices(
      context.serviceRepository,
      context.clientRepository,
      SMALL_SERVICE_DEFINITIONS,
    );
    const before = await context.agent.get('/api/services');

    await context.agent
      .post('/api/auth/change-password')
      .send({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1' });
    const after = await context.agent.get('/api/services');

    expect(before.status).toBe(403);
    expect(after.status).toBe(200);
    expect(after.body.services).toHaveLength(4);
  });

  it('después de cerrar sesión deja de estar disponible', async () => {
    const context = await fullAccessSession();
    await seed(context);
    await context.agent.post('/api/auth/logout');

    const response = await context.agent.get('/api/services');

    expect(response.status).toBe(401);
  });
});
