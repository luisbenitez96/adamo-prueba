import type { NotificationType } from './notification.entity.js';

export interface NotificationPublisher {
  publish(userId: string, type: NotificationType): Promise<void>;
}
