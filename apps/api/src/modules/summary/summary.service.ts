import type { ClientStatus } from '../clients/client.entity.js';
import type { ClientRepository } from '../clients/client.repository.js';
import type { ServiceRepository } from '../services/service.repository.js';

export interface Summary {
  totalClients: number;
  totalServices: number;
  clientsByStatus: Record<ClientStatus, number>;
}

export class SummaryService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly clients: ClientRepository,
  ) {}

  async getSummary(): Promise<Summary> {
    const [serviceItems, clientsByStatus] = await Promise.all([
      this.services.findAll(),
      this.clients.countByStatus(),
    ]);
    const totalClients = Object.values(clientsByStatus).reduce((sum, count) => sum + count, 0);

    return { totalClients, totalServices: serviceItems.length, clientsByStatus };
  }
}
