import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { generateClient } from './client-generator.js';
import type { NewClient } from './client.entity.js';
import { ClientModel } from './client.model.js';
import { MongoClientRepository } from './mongo-client.repository.js';
import { toSearchKey } from './search-key.js';

const SERVICE_A = new Types.ObjectId().toString();
const SERVICE_B = new Types.ObjectId().toString();

function clientsOf(serviceId: string, serviceKey: string, count: number): NewClient[] {
  return Array.from({ length: count }, (_, index) => generateClient(serviceId, serviceKey, index));
}

function namedClient(name: string, overrides: Partial<NewClient> = {}): NewClient {
  const base = generateClient(SERVICE_A, 'Adamo Pay', 0);
  return {
    ...base,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    searchKey: toSearchKey(name),
    ...overrides,
  };
}

describe('MongoClientRepository', () => {
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

  describe('insertMany', () => {
    it('guarda los clientes', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 5));

      expect(await repository.countForService(SERVICE_A)).toBe(5);
    });

    it('no falla con una lista vacía', async () => {
      await expect(repository.insertMany([])).resolves.toBeUndefined();
    });

    it('ignora los clientes repetidos (mismo servicio y correo) y guarda los nuevos del mismo lote', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 5));

      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 8));

      expect(await repository.countForService(SERVICE_A)).toBe(8);
    });

    it('permite el mismo correo en servicios distintos', async () => {
      const shared = generateClient(SERVICE_A, 'Adamo Pay', 0);

      await repository.insertMany([shared, { ...shared, serviceId: SERVICE_B }]);

      expect(await repository.countForService(SERVICE_A)).toBe(1);
      expect(await repository.countForService(SERVICE_B)).toBe(1);
    });
  });

  describe('contar', () => {
    it('countByService cuenta los clientes de cada servicio', async () => {
      await repository.insertMany([
        ...clientsOf(SERVICE_A, 'Adamo Pay', 7),
        ...clientsOf(SERVICE_B, 'Adamo ID', 3),
      ]);

      const counts = await repository.countByService();

      expect(counts.get(SERVICE_A)).toBe(7);
      expect(counts.get(SERVICE_B)).toBe(3);
      expect(counts.size).toBe(2);
    });

    it('countByService cambia cuando se agregan clientes: el número se calcula, no se guarda', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 7));
      const before = (await repository.countByService()).get(SERVICE_A);

      await repository.insertMany([generateClient(SERVICE_A, 'Adamo Pay', 7)]);

      expect(before).toBe(7);
      expect((await repository.countByService()).get(SERVICE_A)).toBe(8);
    });

    it('un servicio sin clientes no aparece en countByService', async () => {
      expect((await repository.countByService()).size).toBe(0);
    });

    it('countForService devuelve 0 si no hay clientes', async () => {
      expect(await repository.countForService(SERVICE_A)).toBe(0);
    });
  });

  describe('findPage', () => {
    it('devuelve la primera página y el total del servicio', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 45));

      const { items, total } = await repository.findPage({
        serviceId: SERVICE_A,
        page: 1,
        pageSize: 20,
      });

      expect(items).toHaveLength(20);
      expect(total).toBe(45);
    });

    it('la última página trae solo los que sobran', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 45));

      const { items } = await repository.findPage({ serviceId: SERVICE_A, page: 3, pageSize: 20 });

      expect(items).toHaveLength(5);
    });

    it('una página más allá del final viene vacía pero con el total correcto', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 45));

      const { items, total } = await repository.findPage({
        serviceId: SERVICE_A,
        page: 9,
        pageSize: 20,
      });

      expect(items).toEqual([]);
      expect(total).toBe(45);
    });

    it('las páginas no se repiten ni se saltan clientes', async () => {
      await repository.insertMany(clientsOf(SERVICE_A, 'Adamo Pay', 45));

      const pages = await Promise.all(
        [1, 2, 3].map((page) => repository.findPage({ serviceId: SERVICE_A, page, pageSize: 20 })),
      );

      const ids = pages.flatMap((page) => page.items.map((client) => client.id));
      expect(new Set(ids).size).toBe(45);
    });

    it('ordena por nombre sin distinguir tildes ni mayúsculas', async () => {
      await repository.insertMany([
        namedClient('Zacarías Zapata'),
        namedClient('Ángela Arango'),
        namedClient('Bruno Bravo'),
      ]);

      const { items } = await repository.findPage({ serviceId: SERVICE_A, page: 1, pageSize: 10 });

      expect(items.map((client) => client.name)).toEqual([
        'Ángela Arango',
        'Bruno Bravo',
        'Zacarías Zapata',
      ]);
    });

    it('solo devuelve los clientes del servicio pedido', async () => {
      await repository.insertMany([
        ...clientsOf(SERVICE_A, 'Adamo Pay', 10),
        ...clientsOf(SERVICE_B, 'Adamo ID', 4),
      ]);

      const { items, total } = await repository.findPage({
        serviceId: SERVICE_B,
        page: 1,
        pageSize: 50,
      });

      expect(total).toBe(4);
      expect(items.every((client) => client.serviceId === SERVICE_B)).toBe(true);
    });

    it('un servicio sin clientes devuelve una página vacía', async () => {
      expect(await repository.findPage({ serviceId: SERVICE_A, page: 1, pageSize: 20 })).toEqual({
        items: [],
        total: 0,
      });
    });

    describe('búsqueda', () => {
      beforeEach(async () => {
        await repository.insertMany([
          namedClient('José Pérez'),
          namedClient('Josefina Gómez'),
          namedClient('Ana Rojas'),
          namedClient('Luis Vega', {
            email: 'contacto.especial@example.com',
            searchKey: toSearchKey('Luis Vega contacto.especial@example.com'),
          }),
        ]);
      });

      const names = async (search: string) =>
        (
          await repository.findPage({ serviceId: SERVICE_A, search, page: 1, pageSize: 20 })
        ).items.map((client) => client.name);

      it('encuentra por una parte del nombre', async () => {
        expect(await names('jos')).toEqual(['José Pérez', 'Josefina Gómez']);
      });

      it('no distingue mayúsculas', async () => {
        expect(await names('ANA')).toEqual(['Ana Rojas']);
      });

      it('no distingue tildes: "jose" encuentra "José"', async () => {
        expect(await names('jose')).toContain('José Pérez');
      });

      it('también acepta tildes en lo que se escribe: "Pérez" encuentra "Perez"', async () => {
        expect(await names('Pérez')).toEqual(['José Pérez']);
      });

      it('encuentra por el correo', async () => {
        expect(await names('contacto.especial')).toEqual(['Luis Vega']);
      });

      it('ignora los espacios de los extremos', async () => {
        expect(await names('  ana  ')).toEqual(['Ana Rojas']);
      });

      it('un texto vacío no filtra', async () => {
        expect(await names('   ')).toHaveLength(4);
      });

      it('sin coincidencias devuelve vacío', async () => {
        expect(await names('zzzz')).toEqual([]);
      });

      it('los caracteres especiales se buscan literalmente (no como expresión regular)', async () => {
        expect(await names('.*')).toEqual([]);
        expect(await names('(')).toEqual([]);
      });

      it('el total refleja solo los resultados de la búsqueda', async () => {
        const { total } = await repository.findPage({
          serviceId: SERVICE_A,
          search: 'jos',
          page: 1,
          pageSize: 1,
        });

        expect(total).toBe(2);
      });
    });
  });
});
