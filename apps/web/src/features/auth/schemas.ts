import { z } from 'zod';
import { meetsPasswordPolicy } from './password-policy';

const EMAIL_REQUIRED_MESSAGE = 'Ingresa tu correo electrónico';
const EMAIL_INVALID_MESSAGE = 'Ingresa un correo electrónico válido';
const PASSWORD_REQUIRED_MESSAGE = 'Ingresa tu contraseña';
const NEW_PASSWORD_REQUIRED_MESSAGE = 'Ingresa tu nueva contraseña';
const NEW_PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.';
const CONFIRM_PASSWORD_REQUIRED_MESSAGE = 'Repite tu nueva contraseña';
const PASSWORDS_DO_NOT_MATCH_MESSAGE = 'Las contraseñas no coinciden';
const MAX_PASSWORD_LENGTH = 128;

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

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, NEW_PASSWORD_REQUIRED_MESSAGE)
      .max(MAX_PASSWORD_LENGTH, NEW_PASSWORD_POLICY_MESSAGE)
      .refine(meetsPasswordPolicy, NEW_PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string().min(1, CONFIRM_PASSWORD_REQUIRED_MESSAGE),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: PASSWORDS_DO_NOT_MATCH_MESSAGE,
    path: ['confirmPassword'],
  });

export const sessionSchema = z.object({
  email: z.string(),
  requiresPasswordChange: z.boolean(),
});

export const meResponseSchema = z.object({
  session: sessionSchema.nullable(),
});

export type EmailRequestValues = z.infer<typeof emailRequestSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type Session = z.infer<typeof sessionSchema>;
