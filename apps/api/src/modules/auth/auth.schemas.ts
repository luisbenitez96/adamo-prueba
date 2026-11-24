import { z } from 'zod';

const INVALID_EMAIL_MESSAGE = 'Ingresa un correo electrónico válido';
const MAX_EMAIL_LENGTH = 254;

export const emailRequestSchema = z.object({
  email: z
    .string({ error: INVALID_EMAIL_MESSAGE })
    .trim()
    .max(MAX_EMAIL_LENGTH, INVALID_EMAIL_MESSAGE)
    .pipe(z.email({ error: INVALID_EMAIL_MESSAGE })),
});

export type EmailRequestBody = z.infer<typeof emailRequestSchema>;
