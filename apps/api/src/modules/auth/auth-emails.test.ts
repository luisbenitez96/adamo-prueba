import { describe, expect, it } from 'vitest';
import { buildPasswordResetEmail, buildWelcomeEmail } from './auth-emails.js';

const data = {
  to: 'ana@correo.com',
  temporaryPassword: 'Abc12345xyz9',
  expiresInMinutes: 15,
  loginUrl: 'http://localhost:8080/login',
};

describe.each([
  ['bienvenida', buildWelcomeEmail],
  ['restablecer contraseña', buildPasswordResetEmail],
])('correo de %s', (_name, build) => {
  const email = build(data);

  it('va dirigido al destinatario', () => {
    expect(email.to).toBe('ana@correo.com');
  });

  it('incluye la contraseña temporal en texto y en HTML', () => {
    expect(email.text).toContain('Contraseña temporal: Abc12345xyz9');
    expect(email.html).toContain('Contraseña temporal: Abc12345xyz9');
  });

  it('indica cuánto dura la contraseña', () => {
    expect(email.text).toContain('15 minutos');
    expect(email.html).toContain('15 minutos');
  });

  it('incluye el enlace para iniciar sesión', () => {
    expect(email.text).toContain('http://localhost:8080/login');
    expect(email.html).toContain('http://localhost:8080/login');
  });
});

describe('correos con asuntos distintos', () => {
  it('bienvenida y restablecer se distinguen por el asunto', () => {
    expect(buildWelcomeEmail(data).subject).not.toBe(buildPasswordResetEmail(data).subject);
  });

  it('restablecer avisa que la contraseña actual sigue funcionando', () => {
    expect(buildPasswordResetEmail(data).text).toContain('contraseña actual sigue funcionando');
  });
});
