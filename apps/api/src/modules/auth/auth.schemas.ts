import { z } from 'zod';
import {
  meetsPasswordPolicy,
  PASSWORD_POLICY_MESSAGE,
} from '../../shared/security/password-policy.js';

const INVALID_EMAIL_MESSAGE = 'Ingresa un correo electrónico válido';
const PASSWORD_REQUIRED_MESSAGE = 'Ingresa tu contraseña';
const PASSWORDS_DO_NOT_MATCH_MESSAGE = 'Las contraseñas no coinciden';
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

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string({ error: PASSWORD_POLICY_MESSAGE })
      .max(MAX_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE)
      .refine(meetsPasswordPolicy, PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string({ error: PASSWORDS_DO_NOT_MATCH_MESSAGE }),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: PASSWORDS_DO_NOT_MATCH_MESSAGE,
    path: ['confirmPassword'],
  });

export type EmailRequestBody = z.infer<typeof emailRequestSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;
export type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
