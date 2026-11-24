import { http, HttpResponse } from 'msw';
import type { Session } from '../features/auth/schemas';
import { noSessionHandler, server } from './server';

export function apiError(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export function mockPost(path: string, respond: (body: unknown) => Response | Promise<Response>) {
  const received: unknown[] = [];

  server.use(
    http.post(`*${path}`, async ({ request }) => {
      const body = await request.json();
      received.push(body);
      return respond(body);
    }),
  );

  return received;
}

export function mockSession(session: Session | null) {
  if (session === null) {
    server.use(noSessionHandler);
    return;
  }

  server.use(http.get('*/api/auth/me', () => HttpResponse.json(session)));
}

export const FULL_SESSION: Session = { email: 'ana@correo.com', requiresPasswordChange: false };
export const TEMPORARY_SESSION: Session = { email: 'ana@correo.com', requiresPasswordChange: true };
