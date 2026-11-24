import type { RequestHandler } from 'express';
import { parseQuery } from '../../shared/http/parse-query.js';
import type { CatalogService } from './catalog.service.js';
import { clientsQuerySchema } from './clients-query.schema.js';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  list: RequestHandler = async (_req, res) => {
    res.json({ services: await this.catalogService.listServices() });
  };

  listClients: RequestHandler = async (req, res) => {
    const query = parseQuery(clientsQuerySchema, req.query);
    const serviceId = String(req.params.serviceId);

    res.json(await this.catalogService.listClients(serviceId, query));
  };
}
