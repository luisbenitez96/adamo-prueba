import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNavigationLoader } from './navigation-loader';

function track(promise: Promise<unknown>) {
  const state = { done: false };
  promise.then(() => (state.done = true));
  return state;
}

describe('createNavigationLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('la primera carga no espera: abrir la aplicación no se retrasa', async () => {
    const loader = createNavigationLoader();
    const state = track(loader());

    await vi.advanceTimersByTimeAsync(0);

    expect(state.done).toBe(true);
  });

  it('desde el segundo cambio de pantalla espera el tiempo mínimo', async () => {
    const loader = createNavigationLoader();
    await loader();
    const state = track(loader());

    await vi.advanceTimersByTimeAsync(299);
    expect(state.done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.done).toBe(true);
  });

  it('cada cambio de pantalla posterior también espera', async () => {
    const loader = createNavigationLoader();
    await loader();
    const second = loader();
    await vi.advanceTimersByTimeAsync(300);
    await second;

    const state = track(loader());
    await vi.advanceTimersByTimeAsync(299);

    expect(state.done).toBe(false);
  });

  it('devuelve null porque la ruta no necesita datos', async () => {
    const loader = createNavigationLoader();

    expect(await loader()).toBeNull();
  });

  it('con 0 ms no espera nada', async () => {
    vi.stubEnv('VITE_MIN_NAVIGATION_MS', '0');
    const loader = createNavigationLoader();
    await loader();
    const state = track(loader());

    await vi.advanceTimersByTimeAsync(0);

    expect(state.done).toBe(true);
  });

  it('cada cargador tiene su propia primera carga', async () => {
    const first = createNavigationLoader();
    await first();
    await vi.advanceTimersByTimeAsync(0);

    const state = track(createNavigationLoader()());
    await vi.advanceTimersByTimeAsync(0);

    expect(state.done).toBe(true);
  });
});
