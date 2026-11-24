import { describe, expect, it } from 'vitest';
import { PASSWORD_HISTORY_SIZE, rememberedPasswordHistory } from './password-history.js';
import type { User } from './user.entity.js';

const NOW = new Date('2030-01-01T00:00:00.000Z');

function userWith(changes: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'ana@correo.com',
    passwordHash: null,
    passwordHistory: [],
    tempPasswordHash: null,
    tempPasswordExpiresAt: null,
    lastTempRequestAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...changes,
  };
}

describe('rememberedPasswordHistory', () => {
  it('recuerda las últimas 5 contraseñas anteriores', () => {
    expect(PASSWORD_HISTORY_SIZE).toBe(5);
  });

  it('un usuario sin contraseña propia no agrega nada', () => {
    expect(rememberedPasswordHistory(userWith({}))).toEqual([]);
  });

  it('la contraseña que se reemplaza pasa al principio del historial', () => {
    const user = userWith({ passwordHash: 'actual', passwordHistory: ['vieja1', 'vieja2'] });

    expect(rememberedPasswordHistory(user)).toEqual(['actual', 'vieja1', 'vieja2']);
  });

  it('descarta las más antiguas cuando pasa del límite', () => {
    const user = userWith({
      passwordHash: 'actual',
      passwordHistory: ['h1', 'h2', 'h3', 'h4', 'h5'],
    });

    expect(rememberedPasswordHistory(user)).toEqual(['actual', 'h1', 'h2', 'h3', 'h4']);
  });

  it('no modifica el usuario recibido', () => {
    const user = userWith({ passwordHash: 'actual', passwordHistory: ['h1'] });

    rememberedPasswordHistory(user);

    expect(user.passwordHistory).toEqual(['h1']);
  });
});
