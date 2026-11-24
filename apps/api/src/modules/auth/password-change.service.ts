import { AppError } from '../../shared/errors/app-error.js';
import { InvalidSessionError } from '../../shared/errors/invalid-session-error.js';
import type { PasswordHasher } from '../../shared/security/password-hasher.js';
import type { TokenScope, TokenService } from '../../shared/security/token-service.js';
import type { NotificationPublisher } from '../notifications/notification-publisher.js';
import { PASSWORD_HISTORY_SIZE, rememberedPasswordHistory } from '../users/password-history.js';
import { activeTemporaryPasswordHash } from '../users/temporary-password.js';
import type { UserRepository } from '../users/user.repository.js';
import type { Session } from './session.service.js';

export interface PasswordChangeServiceDependencies {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  notifications: NotificationPublisher;
  now: () => Date;
}

export class PasswordChangeService {
  constructor(private readonly dependencies: PasswordChangeServiceDependencies) {}

  async changePassword(userId: string, scope: TokenScope, newPassword: string): Promise<Session> {
    const { users, hasher, tokens, notifications, now } = this.dependencies;

    if (scope !== 'password-change') {
      throw new AppError(403, 'PASSWORD_CHANGE_NOT_REQUIRED', 'Tu contraseña ya está definida');
    }

    const user = await users.findById(userId);

    if (!user) {
      throw new InvalidSessionError();
    }

    const temporaryPasswordHash = activeTemporaryPasswordHash(user, now());

    if (!temporaryPasswordHash) {
      throw new AppError(
        401,
        'TEMPORARY_PASSWORD_EXPIRED',
        'Tu contraseña temporal venció, solicita una nueva',
      );
    }

    const unavailableHashes = [
      temporaryPasswordHash,
      ...(user.passwordHash ? [user.passwordHash] : []),
      ...user.passwordHistory,
    ];
    const matches = await Promise.all(
      unavailableHashes.map((hash) => hasher.verify(newPassword, hash)),
    );

    if (matches.some(Boolean)) {
      throw new AppError(
        400,
        'PASSWORD_REUSED',
        `No puedes reutilizar tu contraseña actual ni ninguna de las últimas ${PASSWORD_HISTORY_SIZE} anteriores`,
      );
    }

    const updatedUser = await users.update(user.id, {
      passwordHash: await hasher.hash(newPassword),
      passwordHistory: rememberedPasswordHistory(user),
      tempPasswordHash: null,
      tempPasswordExpiresAt: null,
    });

    if (!updatedUser) {
      throw new InvalidSessionError();
    }

    await notifications.publish(updatedUser.id, 'password-changed');

    return {
      token: tokens.sign({ sub: updatedUser.id, scope: 'full' }),
      email: updatedUser.email,
      requiresPasswordChange: false,
    };
  }
}
