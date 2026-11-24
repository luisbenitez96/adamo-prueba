import { randomUUID } from 'node:crypto';
import { AppError } from '../../shared/errors/app-error.js';
import { InvalidSessionError } from '../../shared/errors/invalid-session-error.js';
import type { PasswordHasher } from '../../shared/security/password-hasher.js';
import type { TokenScope, TokenService } from '../../shared/security/token-service.js';
import { activeTemporaryPasswordHash } from '../users/temporary-password.js';
import type { User } from '../users/user.entity.js';
import type { UserRepository } from '../users/user.repository.js';

export interface SessionServiceDependencies {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  now: () => Date;
}

export interface CurrentUser {
  email: string;
  requiresPasswordChange: boolean;
}

export interface Session extends CurrentUser {
  token: string;
}

function invalidCredentials(): AppError {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
}

export class SessionService {
  private placeholderHash: Promise<string> | null = null;

  constructor(private readonly dependencies: SessionServiceDependencies) {}

  async login(email: string, password: string): Promise<Session> {
    const user = await this.dependencies.users.findByEmail(email);

    if (!user) {
      await this.spendHashingTime(password);
      throw invalidCredentials();
    }

    const scope = await this.resolveScope(user, password);

    if (!scope) {
      throw invalidCredentials();
    }

    return {
      token: this.dependencies.tokens.sign({ sub: user.id, scope }),
      email: user.email,
      requiresPasswordChange: scope === 'password-change',
    };
  }

  async currentUser(userId: string, scope: TokenScope): Promise<CurrentUser> {
    const user = await this.dependencies.users.findById(userId);

    if (!user) {
      throw new InvalidSessionError();
    }

    return { email: user.email, requiresPasswordChange: scope === 'password-change' };
  }

  private async resolveScope(user: User, password: string): Promise<TokenScope | null> {
    const { hasher } = this.dependencies;
    const temporaryPasswordHash = activeTemporaryPasswordHash(user, this.dependencies.now());

    if (!user.passwordHash && !temporaryPasswordHash) {
      await this.spendHashingTime(password);
      return null;
    }

    if (user.passwordHash && (await hasher.verify(password, user.passwordHash))) {
      return 'full';
    }

    if (temporaryPasswordHash && (await hasher.verify(password, temporaryPasswordHash))) {
      return 'password-change';
    }

    return null;
  }

  private async spendHashingTime(password: string): Promise<void> {
    this.placeholderHash ??= this.dependencies.hasher.hash(randomUUID());
    await this.dependencies.hasher.verify(password, await this.placeholderHash);
  }
}
