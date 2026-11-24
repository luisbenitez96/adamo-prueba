import { isValidObjectId } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { DuplicateEmailError } from './duplicate-email-error.js';
import type { NewUser, User, UserChanges } from './user.entity.js';
import { UserModel } from './user.model.js';
import type { UserDocument } from './user.model.js';
import { normalizeEmail } from './normalize-email.js';
import type { UserRepository } from './user.repository.js';

const MONGO_DUPLICATE_KEY_CODE = 11000;

function toUser(document: HydratedDocument<UserDocument>): User {
  return {
    id: document.id,
    email: document.email,
    passwordHash: document.passwordHash,
    passwordHistory: [...document.passwordHistory],
    tempPasswordHash: document.tempPasswordHash,
    tempPasswordExpiresAt: document.tempPasswordExpiresAt,
    lastTempRequestAt: document.lastTempRequestAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY_CODE
  );
}

export class MongoUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const document = await UserModel.findOne({ email: normalizeEmail(email) });
    return document ? toUser(document) : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    const document = await UserModel.findById(id);
    return document ? toUser(document) : null;
  }

  async create(newUser: NewUser): Promise<User> {
    try {
      const document = await UserModel.create({
        ...newUser,
        email: normalizeEmail(newUser.email),
      });
      return toUser(document);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async update(id: string, changes: UserChanges): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    const document = await UserModel.findByIdAndUpdate(
      id,
      { $set: changes },
      { returnDocument: 'after' },
    );
    return document ? toUser(document) : null;
  }
}
