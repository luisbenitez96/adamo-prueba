import { seedClients } from '../modules/clients/seed-clients.js';
import type { ClientRepository } from '../modules/clients/client.repository.js';
import type { ServiceDefinition } from '../modules/services/default-services.js';
import type { ServiceItem } from '../modules/services/service-item.entity.js';
import type { ServiceRepository } from '../modules/services/service.repository.js';

export const SMALL_SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    name: 'Adamo Pay',
    description: 'Gestión de pagos',
    clientsToSeed: 12,
    accentColor: '#0e9384',
    order: 1,
  },
  {
    name: 'Adamo ID',
    description: 'Verificación de identidad',
    clientsToSeed: 30,
    accentColor: '#0086c9',
    order: 2,
  },
  {
    name: 'Adamo Risk',
    description: 'Reducción de riesgos',
    clientsToSeed: 3,
    accentColor: '#7839ee',
    order: 3,
  },
  {
    name: 'Adamo Sign',
    description: 'Firma de documentos',
    clientsToSeed: 7,
    accentColor: '#3e4784',
    order: 4,
  },
];

interface Repositories {
  serviceRepository: ServiceRepository;
  clientRepository: ClientRepository;
}

export async function createServiceWithClients(
  { serviceRepository, clientRepository }: Repositories,
  name: string,
  clientsCount: number,
): Promise<ServiceItem> {
  await serviceRepository.insertMissing([
    { name, description: `Descripción de ${name}`, accentColor: '#0e9384', order: 1 },
  ]);

  const service = (await serviceRepository.findAll()).find((item) => item.name === name)!;
  await seedClients(clientRepository, {
    serviceId: service.id,
    serviceKey: name,
    target: clientsCount,
  });

  return service;
}
