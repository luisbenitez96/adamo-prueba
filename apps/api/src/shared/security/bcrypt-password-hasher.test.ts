import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4);

  it('no guarda la contraseña en texto plano', async () => {
    const hash = await hasher.hash('Secreta123');

    expect(hash).not.toContain('Secreta123');
  });

  it('verifica correctamente la contraseña original', async () => {
    const hash = await hasher.hash('Secreta123');

    expect(await hasher.verify('Secreta123', hash)).toBe(true);
  });

  it('rechaza una contraseña distinta', async () => {
    const hash = await hasher.hash('Secreta123');

    expect(await hasher.verify('Secreta124', hash)).toBe(false);
  });

  it('distingue mayúsculas de minúsculas', async () => {
    const hash = await hasher.hash('Secreta123');

    expect(await hasher.verify('secreta123', hash)).toBe(false);
  });

  it('genera un hash distinto cada vez para la misma contraseña', async () => {
    const [first, second] = await Promise.all([
      hasher.hash('Secreta123'),
      hasher.hash('Secreta123'),
    ]);

    expect(first).not.toBe(second);
  });
});
