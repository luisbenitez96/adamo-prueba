import type { User } from './user.entity.js';

export function activeTemporaryPasswordHash(user: User, now: Date): string | null {
  const { tempPasswordHash, tempPasswordExpiresAt } = user;
  const isActive =
    tempPasswordExpiresAt !== null && tempPasswordExpiresAt.getTime() > now.getTime();

  return isActive ? tempPasswordHash : null;
}
