import { describe, expect, it } from 'vitest';
import { activeTemporaryPasswordHash } from './temporary-password.js';
import type { User } from './user.entity.js';

const NOW = new Date('2030-01-01T12:00:00.000Z');

function userWith(changes: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'ana@correo.com',
    passwordHash: null,
    tempPasswordHash: null,
    tempPasswordExpiresAt: null,
    lastTempRequestAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...changes,
  };
}

describe('activeTemporaryPasswordHash', () => {
  it('devuelve el hash mientras la temporal no ha vencido', () => {
    const user = userWith({
      tempPasswordHash: 'hash-temporal',
      tempPasswordExpiresAt: new Date(NOW.getTime() + 1000),
    });

    expect(activeTemporaryPasswordHash(user, NOW)).toBe('hash-temporal');
  });

  it('devuelve null cuando ya venció', () => {
    const user = userWith({
      tempPasswordHash: 'hash-temporal',
      tempPasswordExpiresAt: new Date(NOW.getTime() - 1000),
    });

    expect(activeTemporaryPasswordHash(user, NOW)).toBeNull();
  });

  it('devuelve null justo en el instante de vencer', () => {
    const user = userWith({ tempPasswordHash: 'hash-temporal', tempPasswordExpiresAt: NOW });

    expect(activeTemporaryPasswordHash(user, NOW)).toBeNull();
  });

  it('devuelve null si el usuario no tiene temporal', () => {
    expect(activeTemporaryPasswordHash(userWith({}), NOW)).toBeNull();
  });
});
