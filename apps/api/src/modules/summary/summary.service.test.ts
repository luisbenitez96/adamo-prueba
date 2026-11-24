import { describe, expect, it } from 'vitest';
import type { ClientRepository } from '../clients/client.repository.js';
import type { ServiceRepository } from '../services/service.repository.js';
import { SummaryService } from './summary.service.js';

function createService(servicesCount: number, byStatus = { active: 7, pending: 2, inactive: 1 }) {
  const services = {
    findAll: async () =>
      Array.from({ length: servicesCount }, (_, index) => ({
        id: `s${index}`,
        name: `S${index}`,
        description: '',
        accentColor: '#112233',
        order: index,
      })),
  } as unknown as ServiceRepository;
  const clients = { countByStatus: async () => byStatus } as unknown as ClientRepository;

  return new SummaryService(services, clients);
}

describe('SummaryService', () => {
  it('el total de clientes es la suma de todos los estados', async () => {
    const summary = await createService(3).getSummary();

    expect(summary.totalClients).toBe(10);
  });

  it('cuenta los servicios', async () => {
    expect((await createService(4).getSummary()).totalServices).toBe(4);
  });

  it('entrega el desglose por estado tal cual', async () => {
    const summary = await createService(1).getSummary();

    expect(summary.clientsByStatus).toEqual({ active: 7, pending: 2, inactive: 1 });
  });

  it('sin clientes el total es cero', async () => {
    const summary = await createService(0, { active: 0, pending: 0, inactive: 0 }).getSummary();

    expect(summary).toEqual({
      totalClients: 0,
      totalServices: 0,
      clientsByStatus: { active: 0, pending: 0, inactive: 0 },
    });
  });
});
