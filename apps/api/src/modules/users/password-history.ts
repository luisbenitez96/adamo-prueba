import type { User } from './user.entity.js';

export const PASSWORD_HISTORY_SIZE = 5;

export function rememberedPasswordHistory(user: User): string[] {
  const previous = user.passwordHash
    ? [user.passwordHash, ...user.passwordHistory]
    : user.passwordHistory;

  return previous.slice(0, PASSWORD_HISTORY_SIZE);
}
