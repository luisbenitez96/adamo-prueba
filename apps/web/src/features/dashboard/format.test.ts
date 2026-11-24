import { describe, expect, it } from 'vitest';
import { formatClientsCount } from './format';

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
