import { isValidObjectId, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { NewNotification, Notification } from './notification.entity.js';
import { NotificationModel } from './notification.model.js';
import type { NotificationDocument } from './notification.model.js';
import type { NotificationRepository } from './notification.repository.js';

function toNotification(document: HydratedDocument<NotificationDocument>): Notification {
  return {
    id: document.id,
    userId: document.userId.toString(),
    type: document.type,
    title: document.title,
    message: document.message,
    read: document.read,
    createdAt: document.createdAt,
  };
}

export class MongoNotificationRepository implements NotificationRepository {
  async create(notification: NewNotification): Promise<Notification> {
    const document = await NotificationModel.create({
      ...notification,
      userId: new Types.ObjectId(notification.userId),
    });
    return toNotification(document);
  }

  async findLatest(userId: string, limit: number): Promise<Notification[]> {
    const documents = await NotificationModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
    return documents.map(toNotification);
  }

  countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false });
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    if (!isValidObjectId(notificationId)) {
      return false;
    }

    const result = await NotificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { read: true },
    );
    return result.matchedCount > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
  }
}
