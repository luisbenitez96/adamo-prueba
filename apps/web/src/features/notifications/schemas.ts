import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'account-created',
  'temporary-password-requested',
  'temporary-login',
  'password-changed',
] as const;

export const notificationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1),
  message: z.string().min(1),
  read: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number().int().min(0),
});

export type AppNotification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
