import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const JWT_SECRET = 'un-secreto-de-pruebas-suficientemente-largo';
const minimalEnv = { JWT_SECRET };

describe('parseEnv', () => {
  it('usa los valores por defecto cuando solo está el secreto JWT', () => {
    expect(parseEnv(minimalEnv)).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      MONGO_URI: 'mongodb://localhost:27017/adamo',
      APP_URL: 'http://localhost:8080',
      TRUST_PROXY: false,
      JWT_SECRET,
      JWT_EXPIRES_IN_MINUTES: 60,
      COOKIE_SECURE: false,
      TEMP_PASSWORD_TTL_MINUTES: 15,
      SMTP_HOST: 'localhost',
      SMTP_PORT: 1025,
      MAIL_FROM: 'AdamoServices <no-reply@adamo.local>',
    });
  });

  it('convierte PORT de texto a número', () => {
    expect(parseEnv({ ...minimalEnv, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rechaza un PORT que no es un número', () => {
    expect(() => parseEnv({ ...minimalEnv, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rechaza un PORT fuera de rango', () => {
    expect(() => parseEnv({ ...minimalEnv, PORT: '70000' })).toThrow(/PORT/);
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => parseEnv({ ...minimalEnv, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('interpreta TRUST_PROXY como booleano', () => {
    expect(parseEnv({ ...minimalEnv, TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true);
    expect(parseEnv({ ...minimalEnv, TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false);
  });

  it('rechaza un TRUST_PROXY que no es booleano', () => {
    expect(() => parseEnv({ ...minimalEnv, TRUST_PROXY: 'quizás' })).toThrow(/TRUST_PROXY/);
  });

  it('rechaza un APP_URL que no es una URL', () => {
    expect(() => parseEnv({ ...minimalEnv, APP_URL: 'localhost' })).toThrow(/APP_URL/);
  });

  it('rechaza una vigencia de contraseña temporal que no es positiva', () => {
    expect(() => parseEnv({ ...minimalEnv, TEMP_PASSWORD_TTL_MINUTES: '0' })).toThrow(
      /TEMP_PASSWORD_TTL_MINUTES/,
    );
  });

  it('conserva las credenciales SMTP cuando se indican', () => {
    const env = parseEnv({ ...minimalEnv, SMTP_USER: 'usuario', SMTP_PASS: 'clave' });

    expect(env.SMTP_USER).toBe('usuario');
    expect(env.SMTP_PASS).toBe('clave');
  });

  it('exige JWT_SECRET', () => {
    expect(() => parseEnv({})).toThrow(/JWT_SECRET/);
  });

  it('rechaza un JWT_SECRET demasiado corto', () => {
    expect(() => parseEnv({ JWT_SECRET: 'corto' })).toThrow(/JWT_SECRET/);
  });

  it('interpreta COOKIE_SECURE como booleano', () => {
    expect(parseEnv({ ...minimalEnv, COOKIE_SECURE: 'true' }).COOKIE_SECURE).toBe(true);
    expect(parseEnv({ ...minimalEnv, COOKIE_SECURE: 'false' }).COOKIE_SECURE).toBe(false);
  });

  it('rechaza una duración de sesión que no es positiva', () => {
    expect(() => parseEnv({ ...minimalEnv, JWT_EXPIRES_IN_MINUTES: '0' })).toThrow(
      /JWT_EXPIRES_IN_MINUTES/,
    );
  });
});
