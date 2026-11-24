import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';

export const NOTIFICATIONS_REFRESH_MS = 60_000;

export const notificationsQueryKey = ['notifications'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => notificationsApi.list(),
    refetchInterval: NOTIFICATIONS_REFRESH_MS,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}
