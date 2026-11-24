import { describe, expect, it } from 'vitest';
import { meetsPasswordPolicy, PASSWORD_POLICY_HINT } from './password-policy';

describe('meetsPasswordPolicy', () => {
  it('acepta 8 caracteres con una mayúscula y un número', () => {
    expect(meetsPasswordPolicy('Abcdefg1')).toBe(true);
  });

  it('rechaza menos de 8 caracteres', () => {
    expect(meetsPasswordPolicy('Abcdef1')).toBe(false);
  });

  it('rechaza una contraseña sin mayúscula', () => {
    expect(meetsPasswordPolicy('abcdefg1')).toBe(false);
  });

  it('rechaza una contraseña sin número', () => {
    expect(meetsPasswordPolicy('Abcdefgh')).toBe(false);
  });

  it('acepta símbolos y espacios además de los requisitos', () => {
    expect(meetsPasswordPolicy('Mi clave segura 1!')).toBe(true);
  });
});

describe('PASSWORD_POLICY_HINT', () => {
  it('coincide con el texto del diseño', () => {
    expect(PASSWORD_POLICY_HINT).toBe('Al menos 8 caracteres, una mayúscula y un número.');
  });
});
