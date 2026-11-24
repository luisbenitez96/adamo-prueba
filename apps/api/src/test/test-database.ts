import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export class TestDatabase {
  private server: MongoMemoryServer | null = null;

  async start(): Promise<void> {
    this.server = await MongoMemoryServer.create();
    await mongoose.connect(this.server.getUri());
  }

  async clear(): Promise<void> {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  }

  async stop(): Promise<void> {
    await mongoose.disconnect();
    await this.server?.stop();
  }
}
