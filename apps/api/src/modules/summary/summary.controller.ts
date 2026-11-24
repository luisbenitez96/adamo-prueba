import type { RequestHandler } from 'express';
import type { SummaryService } from './summary.service.js';

export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  get: RequestHandler = async (_req, res) => {
    res.json({ summary: await this.summaryService.getSummary() });
  };
}
