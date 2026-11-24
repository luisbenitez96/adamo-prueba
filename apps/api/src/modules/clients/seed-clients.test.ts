import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { generateClient } from './client-generator.js';
import { ClientModel } from './client.model.js';
import { MongoClientRepository } from './mongo-client.repository.js';
import { seedClients } from './seed-clients.js';

const SERVICE_ID = new Types.ObjectId().toString();
const OTHER_SERVICE_ID = new Types.ObjectId().toString();
const options = { serviceId: SERVICE_ID, serviceKey: 'Adamo Pay' };

describe('seedClients', () => {
  const database = new TestDatabase();
  const repository = new MongoClientRepository();

  beforeAll(async () => {
    await database.start();
    await ClientModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  it('crea exactamente la cantidad pedida', async () => {
    await seedClients(repository, { ...options, target: 25 });

    expect(await repository.countForService(SERVICE_ID)).toBe(25);
  });

  it('crea cantidades mayores a un lote (más de 1.000) sin perder ninguno', async () => {
    await seedClients(repository, { ...options, target: 2500 });

    expect(await repository.countForService(SERVICE_ID)).toBe(2500);
  });

  it('es idempotente: volver a ejecutarla no duplica nada', async () => {
    await seedClients(repository, { ...options, target: 40 });
    await seedClients(repository, { ...options, target: 40 });

    expect(await repository.countForService(SERVICE_ID)).toBe(40);
  });

  it('completa solo los que faltan cuando se amplía la cantidad', async () => {
    await seedClients(repository, { ...options, target: 10 });

    await seedClients(repository, { ...options, target: 25 });

    expect(await repository.countForService(SERVICE_ID)).toBe(25);
  });

  it('se reanuda tras una carga interrumpida', async () => {
    await repository.insertMany(
      Array.from({ length: 7 }, (_, index) => generateClient(SERVICE_ID, 'Adamo Pay', index)),
    );

    await seedClients(repository, { ...options, target: 20 });

    expect(await repository.countForService(SERVICE_ID)).toBe(20);
  });

  it('repara huecos: si faltan clientes en medio, vuelve a completar el conjunto', async () => {
    await seedClients(repository, { ...options, target: 40 });
    await ClientModel.deleteMany({ email: /\.(5|6|7|20|33)@/ });
    expect(await repository.countForService(SERVICE_ID)).toBeLessThan(40);

    await seedClients(repository, { ...options, target: 40 });

    expect(await repository.countForService(SERVICE_ID)).toBe(40);
  });

  it('no envía nada a la base cuando el conjunto ya está completo', async () => {
    await seedClients(repository, { ...options, target: 30 });
    let inserts = 0;
    const counting = {
      countForService: repository.countForService.bind(repository),
      insertMany: async () => {
        inserts++;
      },
      countByService: repository.countByService.bind(repository),
      findPage: repository.findPage.bind(repository),
    };

    await seedClients(counting, { ...options, target: 30 });

    expect(inserts).toBe(0);
  });

  it('no borra clientes si ya hay más que el objetivo', async () => {
    await seedClients(repository, { ...options, target: 30 });

    await seedClients(repository, { ...options, target: 10 });

    expect(await repository.countForService(SERVICE_ID)).toBe(30);
  });

  it('con objetivo 0 no crea nada', async () => {
    await seedClients(repository, { ...options, target: 0 });

    expect(await repository.countForService(SERVICE_ID)).toBe(0);
  });

  it('cada servicio recibe sus propios clientes', async () => {
    await seedClients(repository, { ...options, target: 15 });
    await seedClients(repository, {
      serviceId: OTHER_SERVICE_ID,
      serviceKey: 'Adamo ID',
      target: 6,
    });

    expect(await repository.countForService(SERVICE_ID)).toBe(15);
    expect(await repository.countForService(OTHER_SERVICE_ID)).toBe(6);
  });

  it('los datos generados son los mismos tras borrar todo y volver a sembrar', async () => {
    await seedClients(repository, { ...options, target: 12 });
    const first = (await repository.findPage({ serviceId: SERVICE_ID, page: 1, pageSize: 50 }))
      .items;
    await database.clear();

    await seedClients(repository, { ...options, target: 12 });
    const second = (await repository.findPage({ serviceId: SERVICE_ID, page: 1, pageSize: 50 }))
      .items;

    expect(second.map((client) => client.email)).toEqual(first.map((client) => client.email));
  });
});
