import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const noSessionHandler = http.get('*/api/auth/me', () =>
  HttpResponse.json({ session: null }),
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

const STATUSES = ['active', 'pending', 'inactive'] as const;

export function fakeClient(index: number) {
  const number = String(index).padStart(3, '0');

  return {
    id: `client-${number}`,
    name: `Cliente ${number}`,
    email: `cliente${number}@example.com`,
    phone: '+57 300 123 4567',
    city: 'Bogotá',
    status: STATUSES[index % STATUSES.length]!,
    registeredAt: '2025-03-15T00:00:00.000Z',
  };
}

export function createClientsHandler(total = 45, service = DESIGN_SERVICES[0]!) {
  const everyone = Array.from({ length: total }, (_, offset) => fakeClient(offset + 1));

  return http.get('*/api/services/:serviceId/clients', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const matching = everyone.filter((client) =>
      `${client.name} ${client.email}`.toLowerCase().includes(search),
    );

    return HttpResponse.json({
      service: { id: service.id, name: service.name, accentColor: service.accentColor },
      clients: matching.slice((page - 1) * pageSize, page * pageSize),
      pagination: {
        page,
        pageSize,
        total: matching.length,
        totalPages: Math.max(1, Math.ceil(matching.length / pageSize)),
      },
    });
  });
}

export const logoutHandler = http.post(
  '*/api/auth/logout',
  () => new HttpResponse(null, { status: 204 }),
);

export const server = setupServer(
  noSessionHandler,
  servicesHandler,
  createClientsHandler(),
  logoutHandler,
);
