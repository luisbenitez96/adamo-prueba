import { AppError } from '../../shared/errors/app-error.js';
import { NOTIFICATION_TEMPLATES } from './notification-templates.js';
import type { NotificationPublisher } from './notification-publisher.js';
import type { NotificationType } from './notification.entity.js';
import type { NotificationRepository } from './notification.repository.js';

export const NOTIFICATIONS_LIMIT = 20;

export interface NotificationSummary {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationsList {
  notifications: NotificationSummary[];
  unreadCount: number;
}

export class NotificationService implements NotificationPublisher {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly now: () => Date,
  ) {}

  async publish(userId: string, type: NotificationType): Promise<void> {
    const { title, message } = NOTIFICATION_TEMPLATES[type];

    await this.notifications.create({ userId, type, title, message, createdAt: this.now() });
  }

  async list(userId: string): Promise<NotificationsList> {
    const [latest, unreadCount] = await Promise.all([
      this.notifications.findLatest(userId, NOTIFICATIONS_LIMIT),
      this.notifications.countUnread(userId),
    ]);

    return {
      notifications: latest.map(({ id, type, title, message, read, createdAt }) => ({
        id,
        type,
        title,
        message,
        read,
        createdAt,
      })),
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const found = await this.notifications.markRead(userId, notificationId);

    if (!found) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notificación no encontrada');
    }
  }

  markAllRead(userId: string): Promise<void> {
    return this.notifications.markAllRead(userId);
  }
}
