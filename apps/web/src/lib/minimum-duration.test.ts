import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withMinimumDuration } from './minimum-duration';

type Outcome<T> = { value: T } | { error: unknown };

function track<T>(promise: Promise<T>) {
  const state: { outcome: Outcome<T> | null } = { outcome: null };
  promise.then(
    (value) => (state.outcome = { value }),
    (error: unknown) => (state.outcome = { error }),
  );
  return state;
}

describe('withMinimumDuration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('si la tarea es más rápida, espera hasta completar el tiempo mínimo', async () => {
    const state = track(withMinimumDuration(async () => 'listo', 500));

    await vi.advanceTimersByTimeAsync(499);
    expect(state.outcome).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(state.outcome).toEqual({ value: 'listo' });
  });

  it('si la tarea tarda más que el mínimo, no agrega ninguna espera', async () => {
    const slowTask = () =>
      new Promise<string>((resolve) => setTimeout(() => resolve('lento'), 800));
    const state = track(withMinimumDuration(slowTask, 500));

    await vi.advanceTimersByTimeAsync(799);
    expect(state.outcome).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(state.outcome).toEqual({ value: 'lento' });
  });

  it('solo espera lo que falta: descuenta lo que ya tardó la tarea', async () => {
    const task = () => new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 300));
    const state = track(withMinimumDuration(task, 500));

    await vi.advanceTimersByTimeAsync(499);
    expect(state.outcome).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(state.outcome).toEqual({ value: 'ok' });
  });

  it('si la tarea falla rápido, también espera el mínimo y luego propaga el error', async () => {
    const failure = new Error('falló');
    const state = track(
      withMinimumDuration(async () => {
        throw failure;
      }, 500),
    );

    await vi.advanceTimersByTimeAsync(499);
    expect(state.outcome).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(state.outcome).toEqual({ error: failure });
  });

  it('con un mínimo de 0 no espera nada', async () => {
    const state = track(withMinimumDuration(async () => 'ya', 0));

    await vi.advanceTimersByTimeAsync(0);

    expect(state.outcome).toEqual({ value: 'ya' });
  });
});
