import type { ClientStatus, NewClient } from './client.entity.js';
import { toSearchKey } from './search-key.js';

const FIRST_NAMES = [
  'Santiago',
  'Valentina',
  'Mateo',
  'Sofía',
  'Sebastián',
  'Isabella',
  'Samuel',
  'Camila',
  'Daniel',
  'Mariana',
  'Nicolás',
  'Daniela',
  'Alejandro',
  'Gabriela',
  'Andrés',
  'Juliana',
  'Felipe',
  'Laura',
  'Juan',
  'Paula',
  'Carlos',
  'Natalia',
  'Diego',
  'Andrea',
  'Jorge',
  'Luisa',
  'Miguel',
  'Carolina',
  'David',
  'Paola',
  'Esteban',
  'Mónica',
  'Julián',
  'Catalina',
  'Ricardo',
  'Lucía',
  'Camilo',
  'Verónica',
  'Héctor',
  'Ángela',
];

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Martínez',
  'López',
  'González',
  'Hernández',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Reyes',
  'Morales',
  'Cruz',
  'Ortiz',
  'Gutiérrez',
  'Chávez',
  'Ramos',
  'Vargas',
  'Castillo',
  'Jiménez',
  'Moreno',
  'Romero',
  'Herrera',
  'Medina',
  'Aguilar',
  'Castro',
  'Vega',
  'Rojas',
  'Mejía',
  'Ríos',
  'Salazar',
  'Cardona',
  'Quintero',
  'Zapata',
  'Arango',
  'Echeverri',
];

const CITIES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Cúcuta',
  'Santa Marta',
  'Ibagué',
  'Armenia',
];

const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net'];

const STATUS_WEIGHTS: [ClientStatus, number][] = [
  ['active', 0.7],
  ['pending', 0.2],
  ['inactive', 0.1],
];

const REGISTRATION_WINDOW_DAYS = 1095;
const MILLISECONDS_PER_DAY = 86_400_000;
const REGISTRATION_ANCHOR = Date.UTC(2026, 0, 1);

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let position = 0; position < text.length; position++) {
    hash ^= text.charCodeAt(position);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

function pickStatus(random: () => number): ClientStatus {
  const roll = random();
  let accumulated = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    accumulated += weight;
    if (roll < accumulated) {
      return status;
    }
  }
  return 'active';
}

function slug(text: string): string {
  return toSearchKey(text).replace(/[^a-z0-9]/g, '');
}

function digits(random: () => number, length: number): string {
  return Array.from({ length }, () => Math.floor(random() * 10)).join('');
}

export function generateClient(serviceId: string, serviceKey: string, index: number): NewClient {
  const random = createRandom(hashSeed(`${serviceKey}:${index}`));
  const firstName = pick(FIRST_NAMES, random);
  const firstLastName = pick(LAST_NAMES, random);
  const secondLastName = pick(LAST_NAMES, random);
  const name = `${firstName} ${firstLastName} ${secondLastName}`;
  const email = `${slug(firstName)}.${slug(firstLastName)}.${index + 1}@${pick(EMAIL_DOMAINS, random)}`;
  const phone = `+57 3${Math.floor(random() * 3)}${digits(random, 1)} ${digits(random, 3)} ${digits(random, 4)}`;
  const daysAgo = Math.floor(random() * REGISTRATION_WINDOW_DAYS);

  return {
    serviceId,
    name,
    email,
    phone,
    city: pick(CITIES, random),
    status: pickStatus(random),
    registeredAt: new Date(REGISTRATION_ANCHOR - daysAgo * MILLISECONDS_PER_DAY),
    searchKey: toSearchKey(`${name} ${email}`),
  };
}
