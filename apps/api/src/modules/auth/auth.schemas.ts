import { z } from 'zod';

const INVALID_EMAIL_MESSAGE = 'Ingresa un correo electrónico válido';
const PASSWORD_REQUIRED_MESSAGE = 'Ingresa tu contraseña';
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

const emailField = z
  .string({ error: INVALID_EMAIL_MESSAGE })
  .trim()
  .max(MAX_EMAIL_LENGTH, INVALID_EMAIL_MESSAGE)
  .pipe(z.email({ error: INVALID_EMAIL_MESSAGE }));

export const emailRequestSchema = z.object({ email: emailField });

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: PASSWORD_REQUIRED_MESSAGE })
    .min(1, PASSWORD_REQUIRED_MESSAGE)
    .max(MAX_PASSWORD_LENGTH, PASSWORD_REQUIRED_MESSAGE),
});

export type EmailRequestBody = z.infer<typeof emailRequestSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;
