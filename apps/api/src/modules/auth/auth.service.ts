import type { EmailSender } from '../../shared/email/email-sender.js';
import type { PasswordGenerator } from '../../shared/security/password-generator.js';
import type { PasswordHasher } from '../../shared/security/password-hasher.js';
import type { NotificationPublisher } from '../notifications/notification-publisher.js';
import { AccountNotFoundError } from '../users/account-not-found-error.js';
import { DuplicateEmailError } from '../users/duplicate-email-error.js';
import type { User } from '../users/user.entity.js';
import type { UserRepository } from '../users/user.repository.js';
import { buildPasswordResetEmail, buildWelcomeEmail } from './auth-emails.js';

const MILLISECONDS_PER_MINUTE = 60_000;

export interface AuthServiceDependencies {
  users: UserRepository;
  hasher: PasswordHasher;
  passwordGenerator: PasswordGenerator;
  emailSender: EmailSender;
  notifications: NotificationPublisher;
  now: () => Date;
  tempPasswordTtlMs: number;
  requestCooldownMs: number;
  loginUrl: string;
}

interface TemporaryCredentials {
  temporaryPassword: string;
  tempPasswordHash: string;
  tempPasswordExpiresAt: Date;
}

export class AuthService {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async register(email: string): Promise<void> {
    const existingUser = await this.dependencies.users.findByEmail(email);

    if (existingUser) {
      throw new DuplicateEmailError();
    }

    await this.createAccount(email);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.dependencies.users.findByEmail(email);

    if (!user) {
      throw new AccountNotFoundError();
    }

    if (this.isInCooldown(user)) {
      return;
    }

    const credentials = await this.issueTemporaryCredentials();
    await this.dependencies.users.update(user.id, {
      tempPasswordHash: credentials.tempPasswordHash,
      tempPasswordExpiresAt: credentials.tempPasswordExpiresAt,
      lastTempRequestAt: this.dependencies.now(),
    });
    await this.dependencies.emailSender.send(
      buildPasswordResetEmail({ to: user.email, ...this.emailData(credentials) }),
    );
    await this.dependencies.notifications.publish(user.id, 'temporary-password-requested');
  }

  private async createAccount(email: string): Promise<void> {
    const credentials = await this.issueTemporaryCredentials();

    const user = await this.dependencies.users.create({
      email,
      tempPasswordHash: credentials.tempPasswordHash,
      tempPasswordExpiresAt: credentials.tempPasswordExpiresAt,
      lastTempRequestAt: this.dependencies.now(),
    });

    await this.dependencies.emailSender.send(
      buildWelcomeEmail({ to: user.email, ...this.emailData(credentials) }),
    );
    await this.dependencies.notifications.publish(user.id, 'account-created');
  }

  private async issueTemporaryCredentials(): Promise<TemporaryCredentials> {
    const temporaryPassword = this.dependencies.passwordGenerator.generate();

    return {
      temporaryPassword,
      tempPasswordHash: await this.dependencies.hasher.hash(temporaryPassword),
      tempPasswordExpiresAt: new Date(
        this.dependencies.now().getTime() + this.dependencies.tempPasswordTtlMs,
      ),
    };
  }

  private emailData({ temporaryPassword }: TemporaryCredentials) {
    return {
      temporaryPassword,
      expiresInMinutes: this.dependencies.tempPasswordTtlMs / MILLISECONDS_PER_MINUTE,
      loginUrl: this.dependencies.loginUrl,
    };
  }

  private isInCooldown(user: User): boolean {
    if (!user.lastTempRequestAt) {
      return false;
    }
    const elapsedMs = this.dependencies.now().getTime() - user.lastTempRequestAt.getTime();
    return elapsedMs < this.dependencies.requestCooldownMs;
  }
}
