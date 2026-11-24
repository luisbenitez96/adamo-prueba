import { z } from 'zod';

const PAGE_MESSAGE = 'La página debe ser un número entero mayor a 0';
const PAGE_SIZE_MESSAGE = 'El tamaño de página debe estar entre 1 y 100';
const SEARCH_MESSAGE = 'La búsqueda no puede tener más de 100 caracteres';

export const DEFAULT_PAGE_SIZE = 20;

export const clientsQuerySchema = z.object({
  page: z.coerce.number({ error: PAGE_MESSAGE }).int(PAGE_MESSAGE).min(1, PAGE_MESSAGE).default(1),
  pageSize: z.coerce
    .number({ error: PAGE_SIZE_MESSAGE })
    .int(PAGE_SIZE_MESSAGE)
    .min(1, PAGE_SIZE_MESSAGE)
    .max(100, PAGE_SIZE_MESSAGE)
    .default(DEFAULT_PAGE_SIZE),
  search: z.string({ error: SEARCH_MESSAGE }).trim().max(100, SEARCH_MESSAGE).optional(),
});

export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
