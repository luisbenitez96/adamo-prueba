import { describe, expect, it } from 'vitest';
import { meetsPasswordPolicy } from './password-policy.js';
import { RandomPasswordGenerator } from './random-password-generator.js';

const SAMPLE_SIZE = 200;

function generateMany(generator: RandomPasswordGenerator): string[] {
  return Array.from({ length: SAMPLE_SIZE }, () => generator.generate());
}

describe('RandomPasswordGenerator', () => {
  const generator = new RandomPasswordGenerator();

  it('genera contraseñas de 12 caracteres por defecto', () => {
    generateMany(generator).forEach((password) => expect(password).toHaveLength(12));
  });

  it('respeta la longitud indicada', () => {
    expect(new RandomPasswordGenerator(20).generate()).toHaveLength(20);
  });

  it('siempre cumple la política de contraseñas', () => {
    generateMany(generator).forEach((password) => expect(meetsPasswordPolicy(password)).toBe(true));
  });

  it('incluye minúsculas, mayúsculas y números', () => {
    generateMany(generator).forEach((password) => {
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/\d/);
    });
  });

  it('no usa caracteres que se confunden al copiarlos (0, O, 1, l, I)', () => {
    generateMany(generator).forEach((password) => expect(password).not.toMatch(/[0O1lI]/));
  });

  it('no repite contraseñas', () => {
    expect(new Set(generateMany(generator)).size).toBe(SAMPLE_SIZE);
  });

  it('no deja siempre la mayúscula en la misma posición', () => {
    const positionsOfFirstUppercase = new Set(
      generateMany(generator).map((password) => password.search(/[A-Z]/)),
    );
    expect(positionsOfFirstUppercase.size).toBeGreaterThan(1);
  });

  it('rechaza una longitud menor al mínimo de la política', () => {
    expect(() => new RandomPasswordGenerator(7)).toThrow(RangeError);
  });
});
