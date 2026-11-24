import type { ClientItem, ClientStatus, NewClient } from './client.entity.js';

export interface ClientPageQuery {
  serviceId: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ClientPage {
  items: ClientItem[];
  total: number;
}

export interface ClientRepository {
  countByService(): Promise<Map<string, number>>;
  countByStatus(): Promise<Record<ClientStatus, number>>;
  countForService(serviceId: string): Promise<number>;
  insertMany(clients: NewClient[]): Promise<void>;
  findPage(query: ClientPageQuery): Promise<ClientPage>;
}
