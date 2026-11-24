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
