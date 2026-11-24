import { describe, expect, it } from 'vitest';
import { emailRequestSchema, loginSchema, sessionSchema } from './schemas';

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe('emailRequestSchema', () => {
  it('acepta un correo válido y le quita los espacios', () => {
    expect(emailRequestSchema.parse({ email: '  ana@correo.com ' })).toEqual({
      email: 'ana@correo.com',
    });
  });

  it('pide el correo cuando está vacío o solo tiene espacios', () => {
    expect(firstMessage(emailRequestSchema.safeParse({ email: '' }))).toBe(
      'Ingresa tu correo electrónico',
    );
    expect(firstMessage(emailRequestSchema.safeParse({ email: '   ' }))).toBe(
      'Ingresa tu correo electrónico',
    );
  });

  it.each(['ana', 'ana@', '@correo.com', 'ana@correo', 'ana correo@x.com'])(
    'rechaza el correo mal formado "%s"',
    (email) => {
      expect(firstMessage(emailRequestSchema.safeParse({ email }))).toBe(
        'Ingresa un correo electrónico válido',
      );
    },
  );
});

describe('loginSchema', () => {
  it('acepta correo y contraseña', () => {
    expect(loginSchema.parse({ email: 'ana@correo.com', password: 'Secreta123' })).toEqual({
      email: 'ana@correo.com',
      password: 'Secreta123',
    });
  });

  it('pide la contraseña cuando está vacía', () => {
    expect(firstMessage(loginSchema.safeParse({ email: 'ana@correo.com', password: '' }))).toBe(
      'Ingresa tu contraseña',
    );
  });

  it('no recorta la contraseña: los espacios cuentan', () => {
    expect(loginSchema.parse({ email: 'ana@correo.com', password: ' clave ' }).password).toBe(
      ' clave ',
    );
  });
});

describe('sessionSchema', () => {
  it('acepta la respuesta esperada del servidor', () => {
    expect(sessionSchema.parse({ email: 'ana@correo.com', requiresPasswordChange: true })).toEqual({
      email: 'ana@correo.com',
      requiresPasswordChange: true,
    });
  });

  it.each([
    ['sin requiresPasswordChange', { email: 'ana@correo.com' }],
    ['con un valor que no es booleano', { email: 'ana@correo.com', requiresPasswordChange: 'si' }],
    ['sin correo', { requiresPasswordChange: false }],
  ])('rechaza una respuesta %s', (_caso, body) => {
    expect(sessionSchema.safeParse(body).success).toBe(false);
  });
});
