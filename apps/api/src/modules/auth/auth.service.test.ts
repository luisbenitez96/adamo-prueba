import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../shared/security/bcrypt-password-hasher.js';
import { RandomPasswordGenerator } from '../../shared/security/random-password-generator.js';
import { RecordingNotificationPublisher } from '../../test/recording-notification-publisher.js';
import { InMemoryEmailSender } from '../../test/in-memory-email-sender.js';
import { ManualClock } from '../../test/manual-clock.js';
import { DuplicateEmailError } from '../users/duplicate-email-error.js';
import type { UserRepository } from '../users/user.repository.js';
import { AuthService } from './auth.service.js';

describe('AuthService.register', () => {
  it('si otro registro creó el mismo correo a la vez, responde correo duplicado y no envía nada', async () => {
    const emailSender = new InMemoryEmailSender();
    const usersLosingTheRace: UserRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async () => {
        throw new DuplicateEmailError();
      },
      update: async () => null,
    };
    const service = new AuthService({
      users: usersLosingTheRace,
      hasher: new BcryptPasswordHasher(4),
      passwordGenerator: new RandomPasswordGenerator(),
      emailSender,
      notifications: new RecordingNotificationPublisher(),
      now: new ManualClock().now,
      tempPasswordTtlMs: 900_000,
      requestCooldownMs: 60_000,
      loginUrl: 'http://localhost:8080/login',
    });

    await expect(service.register('ana@correo.com')).rejects.toBeInstanceOf(DuplicateEmailError);
    expect(emailSender.sent).toHaveLength(0);
  });

  it('propaga cualquier otro error del repositorio', async () => {
    const brokenUsers: UserRepository = {
      findByEmail: async () => null,
      findById: async () => null,
      create: async () => {
        throw new Error('Mongo caído');
      },
      update: async () => null,
    };
    const service = new AuthService({
      users: brokenUsers,
      hasher: new BcryptPasswordHasher(4),
      passwordGenerator: new RandomPasswordGenerator(),
      emailSender: new InMemoryEmailSender(),
      notifications: new RecordingNotificationPublisher(),
      now: new ManualClock().now,
      tempPasswordTtlMs: 900_000,
      requestCooldownMs: 60_000,
      loginUrl: 'http://localhost:8080/login',
    });

    await expect(service.register('ana@correo.com')).rejects.toThrow('Mongo caído');
  });
});
