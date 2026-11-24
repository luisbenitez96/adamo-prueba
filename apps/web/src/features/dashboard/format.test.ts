import { describe, expect, it } from 'vitest';
import {
  formatClientsCount,
  formatCount,
  formatRange,
  formatRegistrationDate,
  formatShare,
} from './format';

describe('formatClientsCount', () => {
  it.each([
    [3827, '3.827 clientes'],
    [9411, '9.411 clientes'],
    [793, '793 clientes'],
    [2738, '2.738 clientes'],
    [1_000_000, '1.000.000 clientes'],
  ])('%i se muestra como "%s", con punto como separador de miles', (count, expected) => {
    expect(formatClientsCount(count)).toBe(expected);
  });

  it('usa el singular para un solo cliente', () => {
    expect(formatClientsCount(1)).toBe('1 cliente');
  });

  it('usa el plural para cero clientes', () => {
    expect(formatClientsCount(0)).toBe('0 clientes');
  });
});

describe('formatRegistrationDate', () => {
  it('muestra día/mes/año con ceros', () => {
    expect(formatRegistrationDate('2025-03-05T00:00:00.000Z')).toBe('05/03/2025');
  });

  it('usa la fecha en UTC, sin depender de la zona horaria del navegador', () => {
    expect(formatRegistrationDate('2025-12-31T23:59:59.000Z')).toBe('31/12/2025');
  });
});

describe('formatRange', () => {
  it('describe el rango de la primera página', () => {
    expect(formatRange(1, 20, 3827)).toBe('1–20 de 3.827 clientes');
  });

  it('la última página termina en el total', () => {
    expect(formatRange(192, 20, 3827)).toBe('3.821–3.827 de 3.827 clientes');
  });

  it('con un solo cliente usa el singular', () => {
    expect(formatRange(1, 20, 1)).toBe('1–1 de 1 cliente');
  });

  it('sin clientes lo dice', () => {
    expect(formatRange(1, 20, 0)).toBe('0 clientes');
  });
});

describe('formatCount', () => {
  it('usa punto como separador de miles', () => {
    expect(formatCount(16769)).toBe('16.769');
    expect(formatCount(793)).toBe('793');
    expect(formatCount(0)).toBe('0');
  });
});

describe('formatShare', () => {
  it('calcula el porcentaje redondeado', () => {
    expect(formatShare(7, 10)).toBe('70 %');
    expect(formatShare(1, 3)).toBe('33 %');
    expect(formatShare(2, 3)).toBe('67 %');
  });

  it('el total completo es 100 %', () => {
    expect(formatShare(5, 5)).toBe('100 %');
  });

  it('sin total no divide entre cero', () => {
    expect(formatShare(0, 0)).toBe('0 %');
  });
});
