import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../lib/http';
import { DESIGN_NOTIFICATIONS, server } from '../../../test/server';
import { notificationsApi } from './notifications.api';

describe('notificationsApi', () => {
  it('list devuelve las notificaciones y el contador ya validados', async () => {
    const result = await notificationsApi.list();

    expect(result.notifications).toHaveLength(DESIGN_NOTIFICATIONS.length);
    expect(result.unreadCount).toBe(2);
  });

  it('list rechaza una respuesta con forma inesperada', async () => {
    server.use(http.get('*/api/notifications', () => HttpResponse.json({ nada: true })));

    await expect(notificationsApi.list()).rejects.toThrow();
  });

  it('list propaga los errores de la API', async () => {
    server.use(
      http.get('*/api/notifications', () =>
        HttpResponse.json({ error: { code: 'X', message: 'y' } }, { status: 500 }),
      ),
    );

    await expect(notificationsApi.list()).rejects.toBeInstanceOf(ApiError);
  });

  it('markRead hace POST a la ruta de esa notificación', async () => {
    const received: { method: string; path: string }[] = [];
    server.use(
      http.post('*/api/notifications/:id/read', ({ request }) => {
        received.push({ method: request.method, path: new URL(request.url).pathname });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await notificationsApi.markRead('abc123');

    expect(received).toEqual([{ method: 'POST', path: '/api/notifications/abc123/read' }]);
  });

  it('markRead codifica el id para que no rompa la ruta', async () => {
    const paths: string[] = [];
    server.use(
      http.post('*/api/notifications/*', ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await notificationsApi.markRead('a/b ñ');

    expect(paths).toEqual(['/api/notifications/a%2Fb%20%C3%B1/read']);
  });

  it('markAllRead hace POST a /read', async () => {
    const received: string[] = [];
    server.use(
      http.post('*/api/notifications/read', ({ request }) => {
        received.push(request.method);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await notificationsApi.markAllRead();

    expect(received).toEqual(['POST']);
  });
});
