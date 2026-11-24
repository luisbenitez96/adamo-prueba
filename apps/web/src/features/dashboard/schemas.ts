import { z } from 'zod';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  clientsCount: z.number().int().min(0),
  accentColor: z.string().regex(HEX_COLOR),
});

export const servicesResponseSchema = z.object({
  services: z.array(serviceSchema),
});

export type Service = z.infer<typeof serviceSchema>;

export const CLIENT_STATUSES = ['active', 'pending', 'inactive'] as const;

export const clientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
  phone: z.string(),
  city: z.string(),
  status: z.enum(CLIENT_STATUSES),
  registeredAt: z.iso.datetime(),
});

export const clientsPageSchema = z.object({
  service: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    accentColor: z.string().regex(HEX_COLOR),
  }),
  clients: z.array(clientSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  }),
});

export type Client = z.infer<typeof clientSchema>;
export type ClientStatus = Client['status'];
export type ClientsPage = z.infer<typeof clientsPageSchema>;
