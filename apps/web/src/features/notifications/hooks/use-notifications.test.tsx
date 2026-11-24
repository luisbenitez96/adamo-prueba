import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../test/render-route';
import { notificationsApi } from '../api/notifications.api';
import {
  NOTIFICATIONS_REFRESH_MS,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from './use-notifications';

const EMPTY = { notifications: [], unreadCount: 0 };

function wrapperFor(queryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe('useNotifications', () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] }),
  );
  afterEach(() => vi.useRealTimers());

  it('se refresca solo cada minuto, sin recargar la página', async () => {
    const list = vi.spyOn(notificationsApi, 'list').mockResolvedValue(EMPTY);
    renderHook(() => useNotifications(), { wrapper: wrapperFor() });
    await vi.advanceTimersByTimeAsync(0);
    expect(list).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(NOTIFICATIONS_REFRESH_MS - 1);
    expect(list).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(list).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(NOTIFICATIONS_REFRESH_MS);
    expect(list).toHaveBeenCalledTimes(3);
  });

  it('el intervalo de refresco es de 60 segundos', () => {
    expect(NOTIFICATIONS_REFRESH_MS).toBe(60_000);
  });
});

describe('marcar como leídas', () => {
  it('marcar una llama a la API con su id y vuelve a pedir la lista', async () => {
    const queryClient = createTestQueryClient();
    const list = vi.spyOn(notificationsApi, 'list').mockResolvedValue(EMPTY);
    const markRead = vi.spyOn(notificationsApi, 'markRead').mockResolvedValue();
    const { result } = renderHook(
      () => ({ query: useNotifications(), mark: useMarkNotificationRead() }),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(() => result.current.mark.mutateAsync('n7'));

    expect(markRead).toHaveBeenCalledExactlyOnceWith('n7');
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('marcar todas llama a la API y vuelve a pedir la lista', async () => {
    const queryClient = createTestQueryClient();
    const list = vi.spyOn(notificationsApi, 'list').mockResolvedValue(EMPTY);
    const markAll = vi.spyOn(notificationsApi, 'markAllRead').mockResolvedValue();
    const { result } = renderHook(
      () => ({ query: useNotifications(), mark: useMarkAllNotificationsRead() }),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(() => result.current.mark.mutateAsync());

    expect(markAll).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('si la API falla, no vuelve a pedir la lista y expone el error', async () => {
    const queryClient = createTestQueryClient();
    const list = vi.spyOn(notificationsApi, 'list').mockResolvedValue(EMPTY);
    vi.spyOn(notificationsApi, 'markAllRead').mockRejectedValue(new Error('x'));
    const { result } = renderHook(
      () => ({ query: useNotifications(), mark: useMarkAllNotificationsRead() }),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(() => result.current.mark.mutateAsync().catch(() => undefined));

    await waitFor(() => expect(result.current.mark.isError).toBe(true));
    expect(list).toHaveBeenCalledTimes(1);
  });
});
