import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const noSessionHandler = http.get('*/api/auth/me', () =>
  HttpResponse.json(
    { error: { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar' } },
    { status: 401 },
  ),
);

export const DESIGN_SERVICES = [
  {
    id: 'pay',
    name: 'Adamo Pay',
    description: 'Gestión de pagos',
    clientsCount: 3827,
    accentColor: '#0e9384',
  },
  {
    id: 'id',
    name: 'Adamo ID',
    description: 'Verificación de identidad',
    clientsCount: 9411,
    accentColor: '#0086c9',
  },
  {
    id: 'risk',
    name: 'Adamo Risk',
    description: 'Reducción de riesgos',
    clientsCount: 793,
    accentColor: '#7839ee',
  },
  {
    id: 'sign',
    name: 'Adamo Sign',
    description: 'Firma de documentos',
    clientsCount: 2738,
    accentColor: '#3e4784',
  },
];

export const servicesHandler = http.get('*/api/services', () =>
  HttpResponse.json({ services: DESIGN_SERVICES }),
);

export const logoutHandler = http.post(
  '*/api/auth/logout',
  () => new HttpResponse(null, { status: 204 }),
);

export const server = setupServer(noSessionHandler, servicesHandler, logoutHandler);
