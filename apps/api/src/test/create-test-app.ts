import { createApp } from '../app.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PasswordChangeService } from '../modules/auth/password-change.service.js';
import { SessionCookie } from '../modules/auth/session-cookie.js';
import { SessionService } from '../modules/auth/session.service.js';
import { MongoClientRepository } from '../modules/clients/mongo-client.repository.js';
import { MongoNotificationRepository } from '../modules/notifications/mongo-notification.repository.js';
import { NotificationService } from '../modules/notifications/notification.service.js';
import { SummaryService } from '../modules/summary/summary.service.js';
import { CatalogService } from '../modules/services/catalog.service.js';
import { MongoServiceRepository } from '../modules/services/mongo-service.repository.js';
import { MongoUserRepository } from '../modules/users/mongo-user.repository.js';
import type { RateLimitOptions } from '../shared/http/rate-limiter.js';
import { BcryptPasswordHasher } from '../shared/security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../shared/security/jwt-token-service.js';
import { RandomPasswordGenerator } from '../shared/security/random-password-generator.js';
import { InMemoryEmailSender } from './in-memory-email-sender.js';
import { ManualClock } from './manual-clock.js';

export const TEST_TEMP_PASSWORD_TTL_MS = 15 * 60_000;
export const TEST_REQUEST_COOLDOWN_MS = 60_000;
export const TEST_LOGIN_URL = 'http://localhost:8080/login';
export const TEST_JWT_SECRET = 'un-secreto-de-pruebas-suficientemente-largo';
export const TEST_SESSION_SECONDS = 3600;
export const TEST_COOKIE_NAME = 'session';

const PERMISSIVE_RATE_LIMIT: RateLimitOptions = { windowMs: 60_000, limit: 1000 };

interface TestAppOptions {
  accountRateLimit?: RateLimitOptions;
  loginRateLimit?: RateLimitOptions;
  cookieSecure?: boolean;
}

export function createTestApp({
  accountRateLimit = PERMISSIVE_RATE_LIMIT,
  loginRateLimit = PERMISSIVE_RATE_LIMIT,
  cookieSecure = false,
}: TestAppOptions = {}) {
  const emailSender = new InMemoryEmailSender();
  const clock = new ManualClock();
  const users = new MongoUserRepository();
  const serviceRepository = new MongoServiceRepository();
  const clientRepository = new MongoClientRepository();
  const notificationRepository = new MongoNotificationRepository();
  const notificationService = new NotificationService(notificationRepository, clock.now);
  const hasher = new BcryptPasswordHasher(4);
  const tokenService = new JwtTokenService(TEST_JWT_SECRET, TEST_SESSION_SECONDS);

  const authService = new AuthService({
    users,
    hasher,
    passwordGenerator: new RandomPasswordGenerator(),
    emailSender,
    notifications: notificationService,
    now: clock.now,
    tempPasswordTtlMs: TEST_TEMP_PASSWORD_TTL_MS,
    requestCooldownMs: TEST_REQUEST_COOLDOWN_MS,
    loginUrl: TEST_LOGIN_URL,
  });

  const sessionService = new SessionService({
    users,
    hasher,
    tokens: tokenService,
    notifications: notificationService,
    now: clock.now,
  });

  const passwordChangeService = new PasswordChangeService({
    users,
    hasher,
    tokens: tokenService,
    notifications: notificationService,
    now: clock.now,
  });

  const sessionCookie = new SessionCookie({
    name: TEST_COOKIE_NAME,
    secure: cookieSecure,
    maxAgeMs: TEST_SESSION_SECONDS * 1000,
  });

  const app = createApp({
    authService,
    sessionService,
    passwordChangeService,
    catalogService: new CatalogService(serviceRepository, clientRepository),
    summaryService: new SummaryService(serviceRepository, clientRepository),
    notificationService,
    tokenService,
    sessionCookie,
    accountRateLimit,
    loginRateLimit,
    trustProxy: false,
  });

  return {
    app,
    emailSender,
    clock,
    users,
    serviceRepository,
    clientRepository,
    notificationRepository,
    hasher,
    tokenService,
  };
}
