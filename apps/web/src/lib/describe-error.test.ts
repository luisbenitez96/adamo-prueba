import { describe, expect, it } from 'vitest';
import { describeError } from './describe-error';
import { ApiError } from './http';

describe('describeError', () => {
  it('muestra el mensaje que envía el servidor en errores de la petición (4xx)', () => {
    const error = new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');

    expect(describeError(error)).toBe('Correo o contraseña incorrectos');
  });

  it('muestra el mensaje de falta de conexión', () => {
    const error = new ApiError(0, 'NETWORK_ERROR', 'No pudimos conectar con el servidor.');

    expect(describeError(error)).toBe('No pudimos conectar con el servidor.');
  });

  it('en errores del servidor (5xx) no expone el mensaje interno', () => {
    const error = new ApiError(500, 'INTERNAL_ERROR', 'Mongo caído en 10.0.0.5');

    expect(describeError(error)).toBe(
      'Tuvimos un problema en el servidor. Inténtalo de nuevo en unos minutos.',
    );
  });

  it('con cualquier otro error usa un mensaje genérico', () => {
    expect(describeError(new TypeError('x is undefined'))).toBe(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
    expect(describeError('texto')).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
