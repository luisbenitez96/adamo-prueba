import { http } from '../../../lib/http';
import { servicesResponseSchema } from '../schemas';
import type { Service } from '../schemas';

export const servicesApi = {
  async list(): Promise<Service[]> {
    const { services } = servicesResponseSchema.parse(await http.get('/api/services'));
    return services;
  },
};
