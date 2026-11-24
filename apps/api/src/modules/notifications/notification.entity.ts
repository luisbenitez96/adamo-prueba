export const NOTIFICATION_TYPES = [
  'account-created',
  'temporary-password-requested',
  'temporary-login',
  'password-changed',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export type NewNotification = Omit<Notification, 'id' | 'read'>;
