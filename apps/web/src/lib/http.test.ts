import { delay, http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server';
import { ApiError, http } from './http';

describe('http', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    server.use(mswHttp.get('*/api/ping', () => HttpResponse.json({ ok: true })));

    expect(await http.get('/api/ping')).toEqual({ ok: true });
  });

  it('envía el cuerpo como JSON con la cabecera correspondiente', async () => {
    let received: { body: unknown; contentType: string | null } | null = null;
    server.use(
      mswHttp.post('*/api/echo', async ({ request }) => {
        received = { body: await request.json(), contentType: request.headers.get('content-type') };
        return HttpResponse.json({});
      }),
    );

    await http.post('/api/echo', { email: 'ana@correo.com' });

    expect(received).toEqual({
      body: { email: 'ana@correo.com' },
      contentType: 'application/json',
    });
  });

  it('una respuesta 204 devuelve undefined', async () => {
    server.use(mswHttp.post('*/api/logout', () => new HttpResponse(null, { status: 204 })));

    expect(await http.post('/api/logout')).toBeUndefined();
  });

  describe('errores del servidor', () => {
    it('convierte el cuerpo de error en un ApiError con estado, código y mensaje', async () => {
      server.use(
        mswHttp.post('*/api/login', () =>
          HttpResponse.json(
            { error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' } },
            { status: 401 },
          ),
        ),
      );

      const error = await http.post('/api/login', {}).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });
    });

    it('si el error no trae el formato esperado usa un mensaje genérico', async () => {
      server.use(
        mswHttp.get('*/api/roto', () => HttpResponse.json({ algo: 'raro' }, { status: 500 })),
      );

      const error = await http.get('/api/roto').catch((e: unknown) => e);

      expect(error).toMatchObject({
        status: 500,
        code: 'UNKNOWN_ERROR',
        message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      });
    });

    it('si el error no es JSON (por ejemplo una página HTML) también usa el genérico', async () => {
      server.use(
        mswHttp.get('*/api/html', () => new HttpResponse('<h1>Bad gateway</h1>', { status: 502 })),
      );

      const error = await http.get('/api/html').catch((e: unknown) => e);

      expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
    });

    it('ignora códigos y mensajes que no son texto', async () => {
      server.use(
        mswHttp.get('*/api/raro', () =>
          HttpResponse.json({ error: { code: 42, message: { x: 1 } } }, { status: 400 }),
        ),
      );

      const error = await http.get('/api/raro').catch((e: unknown) => e);

      expect(error).toMatchObject({ code: 'UNKNOWN_ERROR', message: expect.any(String) });
    });
  });

  it('si no hay conexión lanza un ApiError de red con estado 0', async () => {
    server.use(mswHttp.get('*/api/ping', () => HttpResponse.error()));

    const error = await http.get('/api/ping').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('espera la respuesta antes de resolver', async () => {
    server.use(
      mswHttp.get('*/api/lento', async () => {
        await delay(20);
        return HttpResponse.json({ listo: true });
      }),
    );

    expect(await http.get('/api/lento')).toEqual({ listo: true });
  });
});
