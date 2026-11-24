import nodemailer from 'nodemailer';
import type { AppDependencies } from './app.js';
import type { Env } from './config/env.js';
import { AuthService } from './modules/auth/auth.service.js';
import { MongoUserRepository } from './modules/users/mongo-user.repository.js';
import { NodemailerEmailSender } from './shared/email/nodemailer-email-sender.js';
import { BcryptPasswordHasher } from './shared/security/bcrypt-password-hasher.js';
import { RandomPasswordGenerator } from './shared/security/random-password-generator.js';

const MILLISECONDS_PER_MINUTE = 60_000;
const REQUEST_COOLDOWN_MS = MILLISECONDS_PER_MINUTE;
const AUTH_RATE_LIMIT = { windowMs: 15 * MILLISECONDS_PER_MINUTE, limit: 20 };

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
  const authService = new AuthService({
    users: new MongoUserRepository(),
    hasher: new BcryptPasswordHasher(),
    passwordGenerator: new RandomPasswordGenerator(),
    emailSender: createEmailSender(env),
    now: () => new Date(),
    tempPasswordTtlMs: env.TEMP_PASSWORD_TTL_MINUTES * MILLISECONDS_PER_MINUTE,
    requestCooldownMs: REQUEST_COOLDOWN_MS,
    loginUrl: `${env.APP_URL}/login`,
  });

  return { authService, authRateLimit: AUTH_RATE_LIMIT, trustProxy: env.TRUST_PROXY };
}
