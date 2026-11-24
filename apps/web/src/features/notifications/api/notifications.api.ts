import { http } from '../../../lib/http';
import { notificationsResponseSchema } from '../schemas';
import type { NotificationsResponse } from '../schemas';

export const notificationsApi = {
  async list(): Promise<NotificationsResponse> {
    return notificationsResponseSchema.parse(await http.get('/api/notifications'));
  },

  async markRead(notificationId: string): Promise<void> {
    await http.post(`/api/notifications/${encodeURIComponent(notificationId)}/read`);
  },

  async markAllRead(): Promise<void> {
    await http.post('/api/notifications/read');
  },
};
