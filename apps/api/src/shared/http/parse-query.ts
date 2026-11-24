import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

export function parseQuery<T>(schema: ZodType<T>, query: unknown): T {
  const result = schema.safeParse(query);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Los parámetros enviados no son válidos';
    throw new AppError(400, 'VALIDATION_ERROR', message);
  }

  return result.data;
}
