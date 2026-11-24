import { http } from '../../../lib/http';
import { clientsPageSchema } from '../schemas';
import type { ClientsPage } from '../schemas';

export const CLIENTS_PAGE_SIZE = 20;

export interface ClientsQuery {
  page: number;
  search: string;
}

export const clientsApi = {
  async list(serviceId: string, { page, search }: ClientsQuery): Promise<ClientsPage> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(CLIENTS_PAGE_SIZE) });

    if (search) {
      params.set('search', search);
    }

    return clientsPageSchema.parse(
      await http.get(`/api/services/${encodeURIComponent(serviceId)}/clients?${params}`),
    );
  },
};
