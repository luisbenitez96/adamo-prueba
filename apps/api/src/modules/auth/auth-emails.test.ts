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

  it('muestra el logo de AdamoServices arriba, incrustado en el mismo correo', () => {
    expect(email.html).toContain('<img src="cid:adamo-logo"');
    expect(email.html).toContain('alt="AdamoServices"');
    expect(email.html.indexOf('<img')).toBeLessThan(email.html.indexOf('<h1'));
  });

  it('adjunta el logo con el mismo identificador que usa el HTML', () => {
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments![0]).toMatchObject({
      cid: 'adamo-logo',
      contentType: 'image/png',
      filename: 'adamo-logo.png',
    });
    expect(email.html).toContain(`cid:${email.attachments![0]!.cid}`);
  });

  it('el logo va sobre la banda del color de la marca, porque el logo es blanco', () => {
    expect(email.html).toMatch(/background:#111927[^>]*>\s*<img/);
  });

  it('la versión en texto plano no menciona el logo ni etiquetas', () => {
    expect(email.text).not.toContain('<');
    expect(email.text).not.toContain('cid:');
  });

  it('el HTML usa tablas, que es lo que entienden todos los clientes de correo', () => {
    expect(email.html).toContain('<table role="presentation"');
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
