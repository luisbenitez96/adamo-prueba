import { http, HttpResponse } from 'msw';
import { server } from './server';

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
