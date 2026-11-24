import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { DEFAULT_SERVICES, seedDefaultServices } from './default-services.js';
import { MongoServiceRepository } from './mongo-service.repository.js';
import { ServiceModel } from './service.model.js';

describe('servicios por defecto', () => {
  it('coinciden con los del diseño, en el mismo orden', () => {
    expect(
      DEFAULT_SERVICES.map(({ name, description, clientsCount, accentColor }) => ({
        name,
        description,
        clientsCount,
        accentColor,
      })),
    ).toEqual([
      {
        name: 'Adamo Pay',
        description: 'Gestión de pagos',
        clientsCount: 3827,
        accentColor: '#0e9384',
      },
      {
        name: 'Adamo ID',
        description: 'Verificación de identidad',
        clientsCount: 9411,
        accentColor: '#0086c9',
      },
      {
        name: 'Adamo Risk',
        description: 'Reducción de riesgos',
        clientsCount: 793,
        accentColor: '#7839ee',
      },
      {
        name: 'Adamo Sign',
        description: 'Firma de documentos',
        clientsCount: 2738,
        accentColor: '#3e4784',
      },
    ]);
  });

  it('tienen nombres y orden únicos', () => {
    expect(new Set(DEFAULT_SERVICES.map((service) => service.name)).size).toBe(4);
    expect(new Set(DEFAULT_SERVICES.map((service) => service.order)).size).toBe(4);
  });

  it('usan colores hexadecimales válidos', () => {
    DEFAULT_SERVICES.forEach((service) => expect(service.accentColor).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe('seedDefaultServices', () => {
  const database = new TestDatabase();
  const repository = new MongoServiceRepository();

  beforeAll(async () => {
    await database.start();
    await ServiceModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  it('crea los 4 servicios en una base vacía', async () => {
    await seedDefaultServices(repository);

    const names = (await repository.findAll()).map((service) => service.name);
    expect(names).toEqual(['Adamo Pay', 'Adamo ID', 'Adamo Risk', 'Adamo Sign']);
  });

  it('se puede ejecutar en cada arranque sin duplicar nada', async () => {
    await seedDefaultServices(repository);
    await seedDefaultServices(repository);
    await seedDefaultServices(repository);

    expect(await repository.findAll()).toHaveLength(4);
  });

  it('respeta los cambios hechos a un servicio después del primer arranque', async () => {
    await seedDefaultServices(repository);
    await ServiceModel.updateOne({ name: 'Adamo Pay' }, { clientsCount: 1 });

    await seedDefaultServices(repository);

    const pay = (await repository.findAll()).find((service) => service.name === 'Adamo Pay');
    expect(pay!.clientsCount).toBe(1);
  });

  it('repone un servicio que se haya borrado', async () => {
    await seedDefaultServices(repository);
    await ServiceModel.deleteOne({ name: 'Adamo Risk' });

    await seedDefaultServices(repository);

    expect(await repository.findAll()).toHaveLength(4);
  });
});
