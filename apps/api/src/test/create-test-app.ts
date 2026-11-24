import { createApp } from '../app.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { MongoUserRepository } from '../modules/users/mongo-user.repository.js';
import type { RateLimitOptions } from '../shared/http/rate-limiter.js';
import { BcryptPasswordHasher } from '../shared/security/bcrypt-password-hasher.js';
import { RandomPasswordGenerator } from '../shared/security/random-password-generator.js';
import { InMemoryEmailSender } from './in-memory-email-sender.js';
import { ManualClock } from './manual-clock.js';

export const TEST_TEMP_PASSWORD_TTL_MS = 15 * 60_000;
export const TEST_REQUEST_COOLDOWN_MS = 60_000;
export const TEST_LOGIN_URL = 'http://localhost:8080/login';

const PERMISSIVE_RATE_LIMIT: RateLimitOptions = { windowMs: 60_000, limit: 1000 };

interface TestAppOptions {
  authRateLimit?: RateLimitOptions;
}

export function createTestApp({ authRateLimit = PERMISSIVE_RATE_LIMIT }: TestAppOptions = {}) {
  const emailSender = new InMemoryEmailSender();
  const clock = new ManualClock();
  const users = new MongoUserRepository();
  const hasher = new BcryptPasswordHasher(4);

  const authService = new AuthService({
    users,
    hasher,
    passwordGenerator: new RandomPasswordGenerator(),
    emailSender,
    now: clock.now,
    tempPasswordTtlMs: TEST_TEMP_PASSWORD_TTL_MS,
    requestCooldownMs: TEST_REQUEST_COOLDOWN_MS,
    loginUrl: TEST_LOGIN_URL,
  });

  const app = createApp({ authService, authRateLimit, trustProxy: false });

  return { app, emailSender, clock, users, hasher };
}
