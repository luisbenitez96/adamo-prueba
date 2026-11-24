export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  tempPasswordHash: string | null;
  tempPasswordExpiresAt: Date | null;
  lastTempRequestAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserChanges = Partial<
  Pick<User, 'passwordHash' | 'tempPasswordHash' | 'tempPasswordExpiresAt' | 'lastTempRequestAt'>
>;

export type NewUser = Pick<User, 'email'> & UserChanges;
