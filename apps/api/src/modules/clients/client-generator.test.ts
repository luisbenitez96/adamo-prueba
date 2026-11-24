import { describe, expect, it } from 'vitest';
import { generateClient } from './client-generator.js';
import { toSearchKey } from './search-key.js';

const SERVICE_ID = '64b7f0c2a1b2c3d4e5f60718';
const SAMPLE = 5000;

function sample(serviceKey = 'Adamo Pay', size = SAMPLE) {
  return Array.from({ length: size }, (_, index) => generateClient(SERVICE_ID, serviceKey, index));
}

describe('generateClient', () => {
  it('es determinista: la misma entrada da siempre el mismo cliente', () => {
    expect(generateClient(SERVICE_ID, 'Adamo Pay', 42)).toEqual(
      generateClient(SERVICE_ID, 'Adamo Pay', 42),
    );
  });

  it('un índice distinto da un cliente distinto', () => {
    expect(generateClient(SERVICE_ID, 'Adamo Pay', 1)).not.toEqual(
      generateClient(SERVICE_ID, 'Adamo Pay', 2),
    );
  });

  it('el mismo índice en otro servicio da otra persona', () => {
    const pay = generateClient(SERVICE_ID, 'Adamo Pay', 7);
    const id = generateClient(SERVICE_ID, 'Adamo ID', 7);

    expect(pay.name).not.toBe(id.name);
  });

  it('conserva el servicio al que pertenece', () => {
    expect(generateClient(SERVICE_ID, 'Adamo Pay', 0).serviceId).toBe(SERVICE_ID);
  });

  it('los correos son únicos dentro del mismo servicio', () => {
    const emails = sample().map((client) => client.email);

    expect(new Set(emails).size).toBe(SAMPLE);
  });

  it('los correos usan dominios reservados para ejemplos (nunca de personas reales)', () => {
    sample('Adamo Pay', 300).forEach((client) => {
      expect(client.email).toMatch(/^[a-z]+\.[a-z]+\.\d+@example\.(com|org|net)$/);
    });
  });

  it('el nombre lleva un nombre y dos apellidos', () => {
    sample('Adamo Pay', 300).forEach((client) => {
      expect(client.name.split(' ')).toHaveLength(3);
    });
  });

  it('conserva las tildes en el nombre que se muestra', () => {
    expect(sample().some((client) => /[áéíóúñ]/i.test(client.name))).toBe(true);
  });

  it('el teléfono tiene formato colombiano', () => {
    sample('Adamo Pay', 300).forEach((client) => {
      expect(client.phone).toMatch(/^\+57 3[0-2]\d \d{3} \d{4}$/);
    });
  });

  it('el estado es uno de los permitidos y se reparte como se espera', () => {
    const clients = sample();
    const share = (status: string) =>
      clients.filter((client) => client.status === status).length / SAMPLE;

    expect(share('active')).toBeGreaterThan(0.65);
    expect(share('active')).toBeLessThan(0.75);
    expect(share('pending')).toBeGreaterThan(0.16);
    expect(share('pending')).toBeLessThan(0.24);
    expect(share('inactive')).toBeGreaterThan(0.06);
    expect(share('inactive')).toBeLessThan(0.14);
  });

  it('la fecha de registro cae en los últimos tres años', () => {
    sample('Adamo Pay', 1000).forEach((client) => {
      expect(client.registeredAt.getTime()).toBeLessThanOrEqual(Date.UTC(2026, 0, 1));
      expect(client.registeredAt.getTime()).toBeGreaterThan(Date.UTC(2022, 11, 31));
    });
  });

  it('la clave de búsqueda es el nombre y el correo, sin tildes y en minúsculas', () => {
    sample('Adamo Pay', 300).forEach((client) => {
      expect(client.searchKey).toBe(toSearchKey(`${client.name} ${client.email}`));
      expect(client.searchKey).not.toMatch(/[A-ZÁÉÍÓÚÑáéíóúñ]/);
    });
  });

  it('genera los 16.769 clientes del diseño sin repetir correos dentro de cada servicio', () => {
    const volumes: [string, number][] = [
      ['Adamo Pay', 3827],
      ['Adamo ID', 9411],
      ['Adamo Risk', 793],
      ['Adamo Sign', 2738],
    ];

    const total = volumes.reduce((sum, [serviceKey, volume]) => {
      const emails = new Set(sample(serviceKey, volume).map((client) => client.email));
      expect(emails.size).toBe(volume);
      return sum + volume;
    }, 0);

    expect(total).toBe(16769);
  });
});
