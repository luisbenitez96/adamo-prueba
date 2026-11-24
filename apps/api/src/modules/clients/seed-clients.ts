import { generateClient } from './client-generator.js';
import type { ClientRepository } from './client.repository.js';

const SEED_BATCH_SIZE = 1000;

interface SeedClientsOptions {
  serviceId: string;
  serviceKey: string;
  target: number;
}

export async function seedClients(
  clients: ClientRepository,
  { serviceId, serviceKey, target }: SeedClientsOptions,
): Promise<void> {
  const existing = await clients.countForService(serviceId);

  if (existing >= target) {
    return;
  }

  for (let start = 0; start < target; start += SEED_BATCH_SIZE) {
    const end = Math.min(start + SEED_BATCH_SIZE, target);
    const batch = Array.from({ length: end - start }, (_, offset) =>
      generateClient(serviceId, serviceKey, start + offset),
    );
    await clients.insertMany(batch);
  }
}
