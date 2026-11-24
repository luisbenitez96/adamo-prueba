import { describe, expect, it } from 'vitest';
import { serviceSchema, servicesResponseSchema } from './schemas';

const validService = {
  id: 'pay',
  name: 'Adamo Pay',
  description: 'Gestión de pagos',
  clientsCount: 3827,
  accentColor: '#0e9384',
};

describe('serviceSchema', () => {
  it('acepta un servicio válido', () => {
    expect(serviceSchema.parse(validService)).toEqual(validService);
  });

  it('acepta cero clientes', () => {
    expect(serviceSchema.safeParse({ ...validService, clientsCount: 0 }).success).toBe(true);
  });

  it.each([
    ['sin id', { ...validService, id: '' }],
    ['sin nombre', { ...validService, name: '' }],
    ['con cantidad negativa', { ...validService, clientsCount: -1 }],
    ['con cantidad decimal', { ...validService, clientsCount: 1.5 }],
    ['con cantidad que no es número', { ...validService, clientsCount: '10' }],
    ['con color en texto', { ...validService, accentColor: 'red' }],
    ['con color corto', { ...validService, accentColor: '#fff' }],
    ['con color sin almohadilla', { ...validService, accentColor: '0e9384' }],
    ['con color inválido', { ...validService, accentColor: '#12345g' }],
    [
      'con un valor que intenta inyectar estilos',
      { ...validService, accentColor: 'red; background: url(x)' },
    ],
  ])('rechaza un servicio %s', (_caso, service) => {
    expect(serviceSchema.safeParse(service).success).toBe(false);
  });
});

describe('servicesResponseSchema', () => {
  it('acepta una lista vacía', () => {
    expect(servicesResponseSchema.parse({ services: [] })).toEqual({ services: [] });
  });

  it('rechaza una respuesta sin la lista', () => {
    expect(servicesResponseSchema.safeParse({}).success).toBe(false);
  });

  it('rechaza si un solo servicio de la lista es inválido', () => {
    expect(
      servicesResponseSchema.safeParse({
        services: [validService, { ...validService, accentColor: 'red' }],
      }).success,
    ).toBe(false);
  });
});
