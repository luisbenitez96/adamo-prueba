import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { MongoNotificationRepository } from './mongo-notification.repository.js';
import type { NewNotification } from './notification.entity.js';
import { NotificationModel } from './notification.model.js';

const USER_A = new Types.ObjectId().toString();
const USER_B = new Types.ObjectId().toString();

function notification(userId: string, minute = 0, title = 'Título'): NewNotification {
  return {
    userId,
    type: 'account-created',
    title,
    message: 'Mensaje',
    createdAt: new Date(Date.UTC(2030, 0, 1, 12, minute)),
  };
}

describe('MongoNotificationRepository', () => {
  const database = new TestDatabase();
  const repository = new MongoNotificationRepository();

  beforeAll(async () => {
    await database.start();
    await NotificationModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  describe('create', () => {
    it('guarda la notificación como no leída y devuelve todos sus datos', async () => {
      const created = await repository.create(notification(USER_A, 5, 'Hola'));

      expect(created).toMatchObject({
        userId: USER_A,
        type: 'account-created',
        title: 'Hola',
        message: 'Mensaje',
        read: false,
        createdAt: new Date(Date.UTC(2030, 0, 1, 12, 5)),
      });
      expect(created.id).toEqual(expect.any(String));
    });

    it('rechaza un tipo que no existe', async () => {
      await expect(
        repository.create({ ...notification(USER_A), type: 'inventado' as never }),
      ).rejects.toThrow();
    });
  });

  describe('findLatest', () => {
    it('devuelve primero las más recientes', async () => {
      await repository.create(notification(USER_A, 1, 'Vieja'));
      await repository.create(notification(USER_A, 9, 'Nueva'));
      await repository.create(notification(USER_A, 5, 'Media'));

      const titles = (await repository.findLatest(USER_A, 10)).map((item) => item.title);

      expect(titles).toEqual(['Nueva', 'Media', 'Vieja']);
    });

    it('con la misma hora desempata por orden de creación (la última primero)', async () => {
      await repository.create(notification(USER_A, 1, 'Primera'));
      await repository.create(notification(USER_A, 1, 'Segunda'));

      const titles = (await repository.findLatest(USER_A, 10)).map((item) => item.title);

      expect(titles).toEqual(['Segunda', 'Primera']);
    });

    it('respeta el límite', async () => {
      for (let minute = 0; minute < 5; minute++) {
        await repository.create(notification(USER_A, minute));
      }

      expect(await repository.findLatest(USER_A, 3)).toHaveLength(3);
    });

    it('solo devuelve las del usuario pedido', async () => {
      await repository.create(notification(USER_A, 1, 'De A'));
      await repository.create(notification(USER_B, 2, 'De B'));

      const titles = (await repository.findLatest(USER_A, 10)).map((item) => item.title);

      expect(titles).toEqual(['De A']);
    });

    it('sin notificaciones devuelve una lista vacía', async () => {
      expect(await repository.findLatest(USER_A, 10)).toEqual([]);
    });
  });

  describe('countUnread', () => {
    it('cuenta solo las no leídas del usuario', async () => {
      const first = await repository.create(notification(USER_A, 1));
      await repository.create(notification(USER_A, 2));
      await repository.create(notification(USER_B, 3));
      await repository.markRead(USER_A, first.id);

      expect(await repository.countUnread(USER_A)).toBe(1);
      expect(await repository.countUnread(USER_B)).toBe(1);
    });

    it('sin notificaciones es cero', async () => {
      expect(await repository.countUnread(USER_A)).toBe(0);
    });

    it('cuenta más allá del límite de la lista', async () => {
      for (let minute = 0; minute < 30; minute++) {
        await repository.create(notification(USER_A, minute));
      }

      expect(await repository.countUnread(USER_A)).toBe(30);
    });
  });

  describe('markRead', () => {
    it('marca una notificación como leída y devuelve true', async () => {
      const created = await repository.create(notification(USER_A));

      expect(await repository.markRead(USER_A, created.id)).toBe(true);
      expect((await repository.findLatest(USER_A, 10))[0]!.read).toBe(true);
    });

    it('solo marca esa, no las demás', async () => {
      const first = await repository.create(notification(USER_A, 1));
      await repository.create(notification(USER_A, 2));

      await repository.markRead(USER_A, first.id);

      expect(await repository.countUnread(USER_A)).toBe(1);
    });

    it('no puede marcar la notificación de otro usuario', async () => {
      const created = await repository.create(notification(USER_A));

      expect(await repository.markRead(USER_B, created.id)).toBe(false);
      expect(await repository.countUnread(USER_A)).toBe(1);
    });

    it('un id que no existe devuelve false', async () => {
      expect(await repository.markRead(USER_A, new Types.ObjectId().toString())).toBe(false);
    });

    it('un id con formato inválido devuelve false', async () => {
      expect(await repository.markRead(USER_A, 'no-es-un-id')).toBe(false);
    });

    it('marcar una ya leída sigue devolviendo true', async () => {
      const created = await repository.create(notification(USER_A));
      await repository.markRead(USER_A, created.id);

      expect(await repository.markRead(USER_A, created.id)).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('marca todas las del usuario', async () => {
      await repository.create(notification(USER_A, 1));
      await repository.create(notification(USER_A, 2));

      await repository.markAllRead(USER_A);

      expect(await repository.countUnread(USER_A)).toBe(0);
    });

    it('no toca las de otros usuarios', async () => {
      await repository.create(notification(USER_A, 1));
      await repository.create(notification(USER_B, 2));

      await repository.markAllRead(USER_A);

      expect(await repository.countUnread(USER_B)).toBe(1);
    });

    it('marca también las que quedan fuera del límite de la lista', async () => {
      for (let minute = 0; minute < 30; minute++) {
        await repository.create(notification(USER_A, minute));
      }

      await repository.markAllRead(USER_A);

      expect(await repository.countUnread(USER_A)).toBe(0);
    });

    it('sin notificaciones no falla', async () => {
      await expect(repository.markAllRead(USER_A)).resolves.toBeUndefined();
    });
  });
});
