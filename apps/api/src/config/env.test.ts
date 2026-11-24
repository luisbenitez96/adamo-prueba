import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('usa los valores por defecto cuando no hay variables', () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('convierte PORT de texto a número', () => {
    expect(parseEnv({ PORT: '4000' }).PORT).toBe(4000);
  });

  it('rechaza un PORT que no es un número', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rechaza un PORT fuera de rango', () => {
    expect(() => parseEnv({ PORT: '70000' })).toThrow(/PORT/);
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => parseEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
