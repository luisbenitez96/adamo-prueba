import type { NewUser, User, UserChanges } from './user.entity.js';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(newUser: NewUser): Promise<User>;
  update(id: string, changes: UserChanges): Promise<User | null>;
}
