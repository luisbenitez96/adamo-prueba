import { http } from '../../../lib/http';
import { summaryResponseSchema } from '../schemas';
import type { Summary } from '../schemas';

export const summaryApi = {
  async get(): Promise<Summary> {
    const { summary } = summaryResponseSchema.parse(await http.get('/api/summary'));
    return summary;
  },
};
