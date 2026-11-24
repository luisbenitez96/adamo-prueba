import type { NewServiceItem } from './service-item.entity.js';
import type { ServiceRepository } from './service.repository.js';

export const DEFAULT_SERVICES: NewServiceItem[] = [
  {
    name: 'Adamo Pay',
    description: 'Gestión de pagos',
    clientsCount: 3827,
    accentColor: '#0e9384',
    order: 1,
  },
  {
    name: 'Adamo ID',
    description: 'Verificación de identidad',
    clientsCount: 9411,
    accentColor: '#0086c9',
    order: 2,
  },
  {
    name: 'Adamo Risk',
    description: 'Reducción de riesgos',
    clientsCount: 793,
    accentColor: '#7839ee',
    order: 3,
  },
  {
    name: 'Adamo Sign',
    description: 'Firma de documentos',
    clientsCount: 2738,
    accentColor: '#3e4784',
    order: 4,
  },
];

export function seedDefaultServices(services: ServiceRepository): Promise<void> {
  return services.insertMissing(DEFAULT_SERVICES);
}
