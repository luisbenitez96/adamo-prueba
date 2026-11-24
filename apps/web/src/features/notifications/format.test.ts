import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './format';

const NOW = new Date('2030-06-15T12:00:00.000Z');

function ago(milliseconds: number): string {
  return new Date(NOW.getTime() - milliseconds).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it.each([
    [0, 'hace unos segundos'],
    [30 * SECOND, 'hace unos segundos'],
    [59 * SECOND, 'hace unos segundos'],
  ])('%i ms atrás es "%s"', (elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  it.each([
    [60 * SECOND, 'hace 1 minuto'],
    [5 * MINUTE, 'hace 5 minutos'],
    [59 * MINUTE + 59 * SECOND, 'hace 59 minutos'],
  ])('en minutos: %i ms atrás es "%s"', (elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  it.each([
    [HOUR, 'hace 1 hora'],
    [2 * HOUR, 'hace 2 horas'],
    [23 * HOUR + 59 * MINUTE, 'hace 23 horas'],
  ])('en horas: %i ms atrás es "%s"', (elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  it.each([
    [DAY, 'ayer'],
    [3 * DAY, 'hace 3 días'],
    [6 * DAY + 23 * HOUR, 'hace 6 días'],
  ])('en días: %i ms atrás es "%s"', (elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  it('desde 7 días muestra la fecha completa', () => {
    expect(formatRelativeTime('2030-06-08T12:00:00.000Z', NOW)).toBe('08/06/2030');
    expect(formatRelativeTime('2029-01-31T10:00:00.000Z', NOW)).toBe('31/01/2029');
  });

  it('una fecha en el futuro (reloj desajustado) se muestra como reciente', () => {
    expect(formatRelativeTime(ago(-10 * MINUTE), NOW)).toBe('hace unos segundos');
  });
});
