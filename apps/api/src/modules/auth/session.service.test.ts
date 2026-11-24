import { describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/app-error.js';
import { BcryptPasswordHasher } from '../../shared/security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../../shared/security/jwt-token-service.js';
import { ManualClock } from '../../test/manual-clock.js';
import type { User } from '../users/user.entity.js';
import type { UserRepository } from '../users/user.repository.js';
import { SessionService } from './session.service.js';

class CountingHasher extends BcryptPasswordHasher {
  verifications = 0;

  override verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    this.verifications++;
    return super.verify(plainPassword, passwordHash);
  }
}

function repositoryReturning(user: User | null): UserRepository {
  return {
    findByEmail: async () => user,
    findById: async () => user,
    create: async () => {
      throw new Error('no se usa en estos tests');
    },
    update: async () => null,
  };
}

function buildService(user: User | null) {
  const hasher = new CountingHasher(4);
  const service = new SessionService({
    users: repositoryReturning(user),
    hasher,
    tokens: new JwtTokenService('un-secreto-de-pruebas-suficientemente-largo', 3600),
    now: new ManualClock().now,
  });
  return { service, hasher };
}

const userWithoutCredentials: User = {
  id: 'user-1',
  email: 'ana@correo.com',
  passwordHash: null,
  tempPasswordHash: null,
  tempPasswordExpiresAt: null,
  lastTempRequestAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SessionService.login: no delatar qué cuentas existen por el tiempo de respuesta', () => {
  it('con un correo que no existe igual calcula un hash antes de rechazar', async () => {
    const { service, hasher } = buildService(null);

    await expect(service.login('nadie@correo.com', 'Secreta123')).rejects.toBeInstanceOf(AppError);

    expect(hasher.verifications).toBe(1);
  });

  it('con un usuario sin ninguna contraseña válida igual calcula un hash antes de rechazar', async () => {
    const { service, hasher } = buildService(userWithoutCredentials);

    await expect(service.login('ana@correo.com', 'Secreta123')).rejects.toBeInstanceOf(AppError);

    expect(hasher.verifications).toBe(1);
  });

  it('con un usuario sin credenciales rechaza con el mismo error que un correo inexistente', async () => {
    const unknown = buildService(null);
    const withoutCredentials = buildService(userWithoutCredentials);

    const unknownError = await unknown.service.login('x@correo.com', 'Secreta123').catch((e) => e);
    const withoutCredentialsError = await withoutCredentials.service
      .login('ana@correo.com', 'Secreta123')
      .catch((e) => e);

    expect(withoutCredentialsError).toMatchObject({
      statusCode: unknownError.statusCode,
      code: unknownError.code,
      message: unknownError.message,
    });
  });
});
