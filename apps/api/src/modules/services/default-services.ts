import { seedClients } from '../clients/seed-clients.js';
import type { ClientRepository } from '../clients/client.repository.js';
import type { NewServiceItem } from './service-item.entity.js';
import type { ServiceRepository } from './service.repository.js';

export interface ServiceDefinition extends NewServiceItem {
  clientsToSeed: number;
}

export const DEFAULT_SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    name: 'Adamo Pay',
    description: 'Gestión de pagos',
    clientsToSeed: 3827,
    accentColor: '#0e9384',
    order: 1,
  },
  {
    name: 'Adamo ID',
    description: 'Verificación de identidad',
    clientsToSeed: 9411,
    accentColor: '#0086c9',
    order: 2,
  },
  {
    name: 'Adamo Risk',
    description: 'Reducción de riesgos',
    clientsToSeed: 793,
    accentColor: '#7839ee',
    order: 3,
  },
  {
    name: 'Adamo Sign',
    description: 'Firma de documentos',
    clientsToSeed: 2738,
    accentColor: '#3e4784',
    order: 4,
  },
];

export async function seedDefaultServices(
  services: ServiceRepository,
  clients: ClientRepository,
  definitions: ServiceDefinition[] = DEFAULT_SERVICE_DEFINITIONS,
): Promise<void> {
  await services.insertMissing(
    definitions.map(({ clientsToSeed: _clientsToSeed, ...service }) => service),
  );

  const savedServices = await services.findAll();

  for (const definition of definitions) {
    const saved = savedServices.find((service) => service.name === definition.name);

    if (saved) {
      await seedClients(clients, {
        serviceId: saved.id,
        serviceKey: definition.name,
        target: definition.clientsToSeed,
      });
    }
  }
}
