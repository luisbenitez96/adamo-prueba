import bcrypt from 'bcryptjs';
import type { PasswordHasher } from './password-hasher.js';

const DEFAULT_COST = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost = DEFAULT_COST) {}

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.cost);
  }

  verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
