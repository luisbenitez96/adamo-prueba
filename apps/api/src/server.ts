import { createApp } from './app.js';
import { parseEnv } from './config/env.js';
import { createAppDependencies } from './container.js';
import { connectDatabase } from './database/connect-database.js';
import { MongoServiceRepository } from './modules/services/mongo-service.repository.js';
import { seedDefaultServices } from './modules/services/default-services.js';

const env = parseEnv();

await connectDatabase(env.MONGO_URI);
console.log('Conectado a MongoDB');

await seedDefaultServices(new MongoServiceRepository());

const app = createApp(createAppDependencies(env));

const server = app.listen(env.PORT, () => {
  console.log(`API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
