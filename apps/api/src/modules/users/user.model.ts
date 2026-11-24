import { model, Schema } from 'mongoose';
import type { User } from './user.entity.js';

export type UserDocument = Omit<User, 'id'>;

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: null },
    passwordHistory: { type: [String], default: [] },
    tempPasswordHash: { type: String, default: null },
    tempPasswordExpiresAt: { type: Date, default: null },
    lastTempRequestAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const UserModel = model<UserDocument>('User', userSchema);
