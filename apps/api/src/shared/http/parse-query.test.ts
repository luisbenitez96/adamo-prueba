import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { parseQuery } from './parse-query.js';

const schema = z.object({
  page: z.coerce.number().int().min(1, 'Página inválida').default(1),
});

describe('parseQuery', () => {
  it('devuelve los datos ya convertidos cuando son válidos', () => {
    expect(parseQuery(schema, { page: '4' })).toEqual({ page: 4 });
  });

  it('aplica los valores por defecto', () => {
    expect(parseQuery(schema, {})).toEqual({ page: 1 });
  });

  it('si no son válidos lanza un AppError 400 con el mensaje de la regla incumplida', () => {
    expect.assertions(4);

    try {
      parseQuery(schema, { page: '0' });
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
      expect((error as AppError).message).toBe('Página inválida');
    }
  });
});
