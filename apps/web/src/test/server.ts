import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const noSessionHandler = http.get('*/api/auth/me', () =>
  HttpResponse.json(
    { error: { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar' } },
    { status: 401 },
  ),
);

export const server = setupServer(noSessionHandler);
