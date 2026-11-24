import type { NotificationPublisher } from '../modules/notifications/notification-publisher.js';
import type { NotificationType } from '../modules/notifications/notification.entity.js';

export class RecordingNotificationPublisher implements NotificationPublisher {
  readonly published: { userId: string; type: NotificationType }[] = [];

  async publish(userId: string, type: NotificationType): Promise<void> {
    this.published.push({ userId, type });
  }
}
