import mongoose from 'mongoose';

const SERVER_SELECTION_TIMEOUT_MS = 5000;

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
}
