import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  emailRequestSchema,
  loginSchema,
  meResponseSchema,
  sessionSchema,
} from './schemas';

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

function messagesByField(values: { newPassword: unknown; confirmPassword: unknown }) {
  const result = changePasswordSchema.safeParse(values);
  const messages: Record<string, string[]> = {};
  result.error?.issues.forEach((issue) => {
    const field = String(issue.path[0]);
    (messages[field] ??= []).push(issue.message);
  });
  return messages;
}

describe('changePasswordSchema', () => {
  const POLICY = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.';

  it('acepta una contraseña válida repetida igual', () => {
    expect(
      changePasswordSchema.parse({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1' }),
    ).toEqual({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1' });
  });

  it('con los dos campos vacíos pide cada uno, sin hablar de que no coinciden', () => {
    expect(messagesByField({ newPassword: '', confirmPassword: '' })).toEqual({
      newPassword: expect.arrayContaining(['Ingresa tu nueva contraseña']),
      confirmPassword: ['Repite tu nueva contraseña'],
    });
  });

  it.each([
    ['es muy corta', 'Abc1234'],
    ['no tiene mayúscula', 'abcdefg1'],
    ['no tiene número', 'Abcdefgh'],
    ['es demasiado larga', `A1${'a'.repeat(200)}`],
  ])('rechaza una contraseña que %s', (_caso, password) => {
    expect(
      messagesByField({ newPassword: password, confirmPassword: password }).newPassword,
    ).toEqual([POLICY]);
  });

  it('pide repetir la contraseña cuando la confirmación está vacía (es el primer mensaje que se muestra)', () => {
    const messages = messagesByField({ newPassword: 'NuevaClave1', confirmPassword: '' });

    expect(messages.confirmPassword?.[0]).toBe('Repite tu nueva contraseña');
    expect(messages.newPassword).toBeUndefined();
  });

  it('avisa que no coinciden, en el campo de la confirmación', () => {
    expect(messagesByField({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave2' })).toEqual(
      {
        confirmPassword: ['Las contraseñas no coinciden'],
      },
    );
  });

  it('los espacios cuentan: no recorta ninguna de las dos', () => {
    expect(
      messagesByField({ newPassword: 'NuevaClave1', confirmPassword: 'NuevaClave1 ' }),
    ).toEqual({
      confirmPassword: ['Las contraseñas no coinciden'],
    });
  });

  it('rechaza valores que no son texto', () => {
    expect(
      changePasswordSchema.safeParse({ newPassword: 12345678, confirmPassword: 12345678 }).success,
    ).toBe(false);
  });
});

describe('meResponseSchema', () => {
  it('acepta una sesión envuelta', () => {
    expect(
      meResponseSchema.parse({
        session: { email: 'ana@correo.com', requiresPasswordChange: false },
      }),
    ).toEqual({ session: { email: 'ana@correo.com', requiresPasswordChange: false } });
  });

  it('acepta "sin sesión" como null', () => {
    expect(meResponseSchema.parse({ session: null })).toEqual({ session: null });
  });

  it.each([
    ['sin el campo session', {}],
    ['con session sin definir', { session: undefined }],
    ['con una sesión incompleta', { session: { email: 'ana@correo.com' } }],
    ['con la sesión sin envoltorio', { email: 'ana@correo.com', requiresPasswordChange: false }],
  ])('rechaza una respuesta %s', (_caso, body) => {
    expect(meResponseSchema.safeParse(body).success).toBe(false);
  });
});
