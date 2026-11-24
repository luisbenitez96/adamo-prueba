import { describe, expect, it } from 'vitest';
import { NOTIFICATION_TEMPLATES } from './notification-templates.js';
import type { NewNotification, Notification } from './notification.entity.js';
import type { NotificationRepository } from './notification.repository.js';
import { NOTIFICATIONS_LIMIT, NotificationService } from './notification.service.js';

class FakeRepository implements NotificationRepository {
  created: NewNotification[] = [];
  requestedLimit: number | null = null;
  markReadResult = true;

  async create(notification: NewNotification): Promise<Notification> {
    this.created.push(notification);
    return { ...notification, id: 'n1', read: false };
  }

  async findLatest(_userId: string, limit: number): Promise<Notification[]> {
    this.requestedLimit = limit;
    return [];
  }

  async countUnread(): Promise<number> {
    return 0;
  }

  async markRead(): Promise<boolean> {
    return this.markReadResult;
  }

  async markAllRead(): Promise<void> {}
}

const NOW = new Date('2030-01-01T12:00:00.000Z');

describe('NotificationService', () => {
  it('publish guarda título y mensaje de la plantilla, el usuario y la hora actual', async () => {
    const repository = new FakeRepository();
    const service = new NotificationService(repository, () => NOW);

    await service.publish('user-1', 'password-changed');

    expect(repository.created).toEqual([
      {
        userId: 'user-1',
        type: 'password-changed',
        createdAt: NOW,
        ...NOTIFICATION_TEMPLATES['password-changed'],
      },
    ]);
  });

  it('list pide al repositorio solo las más recientes', async () => {
    const repository = new FakeRepository();
    const service = new NotificationService(repository, () => NOW);

    await service.list('user-1');

    expect(repository.requestedLimit).toBe(20);
    expect(NOTIFICATIONS_LIMIT).toBe(20);
  });

  it('markRead lanza 404 si no se encontró la notificación', async () => {
    const repository = new FakeRepository();
    repository.markReadResult = false;
    const service = new NotificationService(repository, () => NOW);

    await expect(service.markRead('user-1', 'x')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOTIFICATION_NOT_FOUND',
    });
  });

  it('markRead no lanza nada si se encontró', async () => {
    const service = new NotificationService(new FakeRepository(), () => NOW);

    await expect(service.markRead('user-1', 'x')).resolves.toBeUndefined();
  });
});
