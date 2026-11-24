import nodemailer from 'nodemailer';
import type { AppDependencies } from './app.js';
import type { Env } from './config/env.js';
import { AuthService } from './modules/auth/auth.service.js';
import { PasswordChangeService } from './modules/auth/password-change.service.js';
import { SessionCookie } from './modules/auth/session-cookie.js';
import { SessionService } from './modules/auth/session.service.js';
import { CatalogService } from './modules/services/catalog.service.js';
import { MongoServiceRepository } from './modules/services/mongo-service.repository.js';
import { MongoUserRepository } from './modules/users/mongo-user.repository.js';
import { NodemailerEmailSender } from './shared/email/nodemailer-email-sender.js';
import { BcryptPasswordHasher } from './shared/security/bcrypt-password-hasher.js';
import { JwtTokenService } from './shared/security/jwt-token-service.js';
import { RandomPasswordGenerator } from './shared/security/random-password-generator.js';

const MILLISECONDS_PER_MINUTE = 60_000;
const SECONDS_PER_MINUTE = 60;
const REQUEST_COOLDOWN_MS = MILLISECONDS_PER_MINUTE;
const SESSION_COOKIE_NAME = 'session';
const ACCOUNT_RATE_LIMIT = { windowMs: 15 * MILLISECONDS_PER_MINUTE, limit: 20 };
const LOGIN_RATE_LIMIT = {
  windowMs: 15 * MILLISECONDS_PER_MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
};

function createEmailSender(env: Env): NodemailerEmailSender {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  return new NodemailerEmailSender(transporter, env.MAIL_FROM);
}

export function createAppDependencies(env: Env): AppDependencies {
  const users = new MongoUserRepository();
  const hasher = new BcryptPasswordHasher();
  const now = () => new Date();
  const sessionMinutes = env.JWT_EXPIRES_IN_MINUTES;
  const tokenService = new JwtTokenService(env.JWT_SECRET, sessionMinutes * SECONDS_PER_MINUTE);

  const authService = new AuthService({
    users,
    hasher,
    passwordGenerator: new RandomPasswordGenerator(),
    emailSender: createEmailSender(env),
    now,
    tempPasswordTtlMs: env.TEMP_PASSWORD_TTL_MINUTES * MILLISECONDS_PER_MINUTE,
    requestCooldownMs: REQUEST_COOLDOWN_MS,
    loginUrl: `${env.APP_URL}/login`,
  });

  const sessionService = new SessionService({ users, hasher, tokens: tokenService, now });

  const passwordChangeService = new PasswordChangeService({
    users,
    hasher,
    tokens: tokenService,
    now,
  });

  const sessionCookie = new SessionCookie({
    name: SESSION_COOKIE_NAME,
    secure: env.COOKIE_SECURE,
    maxAgeMs: sessionMinutes * MILLISECONDS_PER_MINUTE,
  });

  return {
    authService,
    sessionService,
    passwordChangeService,
    catalogService: new CatalogService(new MongoServiceRepository()),
    tokenService,
    sessionCookie,
    accountRateLimit: ACCOUNT_RATE_LIMIT,
    loginRateLimit: LOGIN_RATE_LIMIT,
    trustProxy: env.TRUST_PROXY,
  };
}
