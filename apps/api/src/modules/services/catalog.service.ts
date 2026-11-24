import type { ServiceRepository } from './service.repository.js';

export interface ServiceSummary {
  id: string;
  name: string;
  description: string;
  clientsCount: number;
  accentColor: string;
}

export class CatalogService {
  constructor(private readonly services: ServiceRepository) {}

  async listServices(): Promise<ServiceSummary[]> {
    const items = await this.services.findAll();

    return items.map(({ id, name, description, clientsCount, accentColor }) => ({
      id,
      name,
      description,
      clientsCount,
      accentColor,
    }));
  }
}
