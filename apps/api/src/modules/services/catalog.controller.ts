import type { RequestHandler } from 'express';
import type { CatalogService } from './catalog.service.js';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  list: RequestHandler = async (_req, res) => {
    res.json({ services: await this.catalogService.listServices() });
  };
}
