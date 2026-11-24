import { describe, expect, it } from 'vitest';
import { meetsPasswordPolicy } from './password-policy.js';

describe('meetsPasswordPolicy', () => {
  it('acepta una contraseña con 8 caracteres, mayúscula y número', () => {
    expect(meetsPasswordPolicy('Abcdefg1')).toBe(true);
  });

  it('rechaza una contraseña de menos de 8 caracteres', () => {
    expect(meetsPasswordPolicy('Abcdef1')).toBe(false);
  });

  it('rechaza una contraseña sin mayúscula', () => {
    expect(meetsPasswordPolicy('abcdefg1')).toBe(false);
  });

  it('rechaza una contraseña sin número', () => {
    expect(meetsPasswordPolicy('Abcdefgh')).toBe(false);
  });
});
