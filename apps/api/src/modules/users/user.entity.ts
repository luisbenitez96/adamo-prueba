export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  passwordHistory: string[];
  tempPasswordHash: string | null;
  tempPasswordExpiresAt: Date | null;
  lastTempRequestAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserChanges = Partial<
  Pick<
    User,
    | 'passwordHash'
    | 'passwordHistory'
    | 'tempPasswordHash'
    | 'tempPasswordExpiresAt'
    | 'lastTempRequestAt'
  >
>;

export type NewUser = Pick<User, 'email'> & UserChanges;
