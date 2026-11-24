import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/app-error.js';
import { createErrorHandler } from './error-handler.js';

function buildApp(logger: Pick<Console, 'error'>) {
  const app = express();

  app.get('/app-error', () => {
    throw new AppError(401, 'UNAUTHORIZED', 'No autorizado');
  });
  app.get('/boom', () => {
    throw new Error('conexión a mongo en 10.0.0.5 falló');
  });
  app.get('/async-boom', async () => {
    throw new Error('fallo async interno');
  });

  app.use(createErrorHandler(logger));
  return app;
}

describe('createErrorHandler', () => {
  it('traduce un AppError a su código HTTP y su mensaje', async () => {
    const logger = { error: vi.fn() };

    const response = await request(buildApp(logger)).get('/app-error');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'No autorizado' } });
  });

  it('no registra en el log los errores esperados', async () => {
    const logger = { error: vi.fn() };

    await request(buildApp(logger)).get('/app-error');

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('un error inesperado responde 500 genérico sin filtrar detalles internos', async () => {
    const logger = { error: vi.fn() };

    const response = await request(buildApp(logger)).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    });
    expect(JSON.stringify(response.body)).not.toContain('mongo');
  });

  it('registra el error inesperado completo en el log', async () => {
    const logger = { error: vi.fn() };

    await request(buildApp(logger)).get('/boom');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it('también captura errores lanzados en handlers async (Express 5)', async () => {
    const logger = { error: vi.fn() };

    const response = await request(buildApp(logger)).get('/async-boom');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });
});
