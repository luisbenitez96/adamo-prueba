import { AppError } from '../../shared/errors/app-error.js';
import type { ClientStatus } from '../clients/client.entity.js';
import type { ClientRepository } from '../clients/client.repository.js';
import type { ClientsQuery } from './clients-query.schema.js';
import type { ServiceRepository } from './service.repository.js';

export interface ServiceSummary {
  id: string;
  name: string;
  description: string;
  clientsCount: number;
  accentColor: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: ClientStatus;
  registeredAt: Date;
}

export interface ClientsPage {
  service: Pick<ServiceSummary, 'id' | 'name' | 'accentColor'>;
  clients: ClientSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class CatalogService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly clients: ClientRepository,
  ) {}

  async listServices(): Promise<ServiceSummary[]> {
    const [items, clientsByService] = await Promise.all([
      this.services.findAll(),
      this.clients.countByService(),
    ]);

    return items.map(({ id, name, description, accentColor }) => ({
      id,
      name,
      description,
      clientsCount: clientsByService.get(id) ?? 0,
      accentColor,
    }));
  }

  async listClients(
    serviceId: string,
    { page, pageSize, search }: ClientsQuery,
  ): Promise<ClientsPage> {
    const service = await this.services.findById(serviceId);

    if (!service) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servicio no encontrado');
    }

    const { items, total } = await this.clients.findPage({ serviceId, search, page, pageSize });

    return {
      service: { id: service.id, name: service.name, accentColor: service.accentColor },
      clients: items.map(({ id, name, email, phone, city, status, registeredAt }) => ({
        id,
        name,
        email,
        phone,
        city,
        status,
        registeredAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }
}
