import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { MongoServiceRepository } from './mongo-service.repository.js';
import type { NewServiceItem } from './service-item.entity.js';
import { ServiceModel } from './service.model.js';

function serviceNamed(
  name: string,
  order: number,
  description = `Descripción de ${name}`,
): NewServiceItem {
  return { name, description, accentColor: '#112233', order };
}

describe('MongoServiceRepository', () => {
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

  describe('insertMissing', () => {
    it('guarda los servicios con todos sus datos', async () => {
      await repository.insertMissing([serviceNamed('Adamo Pay', 1)]);

      const [service] = await repository.findAll();

      expect(service).toMatchObject({
        name: 'Adamo Pay',
        description: 'Descripción de Adamo Pay',
        accentColor: '#112233',
        order: 1,
      });
      expect(service!.id).toEqual(expect.any(String));
    });

    it('no duplica los servicios si se ejecuta varias veces', async () => {
      const items = [serviceNamed('Adamo Pay', 1), serviceNamed('Adamo ID', 2)];

      await repository.insertMissing(items);
      await repository.insertMissing(items);

      expect(await repository.findAll()).toHaveLength(2);
    });

    it('no pisa los datos de un servicio que ya existe', async () => {
      await repository.insertMissing([serviceNamed('Adamo Pay', 1, 'Original')]);

      await repository.insertMissing([serviceNamed('Adamo Pay', 1, 'Cambiada')]);

      expect((await repository.findAll())[0]!.description).toBe('Original');
    });

    it('agrega solo los que faltan', async () => {
      await repository.insertMissing([serviceNamed('Adamo Pay', 1)]);

      await repository.insertMissing([serviceNamed('Adamo Pay', 1), serviceNamed('Adamo ID', 2)]);

      const names = (await repository.findAll()).map((service) => service.name);
      expect(names).toEqual(['Adamo Pay', 'Adamo ID']);
    });

    it('no falla con una lista vacía', async () => {
      await expect(repository.insertMissing([])).resolves.toBeUndefined();
      expect(await repository.findAll()).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('devuelve una lista vacía si no hay servicios', async () => {
      expect(await repository.findAll()).toEqual([]);
    });

    it('los devuelve ordenados por su campo order, sin importar cómo se insertaron', async () => {
      await repository.insertMissing([
        serviceNamed('Tercero', 3),
        serviceNamed('Primero', 1),
        serviceNamed('Segundo', 2),
      ]);

      const names = (await repository.findAll()).map((service) => service.name);

      expect(names).toEqual(['Primero', 'Segundo', 'Tercero']);
    });
  });

  describe('findById', () => {
    it('encuentra un servicio por su id', async () => {
      await repository.insertMissing([serviceNamed('Adamo Pay', 1)]);
      const [saved] = await repository.findAll();

      const found = await repository.findById(saved!.id);

      expect(found).toMatchObject({ id: saved!.id, name: 'Adamo Pay' });
    });

    it('devuelve null si el id no existe', async () => {
      expect(await repository.findById('64b7f0c2a1b2c3d4e5f60718')).toBeNull();
    });

    it('devuelve null si el id no tiene formato válido', async () => {
      expect(await repository.findById('no-es-un-id')).toBeNull();
    });
  });
});
