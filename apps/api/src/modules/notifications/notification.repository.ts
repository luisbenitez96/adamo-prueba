import type { NewNotification, Notification } from './notification.entity.js';

export interface NotificationRepository {
  create(notification: NewNotification): Promise<Notification>;
  findLatest(userId: string, limit: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, notificationId: string): Promise<boolean>;
  markAllRead(userId: string): Promise<void>;
}
