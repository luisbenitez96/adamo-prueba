import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SMALL_SERVICE_DEFINITIONS } from '../../test/catalog-fixtures.js';
import { TestDatabase } from '../../test/test-database.js';
import { ClientModel } from '../clients/client.model.js';
import { MongoClientRepository } from '../clients/mongo-client.repository.js';
import { DEFAULT_SERVICE_DEFINITIONS, seedDefaultServices } from './default-services.js';
import { MongoServiceRepository } from './mongo-service.repository.js';
import { ServiceModel } from './service.model.js';

describe('servicios por defecto', () => {
  it('coinciden con los del diseño, en el mismo orden', () => {
    expect(
      DEFAULT_SERVICE_DEFINITIONS.map(({ name, description, clientsToSeed, accentColor }) => ({
        name,
        description,
        clientsToSeed,
        accentColor,
      })),
    ).toEqual([
      {
        name: 'Adamo Pay',
        description: 'Gestión de pagos',
        clientsToSeed: 3827,
        accentColor: '#0e9384',
      },
      {
        name: 'Adamo ID',
        description: 'Verificación de identidad',
        clientsToSeed: 9411,
        accentColor: '#0086c9',
      },
      {
        name: 'Adamo Risk',
        description: 'Reducción de riesgos',
        clientsToSeed: 793,
        accentColor: '#7839ee',
      },
      {
        name: 'Adamo Sign',
        description: 'Firma de documentos',
        clientsToSeed: 2738,
        accentColor: '#3e4784',
      },
    ]);
  });

  it('suman los 16.769 clientes del diseño', () => {
    const total = DEFAULT_SERVICE_DEFINITIONS.reduce(
      (sum, service) => sum + service.clientsToSeed,
      0,
    );

    expect(total).toBe(16769);
  });

  it('tienen nombres y orden únicos', () => {
    expect(new Set(DEFAULT_SERVICE_DEFINITIONS.map((service) => service.name)).size).toBe(4);
    expect(new Set(DEFAULT_SERVICE_DEFINITIONS.map((service) => service.order)).size).toBe(4);
  });

  it('usan colores hexadecimales válidos', () => {
    DEFAULT_SERVICE_DEFINITIONS.forEach((service) =>
      expect(service.accentColor).toMatch(/^#[0-9a-f]{6}$/i),
    );
  });
});

describe('seedDefaultServices', () => {
  const database = new TestDatabase();
  const services = new MongoServiceRepository();
  const clients = new MongoClientRepository();

  beforeAll(async () => {
    await database.start();
    await ServiceModel.init();
    await ClientModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  async function countsByName() {
    const counts = await clients.countByService();
    const saved = await services.findAll();
    return Object.fromEntries(saved.map((service) => [service.name, counts.get(service.id) ?? 0]));
  }

  it('crea los 4 servicios en orden', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    const names = (await services.findAll()).map((service) => service.name);
    expect(names).toEqual(['Adamo Pay', 'Adamo ID', 'Adamo Risk', 'Adamo Sign']);
  });

  it('crea los clientes de cada servicio según su definición', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    expect(await countsByName()).toEqual({
      'Adamo Pay': 12,
      'Adamo ID': 30,
      'Adamo Risk': 3,
      'Adamo Sign': 7,
    });
  });

  it('se puede ejecutar en cada arranque sin duplicar servicios ni clientes', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    expect(await services.findAll()).toHaveLength(4);
    expect(await countsByName()).toEqual({
      'Adamo Pay': 12,
      'Adamo ID': 30,
      'Adamo Risk': 3,
      'Adamo Sign': 7,
    });
  });

  it('respeta los cambios hechos a un servicio después del primer arranque', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);
    await ServiceModel.updateOne({ name: 'Adamo Pay' }, { description: 'Descripción cambiada' });

    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    const pay = (await services.findAll()).find((service) => service.name === 'Adamo Pay');
    expect(pay!.description).toBe('Descripción cambiada');
  });

  it('completa los clientes que falten si se borraron algunos', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);
    await ClientModel.deleteMany({ name: /a/ });
    expect((await countsByName())['Adamo ID']).toBeLessThan(30);

    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    expect((await countsByName())['Adamo ID']).toBe(30);
  });

  it('repone un servicio que se haya borrado, con sus clientes', async () => {
    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);
    await ServiceModel.deleteOne({ name: 'Adamo Risk' });

    await seedDefaultServices(services, clients, SMALL_SERVICE_DEFINITIONS);

    expect(await services.findAll()).toHaveLength(4);
    expect((await countsByName())['Adamo Risk']).toBe(3);
  });

  it('carga completa del diseño: 16.769 clientes repartidos exactamente como en cada tarjeta', async () => {
    await seedDefaultServices(services, clients);

    expect(await countsByName()).toEqual({
      'Adamo Pay': 3827,
      'Adamo ID': 9411,
      'Adamo Risk': 793,
      'Adamo Sign': 2738,
    });
    expect(await ClientModel.countDocuments()).toBe(16769);
  }, 60_000);

  it('en un segundo arranque con la carga completa no agrega ni un cliente más', async () => {
    await seedDefaultServices(services, clients);

    await seedDefaultServices(services, clients);

    expect(await ClientModel.countDocuments()).toBe(16769);
  }, 60_000);
});
