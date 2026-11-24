import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServiceWithClients } from '../../test/catalog-fixtures.js';
import { createTestApp, TEST_COOKIE_NAME } from '../../test/create-test-app.js';
import { extractTemporaryPassword } from '../../test/in-memory-email-sender.js';
import { TestDatabase } from '../../test/test-database.js';
import { ClientModel } from '../clients/client.model.js';
import { toSearchKey } from '../clients/search-key.js';
import { UserModel } from '../users/user.model.js';
import { ServiceModel } from './service.model.js';

const EMAIL = 'ana@correo.com';
const PASSWORD = 'Secreta123';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

describe('GET /api/services/:serviceId/clients', () => {
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

  async function setup(clientsCount = 45) {
    const context = createTestApp();
    await context.users.create({ email: EMAIL, passwordHash: await context.hasher.hash(PASSWORD) });
    const agent = request.agent(context.app);
    await agent.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    const service = await createServiceWithClients(context, 'Adamo Pay', clientsCount);
    const url = `/api/services/${service.id}/clients`;
    return { ...context, agent, service, url };
  }

  describe('acceso', () => {
    it('sin sesión responde 401', async () => {
      const context = createTestApp();
      const service = await createServiceWithClients(context, 'Adamo Pay', 5);

      const response = await request(context.app).get(`/api/services/${service.id}/clients`);

      expect(response.status).toBe(401);
      expect(response.body.clients).toBeUndefined();
    });

    it('con un token inválido responde 401', async () => {
      const { app } = createTestApp();

      const response = await request(app)
        .get(`/api/services/${UNKNOWN_ID}/clients`)
        .set('Cookie', `${TEST_COOKIE_NAME}=basura`);

      expect(response.status).toBe(401);
    });

    it('con la contraseña temporal sin cambiar responde 403 y no entrega clientes', async () => {
      const context = createTestApp();
      await request(context.app).post('/api/auth/register').send({ email: EMAIL });
      const agent = request.agent(context.app);
      await agent
        .post('/api/auth/login')
        .send({ email: EMAIL, password: extractTemporaryPassword(context.emailSender.sent[0]!) });
      const service = await createServiceWithClients(context, 'Adamo Pay', 5);

      const response = await agent.get(`/api/services/${service.id}/clients`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
      expect(response.body.clients).toBeUndefined();
    });
  });

  describe('servicio inexistente', () => {
    it('un id con formato válido que no existe responde 404', async () => {
      const { agent } = await setup(3);

      const response = await agent.get(`/api/services/${UNKNOWN_ID}/clients`);

      expect(response.status).toBe(404);
      expect(response.body.error).toEqual({
        code: 'SERVICE_NOT_FOUND',
        message: 'Servicio no encontrado',
      });
    });

    it('un id con formato inválido también responde 404, no un error interno', async () => {
      const { agent } = await setup(3);

      const response = await agent.get('/api/services/no-es-un-id/clients');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('paginación', () => {
    it('por defecto devuelve la primera página de 20', async () => {
      const { agent, url } = await setup();

      const response = await agent.get(url);

      expect(response.status).toBe(200);
      expect(response.body.clients).toHaveLength(20);
      expect(response.body.pagination).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
    });

    it('identifica el servicio al que pertenecen los clientes', async () => {
      const { agent, url, service } = await setup(5);

      const response = await agent.get(url);

      expect(response.body.service).toEqual({
        id: service.id,
        name: 'Adamo Pay',
        accentColor: '#0e9384',
      });
    });

    it('la última página trae solo los que sobran', async () => {
      const { agent, url } = await setup();

      const response = await agent.get(`${url}?page=3`);

      expect(response.body.clients).toHaveLength(5);
      expect(response.body.pagination.page).toBe(3);
    });

    it('una página más allá del final viene vacía, con el total correcto', async () => {
      const { agent, url } = await setup();

      const response = await agent.get(`${url}?page=9`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toEqual([]);
      expect(response.body.pagination).toEqual({ page: 9, pageSize: 20, total: 45, totalPages: 3 });
    });

    it('respeta el tamaño de página pedido', async () => {
      const { agent, url } = await setup();

      const response = await agent.get(`${url}?pageSize=10`);

      expect(response.body.clients).toHaveLength(10);
      expect(response.body.pagination).toEqual({ page: 1, pageSize: 10, total: 45, totalPages: 5 });
    });

    it('recorriendo todas las páginas se obtienen los 45 clientes, sin repetir ninguno', async () => {
      const { agent, url } = await setup();

      const pages = await Promise.all([1, 2, 3].map((page) => agent.get(`${url}?page=${page}`)));

      const ids = pages.flatMap((page) =>
        page.body.clients.map((client: { id: string }) => client.id),
      );
      expect(new Set(ids).size).toBe(45);
    });

    it('los clientes vienen ordenados por nombre, sin distinguir tildes', async () => {
      const { agent, url } = await setup();

      const response = await agent.get(`${url}?pageSize=50`);

      const keys = response.body.clients.map((client: { name: string }) =>
        toSearchKey(client.name),
      );
      expect(keys).toEqual([...keys].sort());
    });

    it('un servicio sin clientes responde una página vacía con una sola página', async () => {
      const { agent, url } = await setup(0);

      const response = await agent.get(url);

      expect(response.body.clients).toEqual([]);
      expect(response.body.pagination).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
    });
  });

  describe('contenido de cada cliente', () => {
    it('trae solo los campos públicos, sin datos internos', async () => {
      const { agent, url } = await setup(3);

      const response = await agent.get(url);

      response.body.clients.forEach((client: Record<string, unknown>) => {
        expect(Object.keys(client).sort()).toEqual([
          'city',
          'email',
          'id',
          'name',
          'phone',
          'registeredAt',
          'status',
        ]);
      });
    });

    it('la fecha de registro viaja en formato ISO y el estado es uno de los permitidos', async () => {
      const { agent, url } = await setup(10);

      const response = await agent.get(url);

      response.body.clients.forEach((client: { registeredAt: string; status: string }) => {
        expect(new Date(client.registeredAt).toISOString()).toBe(client.registeredAt);
        expect(['active', 'pending', 'inactive']).toContain(client.status);
      });
    });

    it('no mezcla los clientes de otro servicio', async () => {
      const context = await setup(10);
      const other = await createServiceWithClients(context, 'Adamo ID', 4);

      const response = await context.agent.get(`/api/services/${other.id}/clients`);

      expect(response.body.pagination.total).toBe(4);
      expect(response.body.service.name).toBe('Adamo ID');
    });
  });

  describe('búsqueda', () => {
    it('filtra por una parte del nombre o del correo, y el total refleja solo los resultados', async () => {
      const { agent, url } = await setup(60);
      const all = await agent.get(`${url}?pageSize=100`);
      const target = all.body.clients[0] as { name: string; email: string };
      const fragment = target.name.split(' ')[0]!;

      const response = await agent.get(
        `${url}?search=${encodeURIComponent(fragment)}&pageSize=100`,
      );

      const expected = all.body.clients.filter((client: { name: string; email: string }) =>
        toSearchKey(`${client.name} ${client.email}`).includes(toSearchKey(fragment)),
      );
      expect(response.body.pagination.total).toBe(expected.length);
      expect(response.body.clients.length).toBe(expected.length);
      expect(response.body.clients.length).toBeLessThan(60);
    });

    it('no distingue mayúsculas ni tildes', async () => {
      const { agent, url } = await setup(80);
      const all = await agent.get(`${url}?pageSize=100`);
      const accented = all.body.clients.find((client: { name: string }) =>
        /[áéíóúñ]/i.test(client.name),
      );
      const word = accented.name.split(' ').find((part: string) => /[áéíóúñ]/i.test(part));
      const plain = toSearchKey(word).toUpperCase();

      const response = await agent.get(`${url}?search=${encodeURIComponent(plain)}&pageSize=100`);

      expect(response.body.clients.map((client: { id: string }) => client.id)).toContain(
        accented.id,
      );
    });

    it('sin coincidencias responde una lista vacía, no un error', async () => {
      const { agent, url } = await setup(10);

      const response = await agent.get(`${url}?search=zzzzzz`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(1);
    });

    it('los caracteres especiales no se interpretan como expresión regular', async () => {
      const { agent, url } = await setup(10);

      const response = await agent.get(`${url}?search=${encodeURIComponent('.*')}`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toEqual([]);
    });

    it('una búsqueda vacía equivale a no buscar', async () => {
      const { agent, url } = await setup(10);

      const response = await agent.get(`${url}?search=`);

      expect(response.body.pagination.total).toBe(10);
    });

    it('la búsqueda se combina con la paginación', async () => {
      const { agent, url } = await setup(60);

      const response = await agent.get(`${url}?search=example&pageSize=25&page=3`);

      expect(response.body.pagination).toEqual({ page: 3, pageSize: 25, total: 60, totalPages: 3 });
      expect(response.body.clients).toHaveLength(10);
    });
  });

  describe('validación de parámetros', () => {
    it.each([
      ['page=0', 'La página debe ser un número entero mayor a 0'],
      ['page=-1', 'La página debe ser un número entero mayor a 0'],
      ['page=abc', 'La página debe ser un número entero mayor a 0'],
      ['page=1.5', 'La página debe ser un número entero mayor a 0'],
      ['page=', 'La página debe ser un número entero mayor a 0'],
      ['pageSize=0', 'El tamaño de página debe estar entre 1 y 100'],
      ['pageSize=101', 'El tamaño de página debe estar entre 1 y 100'],
      ['pageSize=abc', 'El tamaño de página debe estar entre 1 y 100'],
      [`search=${'a'.repeat(101)}`, 'La búsqueda no puede tener más de 100 caracteres'],
    ])('rechaza %s con 400 y un mensaje claro', async (query, message) => {
      const { agent, url } = await setup(3);

      const response = await agent.get(`${url}?${query}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({ code: 'VALIDATION_ERROR', message });
    });

    it('acepta el tamaño máximo (100) y el mínimo (1)', async () => {
      const { agent, url } = await setup(3);

      expect((await agent.get(`${url}?pageSize=100`)).status).toBe(200);
      expect((await agent.get(`${url}?pageSize=1`)).status).toBe(200);
    });

    it('un parámetro repetido se rechaza en vez de usarse a medias', async () => {
      const { agent, url } = await setup(3);

      const response = await agent.get(`${url}?page=1&page=2`);

      expect(response.status).toBe(400);
    });
  });
});
