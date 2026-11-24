import { z } from 'zod';

const EMAIL_REQUIRED_MESSAGE = 'Ingresa tu correo electrónico';
const EMAIL_INVALID_MESSAGE = 'Ingresa un correo electrónico válido';
const PASSWORD_REQUIRED_MESSAGE = 'Ingresa tu contraseña';

const emailField = z
  .string()
  .trim()
  .min(1, EMAIL_REQUIRED_MESSAGE)
  .pipe(z.email(EMAIL_INVALID_MESSAGE));

export const emailRequestSchema = z.object({ email: emailField });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, PASSWORD_REQUIRED_MESSAGE),
});

export const sessionSchema = z.object({
  email: z.string(),
  requiresPasswordChange: z.boolean(),
});

export type EmailRequestValues = z.infer<typeof emailRequestSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type Session = z.infer<typeof sessionSchema>;
