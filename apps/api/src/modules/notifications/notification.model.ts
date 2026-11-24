import { model, Schema } from 'mongoose';
import type { Types } from 'mongoose';
import { NOTIFICATION_TYPES } from './notification.entity.js';
import type { Notification } from './notification.entity.js';

export type NotificationDocument = Omit<Notification, 'id' | 'userId'> & { userId: Types.ObjectId };

const notificationSchema = new Schema<NotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, required: true },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const NotificationModel = model<NotificationDocument>('Notification', notificationSchema);
