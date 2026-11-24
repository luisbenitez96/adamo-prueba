import { describe, expect, it, vi } from 'vitest';
import { minimumLoadingMs, minimumNavigationMs } from './loading-feedback';

describe.each([
  ['minimumLoadingMs (enviar formularios)', minimumLoadingMs, 'VITE_MIN_LOADING_MS', 500],
  ['minimumNavigationMs (cambiar de pantalla)', minimumNavigationMs, 'VITE_MIN_NAVIGATION_MS', 300],
])('%s', (_name, read, variable, defaultValue) => {
  it(`sin configuración usa ${defaultValue} ms`, () => {
    vi.stubEnv(variable, undefined as unknown as string);

    expect(read()).toBe(defaultValue);
  });

  it('usa el valor configurado', () => {
    vi.stubEnv(variable, '800');

    expect(read()).toBe(800);
  });

  it('permite desactivarlo con 0', () => {
    vi.stubEnv(variable, '0');

    expect(read()).toBe(0);
  });

  it('si el valor no es un número vuelve al valor por defecto', () => {
    vi.stubEnv(variable, 'rapido');

    expect(read()).toBe(defaultValue);
  });

  it('un valor negativo se trata como 0', () => {
    vi.stubEnv(variable, '-200');

    expect(read()).toBe(0);
  });
});

describe('las dos configuraciones son independientes', () => {
  it('cambiar el tiempo de navegación no altera el de los formularios', () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '999');
    vi.stubEnv('VITE_MIN_LOADING_MS', '111');

    expect(minimumNavigationMs()).toBe(999);
    expect(minimumLoadingMs()).toBe(111);
  });
});
