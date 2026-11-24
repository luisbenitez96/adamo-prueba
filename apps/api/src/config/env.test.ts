import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('usa los valores por defecto cuando no hay variables', () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      MONGO_URI: 'mongodb://localhost:27017/adamo',
      APP_URL: 'http://localhost:8080',
      TRUST_PROXY: false,
      TEMP_PASSWORD_TTL_MINUTES: 15,
      SMTP_HOST: 'localhost',
      SMTP_PORT: 1025,
      MAIL_FROM: 'AdamoServices <no-reply@adamo.local>',
    });
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

  it('interpreta TRUST_PROXY como booleano', () => {
    expect(parseEnv({ TRUST_PROXY: 'true' }).TRUST_PROXY).toBe(true);
    expect(parseEnv({ TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false);
  });

  it('rechaza un TRUST_PROXY que no es booleano', () => {
    expect(() => parseEnv({ TRUST_PROXY: 'quizás' })).toThrow(/TRUST_PROXY/);
  });

  it('rechaza un APP_URL que no es una URL', () => {
    expect(() => parseEnv({ APP_URL: 'localhost' })).toThrow(/APP_URL/);
  });

  it('rechaza una vigencia de contraseña temporal que no es positiva', () => {
    expect(() => parseEnv({ TEMP_PASSWORD_TTL_MINUTES: '0' })).toThrow(/TEMP_PASSWORD_TTL_MINUTES/);
  });

  it('conserva las credenciales SMTP cuando se indican', () => {
    const env = parseEnv({ SMTP_USER: 'usuario', SMTP_PASS: 'clave' });

    expect(env.SMTP_USER).toBe('usuario');
    expect(env.SMTP_PASS).toBe('clave');
  });
});
